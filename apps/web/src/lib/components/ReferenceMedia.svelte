<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Play, Pause, RotateCcw, ArrowUpRight } from '@lucide/svelte';
	import { sourceLink, type Reference } from '@hyper-chamber/reference';
	import {
		clampTime,
		dragAxis,
		relativeSeek,
		readLoopPreference,
		saveLoopPreference,
		type DragAxis,
	} from '../player';

	let {
		reference,
		layout = 'default',
		beforeReplay,
	}: {
		reference: Reference;
		layout?: 'default' | 'practice';
		beforeReplay?: Snippet;
	} = $props();
	let video = $state<HTMLVideoElement | undefined>();
	let player = $state<HTMLDivElement | undefined>();
	let stage = $state<HTMLDivElement | undefined>();
	let enhanced = $state(false);
	let loop = $state(true);
	let speed = $state('1');
	let error = $state('');
	let ready = $state(false);
	let retrying = $state(false);
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let scrubbing = $state(false);
	let positionStatus = $state('');
	let activeFrame = $state<string | null>(null);
	let pendingSeek: { at: number; id?: string } | null = null;
	let drag: {
		pointerId: number;
		x: number;
		y: number;
		at: number;
		width: number;
		axis: DragAxis;
	} | null = null;
	let suppressClick = false;

	onMount(() => {
		loop = readLoopPreference();
		enhanced = true;
		if (video && video.readyState >= 1) loaded();
		const mountedVideo = video;
		return () => mountedVideo?.pause();
	});

	function seek(at: number, id?: string, announce = true) {
		if (!video) return;
		// Native looping can rewind a seek at the end even while paused.
		// Disable it before seeking, without changing the remembered preference.
		video.loop = false;
		video.pause();
		playing = false;
		if (video.readyState < 1) {
			pendingSeek = { at, id };
			video.load();
			return;
		}
		video.currentTime = clampTime(at, video.duration);
		currentTime = video.currentTime;
		activeFrame = id ?? null;
		if (announce) announcePosition();
	}
	function inspectFrame(at: number, id: string) {
		seek(at, id);
		if (layout !== 'practice' || !stage) return;
		const bounds = stage.getBoundingClientRect();
		const safeTop = Number.parseFloat(getComputedStyle(stage).scrollMarginBlockStart) || 0;
		if (bounds.top < safeTop || bounds.bottom > window.innerHeight) {
			stage.scrollIntoView({ block: 'center' });
		}
	}
	function loaded() {
		if (!video) return;
		ready = Number.isFinite(video.duration) && video.duration > 0;
		duration = ready ? video.duration : 0;
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
	async function play() {
		if (!video) return;
		try {
			await video.play();
			error = '';
		} catch (cause) {
			if (cause instanceof DOMException && cause.name === 'AbortError') return;
			error = 'Playback could not start. Retry the clip or open the original source.';
		}
	}
	function togglePlayback() {
		if (!video) return;
		if (video.paused) void play();
		else video.pause();
	}
	function replay() {
		if (!video) return;
		pendingSeek = null;
		if (video.readyState >= 1) seek(0, undefined, false);
		else video.load();
		void play();
	}
	function toggleLoop() {
		loop = !loop;
		saveLoopPreference(loop);
	}
	function announcePosition() {
		if (!ready || !video) return;
		currentTime = video.currentTime;
		positionStatus = `${video.paused ? 'Paused' : 'Playing'} at ${currentTime.toFixed(2)} of ${duration.toFixed(2)} seconds.`;
	}
	function paused() {
		if (video?.paused) video.loop = false;
		playing = !!video && !video.paused;
		if (video?.paused && !scrubbing) announcePosition();
	}
	function timeChanged() {
		if (!video) return;
		currentTime = video.currentTime;
		const frame = reference.media.frames.find((frame) => frame.id === activeFrame);
		if (frame && Math.abs(video.currentTime - frame.at) > 0.08) activeFrame = null;
	}
	function pointerDown(event: PointerEvent) {
		if (!ready || !video || !event.isPrimary || event.button !== 0 || drag) return;
		const surface = event.currentTarget as HTMLButtonElement;
		suppressClick = false;
		drag = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			at: video.currentTime,
			width: surface.clientWidth,
			axis: 'pending',
		};
		try {
			surface.setPointerCapture(event.pointerId);
		} catch {
			drag = null;
		}
	}
	function pointerMove(event: PointerEvent, checkButtons = true) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		if (checkButtons && event.pointerType === 'mouse' && !(event.buttons & 1)) {
			finishPointer(event, true);
			return;
		}
		const dx = event.clientX - drag.x;
		if (drag.axis === 'pending') drag.axis = dragAxis(dx, event.clientY - drag.y);
		if (drag.axis !== 'pending') suppressClick = true;
		if (drag.axis !== 'horizontal') return;
		scrubbing = true;
		seek(relativeSeek(drag.at, dx, drag.width, duration), undefined, false);
	}
	function finishPointer(event: PointerEvent, cancelled = false) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		if (!cancelled) pointerMove(event, false);
		// A scroll, cancelled pointer, or drag must never turn into a play click.
		suppressClick ||= cancelled || drag?.axis !== 'pending';
		drag = null;
		if (scrubbing) announcePosition();
		scrubbing = false;
		const surface = event.currentTarget as HTMLButtonElement;
		if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
	}
	function surfaceClick(event: MouseEvent) {
		if (suppressClick && event.detail > 0) {
			suppressClick = false;
			return;
		}
		suppressClick = false;
		togglePlayback();
	}
	function shortcut(event: KeyboardEvent) {
		if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
			return;
		const target = event.target;
		if (
			!(target instanceof HTMLElement) ||
			!player?.contains(target) ||
			!target.closest('.replay-panel, .filmstrip') ||
			target.closest('input, textarea, select, [contenteditable]')
		)
			return;
		const key = event.key.toLowerCase();
		if (key === 'r') {
			event.preventDefault();
			replay();
		} else if (
			ready &&
			video &&
			(key === 'j' || key === 'l' || key === 'arrowleft' || key === 'arrowright')
		) {
			event.preventDefault();
			seek(video.currentTime + (key === 'j' || key === 'arrowleft' ? -0.25 : 0.25));
		}
	}
	function timestamp(at: number) {
		const safeTime = Number.isFinite(at) ? Math.max(0, at) : 0;
		return `${Math.floor(safeTime / 60)}:${(safeTime % 60).toFixed(2).padStart(5, '0')}`;
	}
