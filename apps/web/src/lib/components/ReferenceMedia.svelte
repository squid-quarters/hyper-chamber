<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Play, Pause, RotateCcw, Repeat2, Volume2, VolumeX, ArrowUpRight } from '@lucide/svelte';
	import ChoiceField from './ChoiceField.svelte';
	import PlaybackSettings from './PlaybackSettings.svelte';
	import PlaybackHelp from './PlaybackHelp.svelte';
	import { sourceLink, type Reference } from '@hyper-chamber/reference';
	import {
		clampTime,
		dragAxis,
		relativeSeek,
		OPEN_OVERLAY_SELECTOR,
		isPlaybackSpeed,
		type PlaybackPreferences,
		type DragAxis,
	} from '../player';

	let {
		reference,
		layout = 'default',
		beforeReplay,
		preferences,
		startPlaying = false,
		onpreferencechange,
	}: {
		reference: Reference;
		layout?: 'default' | 'practice';
		beforeReplay?: Snippet;
		preferences: PlaybackPreferences;
		startPlaying?: boolean;
		onpreferencechange: (patch: Partial<PlaybackPreferences>) => void;
	} = $props();
	let video = $state<HTMLVideoElement | undefined>();
	let player = $state<HTMLDivElement | undefined>();
	let stage = $state<HTMLDivElement | undefined>();
	let enhanced = $state(false);
	let loop = $derived(preferences.loop);
	let speed = $derived(preferences.speed);
	let hasAudio = $derived(reference.media.hasAudio === true);
	let muted = $derived(preferences.muted || !hasAudio);
	let autoplayNotice = $state('');
	let playAttempt = 0;
	let disposed = false;
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
		enhanced = true;
		if (video) {
			video.playbackRate = speed;
			video.muted = muted;
		}
		if (video && video.readyState >= 1) loaded();
		const mountedVideo = video;
		if (startPlaying && mountedVideo) void play(true);
		return () => {
			disposed = true;
			playAttempt++;
			mountedVideo?.pause();
		};
	});

	$effect(() => {
		if (video) {
			video.playbackRate = speed;
			video.muted = muted;
		}
	});
	function cancelPendingPlay() {
		playAttempt++;
		autoplayNotice = '';
	}
	function seek(at: number, id?: string, announce = true) {
		if (!video) return;
		cancelPendingPlay();
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
		cancelPendingPlay();
		video.pause();
		error = '';
		retrying = true;
		ready = false;
		pendingSeek = null;
		activeFrame = null;
		video.src = reference.media.clip;
		video.load();
	}
	async function play(automatic = false) {
		if (!video || disposed) return;
		const target = video;
		const attempt = ++playAttempt;
		target.loop = loop;
		// Apply the remembered sound choice before play, including automatic starts.
		target.muted = muted;
		try {
			await target.play();
			if (disposed || attempt !== playAttempt || target !== video) return;
			error = '';
			autoplayNotice = '';
		} catch (cause) {
			if (disposed || attempt !== playAttempt || target !== video) return;
			if (cause instanceof DOMException && cause.name === 'AbortError') return;
			if (automatic && cause instanceof DOMException && cause.name === 'NotAllowedError') {
				autoplayNotice = 'Autoplay was blocked. Select Play to start.';
				return;
			}
			error = 'Playback could not start. Retry the clip or open the original source.';
		}
	}
	function togglePlayback() {
		if (!video) return;
		if (video.paused) void play();
		else {
			cancelPendingPlay();
			video.pause();
		}
	}
	function replay() {
		if (!video) return;
		pendingSeek = null;
		if (video.readyState >= 1) seek(0, undefined, false);
		else video.load();
		void play();
	}
	function toggleLoop() {
		onpreferencechange({ loop: !loop });
	}
	function toggleSound() {
		if (!hasAudio) return;
		const nextMuted = !preferences.muted;
		if (video) video.muted = nextMuted;
		onpreferencechange({ muted: nextMuted });
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
		if (
			event.defaultPrevented ||
			event.repeat ||
			event.isComposing ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			document.querySelector(OPEN_OVERLAY_SELECTOR)
		)
			return;
		const target = event.target;
		if (
			!(target instanceof HTMLElement) ||
			!player?.contains(target) ||
			!target.closest('.replay-panel, .filmstrip') ||
			target.closest(
				'input, textarea, select, [contenteditable], [role="combobox"], [role="listbox"], [role="option"], [role="menu"]',
			)
		)
			return;
		const key = event.key.toLowerCase();
		if (key === 'r') {
			if (!preferences.shortcuts) return;
			event.preventDefault();
			replay();
		} else if (
			ready &&
			video &&
			(key === 'j' || key === 'l' || key === 'arrowleft' || key === 'arrowright')
		) {
			if ((key === 'j' || key === 'l') && !preferences.shortcuts) return;
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
				<button class="button" onclick={retry}>Retry clip</button>
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
				<h2>Replay reference</h2>
				{#if enhanced && reference.media.clip}<PlaybackHelp id={reference.id} />{/if}
			</div>

			{#if reference.media.clip}
				<div class="video-stage" class:scrubbing bind:this={stage}>
					<video
						bind:this={video}
						src={reference.media.clip}
						poster={reference.media.poster}
						controls={!enhanced}
						{muted}
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
							<div class="transport-controls" role="group" aria-label="Playback">
								<button
									class="button playback-button"
									aria-keyshortcuts={preferences.shortcuts ? 'K' : undefined}
									onclick={togglePlayback}
									aria-label={playing ? 'Pause clip' : 'Play clip'}
								>
									{#if playing}<Pause size={16} aria-hidden="true" />{:else}<Play
											size={16}
											fill="currentColor"
											aria-hidden="true"
										/>{/if}
									{playing ? 'Pause' : 'Play'}
								</button>
								<button
									class="button button--quiet replay-button"
									onclick={replay}
									aria-keyshortcuts={preferences.shortcuts ? 'R' : undefined}
									><RotateCcw size={16} aria-hidden="true" />Replay</button
								>
								<button
									class="button button--quiet"
									class:enabled={loop}
									aria-pressed={loop}
									onclick={toggleLoop}><Repeat2 size={16} aria-hidden="true" />Loop</button
								>
								<button
									class="button button--quiet sound-button"
									class:enabled={!muted}
									aria-label="Sound"
									aria-pressed={!muted}
									aria-describedby={`${reference.id}-sound-description`}
									disabled={!hasAudio}
									title={hasAudio
										? muted
											? 'Turn source audio on'
											: 'Turn source audio off'
										: 'Source audio unavailable'}
									onclick={toggleSound}
								>
									{#if muted}<VolumeX size={16} aria-hidden="true" />{:else}<Volume2
											size={16}
											aria-hidden="true"
										/>{/if}{hasAudio ? 'Sound' : 'No audio'}
								</button>
							</div>
							<span class="sr-only" id={`${reference.id}-sound-description`}
								>{hasAudio
									? 'Original source audio, which may include commentary or music.'
									: 'This reference has no source audio.'}</span
							>
							<div class="player-utilities">
								<div class="seek-controls" role="group" aria-label="Inspect clip timing">
									<button
										class="button button--quiet"
										disabled={!ready}
										aria-keyshortcuts={preferences.shortcuts ? 'J ArrowLeft' : 'ArrowLeft'}
										aria-describedby={`${reference.id}-position`}
										onclick={() => video && seek(video.currentTime - 0.25)}
										aria-label="Back 0.25 seconds">−0.25s</button
									>
									<button
										class="button button--quiet"
										disabled={!ready}
										aria-keyshortcuts={preferences.shortcuts ? 'L ArrowRight' : 'ArrowRight'}
										aria-describedby={`${reference.id}-position`}
										onclick={() => video && seek(video.currentTime + 0.25)}
										aria-label="Forward 0.25 seconds">+0.25s</button
									>
								</div>
								<ChoiceField
									id={`${reference.id}-speed`}
									label="Speed"
									value={String(speed)}
									options={[
										{ value: '0.5', label: '0.5×' },
										{ value: '0.75', label: '0.75×' },
										{ value: '1', label: '1×' },
									]}
									onchange={(selected) => {
										const value = Number(selected);
										if (isPlaybackSpeed(value)) onpreferencechange({ speed: value });
									}}
									compact
								/>
								<PlaybackSettings id={reference.id} {preferences} {onpreferencechange} />
							</div>
						</div>
						{#if autoplayNotice}<p class="playback-notice" role="status">{autoplayNotice}</p>{/if}
						<p class="sr-only" id={`${reference.id}-player-hint`}>
							Click or tap the video to play or pause. Drag left or right to inspect; the clip stays
							paused.
						</p>
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
		<details class="detail-disclosure key-moments">
			<summary
				><span
					>Key moments <span class="disclosure-count">({reference.media.frames.length})</span></span
				></summary
			>
			<div class="disclosure-body">
				<p class="frames-instruction muted">Select a frame to inspect</p>
				{@render frameList()}
			</div>
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
	.practice-media .key-moments .frames-instruction {
		margin-block: 0 10px;
		font-size: 12px;
	}
	/* Expanded guidance grows the page instead of consuming the replay's grid row. */
	.practice-media
		.practice-core:has(:global(.copy-fallback), .media-error, .media-loading, .playback-notice) {
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
	}
	@media (max-width: 1000px) and (max-height: 420px) {
		.practice-media .video-stage {
			block-size: max(120px, calc(100svh - 128px));
			aspect-ratio: auto;
		}
		.practice-media .video-stage video,
		.practice-media .video-stage .video-poster {
			block-size: 100%;
			aspect-ratio: auto;
		}
	}
	@media (max-width: 760px) and (max-height: 420px) {
		.practice-media .video-stage {
			block-size: max(96px, calc(100svh - 180px));
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 4px 12px;
		padding: 5px 0;
	}
	.transport-controls,
	.player-utilities,
	.seek-controls {
		display: flex;
		align-items: center;
		gap: 2px;
		min-inline-size: 0;
	}
	.player-utilities {
		gap: 8px;
		margin-inline-start: auto;
	}
	.playback-button {
		min-inline-size: 96px;
	}
	.seek-controls {
		gap: 0;
		padding-inline-start: 8px;
		border-inline-start: 1px solid var(--line);
	}
	.seek-controls .button {
		font-variant-numeric: tabular-nums;
	}
	.playback-notice {
		margin-block: 6px;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.5;
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
	@media (max-width: 760px) {
		.player-toolbar {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 4px;
			padding-block: 8px;
		}
		.transport-controls {
			display: grid;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 4px;
		}
		.playback-button {
			min-inline-size: 0;
		}
		.player-utilities {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto var(--control-size);
			gap: 4px;
			margin-inline-start: 0;
		}
		.seek-controls {
			padding-inline-start: 0;
			border-inline-start: 0;
		}
	}
	@media (max-width: 480px) {
		.transport-controls .button {
			flex-direction: column;
			gap: 3px;
			min-block-size: 56px;
		}
	}
	@media (max-width: 360px) {
		.player-utilities {
			grid-template-columns: minmax(0, 1fr) var(--control-size);
		}
		.seek-controls {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-column: 1 / -1;
		}
	}
	@media (forced-colors: active) {
		.video-surface:focus-visible {
			outline-color: Highlight;
		}
		.scrub-progress > div {
			background: Highlight;
		}
	}
</style>
