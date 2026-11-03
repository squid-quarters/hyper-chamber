<script lang="ts">
	import type { Reference } from '@hyper-chamber/reference';
	let { reference }: { reference: Reference } = $props();
	let video = $state<HTMLVideoElement | undefined>();
	let loop = $state(false);
	let speed = $state('1');
	let error = $state('');
	let activeFrame = $state<string | null>(null);
	function seek(at: number, id?: string) {
		if (!video) return;
		video.currentTime = at;
		video.pause();
		activeFrame = id ?? null;
	}
	async function replay() {
		if (!video) return;
		video.currentTime = 0;
		try {
			await video.play();
		} catch {
			error = 'Playback could not start. Use the player controls or open the original source.';
		}
	}
</script>

<div class="media-block">
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
			onerror={() => (error = 'This clip could not load. Open the original source below.')}
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
			<button class="button small" onclick={replay}><span aria-hidden="true">↻</span> Replay</button
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
			<span class="muted player-hint">Sound off by default</span>
		</div>
	{:else}<img
			class="video-poster"
			src={reference.media.poster}
			alt={`Source still for ${reference.title}`}
		/>
		<p class="notice">Local replay unavailable. Use the source link below.</p>{/if}
	{#if error}<p class="notice" role="alert">{error}</p>{/if}
	<div class="section-heading frames-heading">
		<h3>Key moments</h3>
		<span class="muted">Select a frame to inspect</span>
	</div>
	<ol class="filmstrip">
		{#each reference.media.frames as frame, i}
			<li>
				<button
					class="frame"
					class:active={activeFrame === frame.id}
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