</script>

<svelte:window onkeydown={shortcut} />

{#snippet frameList()}
	<ol class="filmstrip" role="list">
		{#each reference.media.frames as frame, i}
			<li>
				<button
					class="frame"
					class:active={activeFrame === frame.id}
					aria-pressed={activeFrame === frame.id}
					onclick={() => inspectFrame(frame.at, frame.id)}
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
{/snippet}

{#snippet playbackNotices()}
	{#if error}<div class="notice media-error" role="alert">
			<p>{error}</p>
			<div>
				<button class="button small" onclick={retry}>Retry clip</button>
				<a href={sourceLink(reference)} target="_blank" rel="noreferrer">Open original source ↗</a>
			</div>
		</div>{/if}
	{#if retrying}<p class="muted media-loading" role="status">Loading clip…</p>{/if}
{/snippet}

<div class="media-block" class:practice-media={layout === 'practice'} bind:this={player}>
	<div class="media-core" class:practice-core={layout === 'practice'}>
		{@render beforeReplay?.()}
		<div class="replay-panel">
			<div class="section-heading">
				<h3>Replay reference</h3>
			</div>

			{#if reference.media.clip}
				<div class="video-stage" class:scrubbing bind:this={stage}>
					<video
						bind:this={video}
						src={reference.media.clip}
						poster={reference.media.poster}
						controls={!enhanced}
						muted
						playsinline
						loop={enhanced ? loop && playing : loop}
						preload="metadata"
						width="1280"
						height="720"
						aria-label={`${reference.title} source clip`}
						onloadedmetadata={loaded}
						ondurationchange={loaded}
						onplay={() => (playing = !!video && !video.paused)}
						onpause={paused}
						onended={paused}
						onplaying={() => {
							error = '';
							retrying = false;
							activeFrame = null;
						}}
						ontimeupdate={timeChanged}
						onerror={() => {
							ready = false;
							playing = false;
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
					{#if enhanced}
						<button
							class="video-surface"
							aria-label={`${playing ? 'Pause' : 'Play'} ${reference.title} source clip`}
							aria-describedby={`${reference.id}-player-hint ${reference.id}-position`}
							onclick={surfaceClick}
							onpointerdown={pointerDown}
							onpointermove={pointerMove}
							onpointerup={(event) => finishPointer(event)}
							onpointercancel={(event) => finishPointer(event, true)}
							onlostpointercapture={(event) => finishPointer(event, true)}
						></button>
						<div class="scrub-feedback" aria-hidden="true">
							<span>{timestamp(currentTime)} <span>/ {timestamp(duration)}</span></span>
							<div class="scrub-progress">
								<div style:width={`${duration ? (currentTime / duration) * 100 : 0}%`}></div>
							</div>
						</div>
					{/if}
				</div>
				<div class="player-bottom">
					{#if enhanced}
						<p class="sr-only" id={`${reference.id}-position`}>
							Position {currentTime.toFixed(2)} of {duration.toFixed(2)} seconds.
						</p>
						<p class="sr-only" role="status" aria-atomic="true">{positionStatus}</p>
						<div class="player-toolbar">
							<button
								class="button small playback-button"
								onclick={togglePlayback}
								aria-label={playing ? 'Pause clip' : 'Play clip'}
							>
								{#if playing}<Pause size={13} aria-hidden="true" />{:else}<Play
										size={13}
										fill="currentColor"
										aria-hidden="true"
									/>{/if}{playing ? 'Pause' : 'Play'}
							</button>
							<button class="button small" onclick={replay} aria-keyshortcuts="R"
								><RotateCcw size={13} aria-hidden="true" />Replay</button
							>
							<button
								class="button small"
								class:enabled={loop}
								aria-pressed={loop}
								onclick={toggleLoop}>Loop</button
							>
							<label class="speed" for={`${reference.id}-speed`}
								>Speed <select
									id={`${reference.id}-speed`}
									bind:value={speed}
									onchange={(e) => {
										speed = e.currentTarget.value;
										if (video) video.playbackRate = Number(speed);
									}}
									><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option
										value="1">1×</option
									></select
								></label
							>
							<div class="seek-controls" role="group" aria-label="Inspect clip timing">
								<button
									class="button small"
									disabled={!ready}
									aria-keyshortcuts="J ArrowLeft"
									aria-describedby={`${reference.id}-position`}
									onclick={() => video && seek(video.currentTime - 0.25)}
									aria-label="Back 0.25 seconds">−0.25s</button
								>
								<button
									class="button small"
									disabled={!ready}
									aria-keyshortcuts="L ArrowRight"
									aria-describedby={`${reference.id}-position`}
									onclick={() => video && seek(video.currentTime + 0.25)}
									aria-label="Forward 0.25 seconds">+0.25s</button
								>
							</div>
						</div>
						<div class="player-discovery">
							<p id={`${reference.id}-player-hint`}>
								Tap to play or pause · Drag sideways to inspect
							</p>
							<details class="player-help">
								<summary>Keys</summary>
								<p>
									With the video focused, <kbd>Space</kbd> plays or pauses. With a clip control
									focused,
									<kbd>R</kbd>
									replays; <kbd>J</kbd> / <kbd>L</kbd> or <kbd>←</kbd> / <kbd>→</kbd> pause and move 0.25
									seconds. Use the timing buttons or key moments to seek without dragging. Sound is off.
								</p>
							</details>
						</div>
					{/if}
					{@render playbackNotices()}
				</div>
			{:else}
				<div class="video-stage" bind:this={stage}>
					<img
						class="video-poster"
						src={reference.media.poster}
						alt={`Source still for ${reference.title}`}
					/>
				</div>
				<div class="player-bottom">
					<p class="notice">
						Local replay unavailable. <a
							href={sourceLink(reference)}
							target="_blank"
							rel="noreferrer"
							>Open the original source<ArrowUpRight size={13} aria-hidden="true" /></a
						>
					</p>
					{@render playbackNotices()}
				</div>
			{/if}
		</div>
	</div>
	{#if layout === 'practice'}
		<details class="key-moments">
			<summary>Key moments <span>({reference.media.frames.length})</span></summary>
			<p class="frames-instruction muted">Select a frame to inspect</p>
			{@render frameList()}
		</details>
	{:else}
		<div class="section-heading frames-heading">
			<h3>Key moments</h3>
			<span class="muted">Select a frame to inspect</span>
		</div>
		{@render frameList()}
	{/if}
</div>

<style>
	.replay-panel > .section-heading {
		margin-bottom: 18px;
	}
	.practice-media .practice-core {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		gap: 12px;
		block-size: var(--practice-core-height, calc(100svh - 112px));
		min-block-size: var(--practice-core-min-height, 29rem);
		padding: 14px 0 12px;
	}
	.practice-media .replay-panel {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 5px;
		min-inline-size: 0;
		min-block-size: 0;
	}
	.practice-media .replay-panel > .section-heading {
		margin: 0;
		min-block-size: 20px;
	}
	.practice-media .video-stage {
		display: grid;
		place-items: center;
		min-inline-size: 0;
		min-block-size: 0;
		background: #171a16;
		scroll-margin-block-start: var(--practice-header-offset, 112px);
		scroll-margin-block-end: 8px;
	}
	.practice-media .video-stage video,
	.practice-media .video-stage .video-poster {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		min-block-size: 0;
		max-inline-size: 100%;
		max-block-size: 100%;
		object-fit: contain;
	}
	.practice-media .player-bottom {
		min-inline-size: 0;
	}
	.practice-media .player-toolbar {
		padding-block: 3px;
		min-block-size: 38px;
	}
	.practice-media .player-toolbar .button,
	.practice-media .speed select {
		min-height: 32px;
		padding-block: 4px;
	}
	.practice-media .player-discovery {
		margin-block: 2px 0;
		min-block-size: 24px;
		font-size: 11px;
	}
	.practice-media .player-help summary {
		min-height: 24px;
	}
	.practice-media .key-moments {
		margin-inline: 0;
		border-top: 1px solid var(--line);
	}
	.practice-media .key-moments > summary {
		cursor: pointer;
		min-block-size: 44px;
		padding-block: 12px;
		font-weight: 600;
	}
	.practice-media .key-moments > summary > span {
		margin-inline-start: 6px;
		color: var(--muted);
		font-weight: 400;
	}
	.practice-media .key-moments .frames-instruction {
		margin-block: 0 10px;
		font-size: 12px;
	}
	.practice-media .key-moments .filmstrip {
		margin-bottom: 18px;
	}
	/* Expanded guidance grows the page instead of consuming the replay's grid row. */
	.practice-media
		.practice-core:has(
			:global(.compact-text-notation),
			.player-help[open],
			.media-error,
			.media-loading
		) {
		block-size: auto;
		min-block-size: 0;
		grid-template-rows: auto auto auto;
		.replay-panel {
			grid-template-rows: auto auto auto;
		}
		.video-stage {
			aspect-ratio: 16 / 9;
			block-size: auto;
		}
		.video-stage video,
		.video-stage .video-poster {
			block-size: auto;
			aspect-ratio: 16 / 9;
		}
	}
	@media (min-width: 761px) and (max-height: 650px) {
		.practice-media .practice-core {
			gap: 8px;
			padding-block: 8px;
		}
		.practice-media .player-toolbar {
			padding-block: 1px;
			min-block-size: 34px;
		}
	}
	@media (max-width: 760px), (max-height: 420px) {
		.practice-media .practice-core {
			block-size: auto;
			min-block-size: 0;
			grid-template-rows: none;
			padding: 14px 0;
		}
		.practice-media .replay-panel {
			grid-template-rows: auto auto auto;
		}
		.practice-media .video-stage {
			aspect-ratio: 16 / 9;
			block-size: auto;
		}
		.practice-media .video-stage video {
			block-size: auto;
			aspect-ratio: 16 / 9;
		}
		.practice-media .key-moments {
			margin-inline: 0;
		}
	}
	.video-stage {
		position: relative;
	}
	.video-surface {
		position: absolute;
		inset: 0;
		width: 100%;
		touch-action: pan-y pinch-zoom;
		cursor: grab;
		-webkit-user-select: none;
		user-select: none;
	}
	.video-surface:focus-visible {
		outline: 2px solid var(--panel-accent);
		outline-offset: -2px;
	}
	.scrubbing .video-surface {
		cursor: grabbing;
	}
	.scrub-feedback {
		position: absolute;
		inset: auto 0 0;
		pointer-events: none;
		opacity: 0;
		color: var(--panel-ink);
		background: linear-gradient(transparent, #000b);
		padding: 24px 12px 10px;
		font:
			11px/1.5 ui-monospace,
			monospace;
	}
	.scrubbing .scrub-feedback,
	.video-stage:has(.video-surface:focus-visible) .scrub-feedback {
		opacity: 1;
	}
	.scrub-feedback > span {
		display: block;
		margin-bottom: 7px;
	}
	.scrub-feedback > span > span {
		color: var(--panel-muted);
	}
	.scrub-progress {
		height: 2px;
		background: #fff5;
	}
	.scrub-progress > div {
		height: 100%;
		background: var(--panel-accent);
	}
	.player-toolbar {
		gap: 0;
		padding: 8px 0;
		border-bottom: 1px solid var(--line);
	}
	.player-toolbar .button {
		border-color: transparent;
		background: transparent;
		padding-inline: 9px;
		gap: 5px;
	}
	.player-toolbar .button:hover {
		background: var(--soft);
	}
	.player-toolbar .button.enabled {
		color: var(--accent);
		background: var(--selected);
	}
	.playback-button {
		min-width: 78px;
		justify-content: flex-start;
	}
	.speed {
		gap: 4px;
		padding-inline: 9px;
	}
	.speed select {
		border-color: transparent;
		background-color: transparent;
		padding-inline: 6px 30px;
		background-position: right 10px center;
	}
	.seek-controls {
		display: flex;
		margin-left: auto;
		border-left: 1px solid var(--line);
	}
	.player-discovery {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin: 8px 0 14px;
		font-size: 11px;
		color: var(--muted);
	}
	.player-help {
		text-align: right;
	}
	.player-help summary {
		min-height: 28px;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.player-help[open] {
		max-width: 35ch;
	}
	.player-help p {
		line-height: 1.7;
		margin-top: 6px;
		text-align: left;
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
	@media (max-width: 480px) {
		.player-toolbar .button {
			padding-inline: 6px;
		}
		.speed {
			padding-inline: 5px;
		}
		.seek-controls {
			margin-left: 0;
		}
	}
	@media (forced-colors: active) {
		.video-surface:focus-visible {
			outline-color: Highlight;
		}
		.scrub-progress > div {
			background: Highlight;
		}
		.player-toolbar .button.enabled {
			border-color: Highlight;
		}
	}
</style>
