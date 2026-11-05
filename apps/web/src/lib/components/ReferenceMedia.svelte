<script lang="ts">
	import { sourceLink, type Reference } from '@hyper-chamber/reference';
	let { reference }: { reference: Reference } = $props();
	let video = $state<HTMLVideoElement | undefined>();
	let player = $state<HTMLDivElement | undefined>();
	let loop = $state(false);
	let speed = $state('1');
	let error = $state('');
	let ready = $state(false);
	let retrying = $state(false);
	let activeFrame = $state<string | null>(null);
	let pendingSeek: { at: number; id?: string } | null = null;
	function seek(at: number, id?: string) {
		if (!video) return;
		video.pause();
		if (video.readyState < 1) {
			pendingSeek = { at, id };
			video.load();
			return;
		}
		video.currentTime = Math.max(0, Math.min(at, Math.max(0, video.duration - 0.001)));
		activeFrame = id ?? null;
	}
	function loaded() {
		if (!video) return;
		ready = true;
		retrying = false;
		error = '';
		video.playbackRate = Number(speed);
		if (pendingSeek) {
			const target = pendingSeek;
			pendingSeek = null;
			seek(target.at, target.id);
		}
	}
	function retry() {
		if (!video || !reference.media.clip) return;
		error = '';
		retrying = true;
		ready = false;
		pendingSeek = null;
		activeFrame = null;
		video.src = reference.media.clip;
		video.load();
	}
	async function replay() {
		if (!video) return;
		try {
			pendingSeek = null;
			video.currentTime = 0;
			await video.play();
			error = '';
		} catch {
			error = 'Playback could not start. Use the player controls or open the original source.';
		}
	}
	function timeChanged() {
		const frame = reference.media.frames.find((frame) => frame.id === activeFrame);
		if (video && frame && Math.abs(video.currentTime - frame.at) > 0.08) activeFrame = null;
	}
	function shortcut(event: KeyboardEvent) {
		if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
			return;
		const target = event.target;
		if (
			!(target instanceof HTMLElement) ||
			!player?.contains(target) ||
			target.closest('input, textarea, select, [contenteditable]')
		)
			return;
		const key = event.key.toLowerCase();
		if (key === 'r') {
			event.preventDefault();
			void replay();
		} else if (ready && video && (key === 'j' || key === 'l')) {
			event.preventDefault();
			seek(video.currentTime + (key === 'j' ? -0.25 : 0.25));
		}
	}
</script>

<svelte:window onkeydown={shortcut} />

<div class="media-block" bind:this={player}>
	<div class="section-heading">
		<h3>Replay reference</h3>
		<span class="eyebrow">SOURCE FOOTAGE</span>
	</div>
	{#if reference.media.clip}
		<video
			bind:this={video}
			src={reference.media.clip}
			poster={reference.media.poster}
			controls
			muted
			playsinline
			{loop}
			preload="metadata"
			width="1280"
			height="720"
			aria-label={`${reference.title} source clip`}
			onloadedmetadata={loaded}
			onplaying={() => {
				error = '';
				ready = true;
				retrying = false;
				activeFrame = null;
			}}
			ontimeupdate={timeChanged}
			onerror={() => {
				ready = false;
				retrying = false;
				error = 'This clip could not load. Retry it or open the original source.';
			}}
		>
			{#if reference.media.descriptionTrack}
				<track
					kind="descriptions"
					src={reference.media.descriptionTrack}
					srclang="en"
					label="English action descriptions"
				/>
			{/if}
		</video>
		<div class="player-toolbar">
			<button class="button small" onclick={replay} aria-keyshortcuts="R"
				><span aria-hidden="true">↻</span> Replay</button
			>
			<button
				class="button small"
				class:enabled={loop}
				aria-pressed={loop}
				onclick={() => (loop = !loop)}>Loop {loop ? 'on' : 'off'}</button
			>
			<label class="speed"
				>Speed <select
					bind:value={speed}
					onchange={(e) => {
						speed = e.currentTarget.value;
						if (video) video.playbackRate = Number(speed);
					}}
					><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1"
						>1×</option
					></select
				></label
			>
			<div class="seek-controls" role="group" aria-label="Inspect clip timing">
				<button
					class="button small"
					disabled={!ready}
					aria-keyshortcuts="J"
					onclick={() => video && seek(video.currentTime - 0.25)}
					aria-label="Back 0.25 seconds">−0.25s</button
				>
				<button
					class="button small"
					disabled={!ready}
					aria-keyshortcuts="L"
					onclick={() => video && seek(video.currentTime + 0.25)}
					aria-label="Forward 0.25 seconds">+0.25s</button
				>
			</div>
			<span class="muted player-hint">Sound off by default</span>
		</div>
		<details class="player-help">
			<summary>Clip shortcuts</summary>
			<p>
				With a clip control focused: <kbd>R</kbd> replays; <kbd>J</kbd> / <kbd>L</kbd> pause and move
				back / forward 0.25 seconds. Shortcuts stay inside the clip controls.
			</p>
		</details>
	{:else}<img
			class="video-poster"
			src={reference.media.poster}
			alt={`Source still for ${reference.title}`}
		/>
		<p class="notice">
			Local replay unavailable. <a href={sourceLink(reference)} target="_blank" rel="noreferrer"
				>Open the original source ↗</a
			>
		</p>{/if}
	{#if error}<div class="notice media-error" role="alert">
			<p>{error}</p>
			<div>
				<button class="button small" onclick={retry}>Retry clip</button>
				<a href={sourceLink(reference)} target="_blank" rel="noreferrer">Open original source ↗</a>
			</div>
		</div>{/if}
	{#if retrying}<p class="muted" role="status">Loading clip…</p>{/if}
	<div class="section-heading frames-heading">
		<h3>Key moments</h3>
		<span class="muted">Select a frame to inspect</span>
	</div>
	<ol class="filmstrip" role="list">
		{#each reference.media.frames as frame, i}
			<li>
				<button
					class="frame"
					class:active={activeFrame === frame.id}
					aria-pressed={activeFrame === frame.id}
					onclick={() => seek(frame.at, frame.id)}
					disabled={!reference.media.clip}
					aria-label={`Seek to ${frame.label}, ${frame.at.toFixed(1)} seconds`}
					aria-describedby={`${reference.id}-${frame.id}-description`}
					><div class="frame-image">
						<img src={frame.src} alt={frame.alt} loading="lazy" width="640" height="360" /><span
							class="frame-number">0{i + 1}</span
						>
					</div>
					<span class="frame-caption">{frame.label}<span>{frame.at.toFixed(1)}s</span></span>
					<span class="sr-only" id={`${reference.id}-${frame.id}-description`}>{frame.alt}</span>
				</button>
			</li>
		{/each}
	</ol>
</div>

<style>
	.seek-controls {
		display: flex;
		gap: 4px;
	}
	.player-help {
		margin: 2px 0 14px;
		font-size: 12px;
		color: var(--muted);
	}
	.player-help summary {
		width: fit-content;
		min-height: 32px;
		padding: 4px 0;
		cursor: pointer;
	}
	.player-help p {
		max-width: 60ch;
		line-height: 1.7;
		margin-top: 6px;
	}
	kbd {
		font: inherit;
		font-family: ui-monospace, monospace;
		color: var(--ink);
	}
	.media-error > div {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		margin-top: 10px;
	}
	.media-error a {
		font-size: 12px;
	}
</style>
