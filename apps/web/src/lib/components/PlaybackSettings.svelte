<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Settings2, X } from '@lucide/svelte';
	import { type AutoplayMode, type PlaybackPreferences } from '../player';

	let {
		id,
		preferences,
		onpreferencechange,
	}: {
		id: string;
		preferences: PlaybackPreferences;
		onpreferencechange: (patch: Partial<PlaybackPreferences>) => void;
	} = $props();

	const modes: { value: AutoplayMode; label: string; description: string }[] = [
		{
			value: 'follow',
			label: 'Follow playback',
			description: 'Keep the current play or pause state.',
		},
		{ value: 'always', label: 'Always play', description: 'Play each reference automatically.' },
		{ value: 'paused', label: 'Start paused', description: 'Open each reference paused.' },
	];
	let trigger: HTMLButtonElement;
	let panel: HTMLDivElement;
	let open = $state(false);
	let nativePopover = $state(false);

	function position() {
		if (!open || !panel || !trigger) return;
		const viewport = window.visualViewport;
		const viewportWidth = viewport?.width ?? window.innerWidth;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		const viewportLeft = viewport?.offsetLeft ?? 0;
		const viewportTop = viewport?.offsetTop ?? 0;
		const edge = 12;
		const gap = 8;
		panel.style.inlineSize = `${Math.min(400, viewportWidth - edge * 2)}px`;
		panel.style.maxBlockSize = `${viewportHeight - edge * 2}px`;
		const anchor = trigger.getBoundingClientRect();
		const bounds = panel.getBoundingClientRect();
		const minTop = viewportTop + edge;
		const maxTop = viewportTop + viewportHeight - bounds.height - edge;
		const above = anchor.top - bounds.height - gap;
		const below = anchor.bottom + gap;
		const top = below <= maxTop ? below : above >= minTop ? above : maxTop;
		const left = Math.max(
			viewportLeft + edge,
			Math.min(anchor.right - bounds.width, viewportLeft + viewportWidth - bounds.width - edge),
		);
		panel.style.top = `${Math.max(minTop, top)}px`;
		panel.style.left = `${left}px`;
	}

	function close(restoreFocus = false) {
		if (!open) return;
		open = false;
		if (nativePopover && panel?.matches(':popover-open')) panel.hidePopover();
		if (restoreFocus) trigger?.focus({ preventScroll: true });
	}

	async function toggle(event: MouseEvent) {
		event.preventDefault();
		if (open) {
			close(true);
			return;
		}
		open = true;
		await tick();
		if (!open || !panel?.isConnected) return;
		if (nativePopover) {
			try {
				panel.showPopover({ source: trigger });
			} catch {
				nativePopover = false;
			}
		}
		position();
		panel.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true });
	}

	function syncPopover(event: Event) {
		if (!nativePopover) return;
		const nowOpen = (event as Event & { newState: string }).newState === 'open';
		if (!nowOpen && open) {
			const restoreFocus = panel.contains(document.activeElement);
			open = false;
			if (restoreFocus) trigger.focus({ preventScroll: true });
		}
	}

	onMount(() => {
		nativePopover = 'popover' in HTMLElement.prototype && typeof panel.showPopover === 'function';
		function outsidePointer(event: PointerEvent) {
			if (nativePopover || !open || !(event.target instanceof Node)) return;
			if (!panel.contains(event.target) && !trigger.contains(event.target)) close();
		}
		function outsideFocus(event: FocusEvent) {
			if (!open || !(event.target instanceof Node)) return;
			if (!panel.contains(event.target) && !trigger.contains(event.target)) close();
		}
		function escape(event: KeyboardEvent) {
			if (!open || event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			close(true);
		}
		document.addEventListener('pointerdown', outsidePointer);
		document.addEventListener('focusin', outsideFocus);
		document.addEventListener('keydown', escape);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		window.visualViewport?.addEventListener('resize', position);
		return () => {
			document.removeEventListener('pointerdown', outsidePointer);
			document.removeEventListener('focusin', outsideFocus);
			document.removeEventListener('keydown', escape);
			window.removeEventListener('resize', position);
			window.removeEventListener('scroll', position, true);
			window.visualViewport?.removeEventListener('resize', position);
			if (nativePopover && panel?.matches(':popover-open')) panel.hidePopover();
		};
	});
</script>

<button
	bind:this={trigger}
	class="settings-trigger"
	class:expanded={open}
	aria-label="Playback settings"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls={`${id}-playback-settings`}
	popovertarget={nativePopover ? `${id}-playback-settings` : undefined}
	onclick={toggle}
	title="Playback settings"
>
	<Settings2 size={16} aria-hidden="true" /><span>Settings</span>
</button>
<div
	bind:this={panel}
	id={`${id}-playback-settings`}
	class="settings-panel"
	popover={nativePopover ? 'auto' : undefined}
	hidden={!open}
	role="dialog"
	aria-labelledby={`${id}-settings-title`}
	data-overlay-open={open ? 'true' : undefined}
	ontoggle={syncPopover}
>
	<header>
		<h4 id={`${id}-settings-title`}>Playback settings</h4>
		<button class="close-settings" onclick={() => close(true)} aria-label="Close playback settings"
			><X size={18} aria-hidden="true" /></button
		>
	</header>
	<div class="settings-body">
		<fieldset class="autoplay-options">
			<legend>On reference change</legend>
			{#each modes as mode}
				<label class="mode-row" class:chosen={preferences.autoplay === mode.value}>
					<input
						type="radio"
						name={`${id}-autoplay`}
						value={mode.value}
						checked={preferences.autoplay === mode.value}
						onchange={() => {
							if (preferences.autoplay !== mode.value) onpreferencechange({ autoplay: mode.value });
						}}
					/>
					<span><strong>{mode.label}</strong><span>{mode.description}</span></span>
				</label>
			{/each}
		</fieldset>
		<section class="keyboard-settings" aria-labelledby={`${id}-keyboard-title`}>
			<h5 id={`${id}-keyboard-title`}>Keyboard</h5>
			<label class="shortcut-switch">
				<span>Single-key shortcuts</span>
				<span class="switch-control">
					<input
						type="checkbox"
						role="switch"
						checked={preferences.shortcuts}
						onchange={(event) => onpreferencechange({ shortcuts: event.currentTarget.checked })}
					/>
					<span class="switch-track" aria-hidden="true"><span></span></span>
				</span>
			</label>
			<dl class="shortcut-list" class:single-keys-off={!preferences.shortcuts}>
				<div class="single-key">
					<dt>Previous / next reference</dt>
					<dd><kbd>P</kbd><kbd>N</kbd></dd>
				</div>
				<div class="single-key">
					<dt>Play / pause</dt>
					<dd><kbd>K</kbd></dd>
				</div>
				<div class="single-key">
					<dt>Replay</dt>
					<dd><kbd>R</kbd></dd>
				</div>
				<div>
					<dt>Nudge clip<span>Clip controls focused</span></dt>
					<dd>
						<span class="shortcut-pair single-key"><kbd>J</kbd><kbd>L</kbd></span><span
							class="shortcut-pair"><kbd>←</kbd><kbd>→</kbd></span
						>
					</dd>
				</div>
				<div>
					<dt>Quick switch</dt>
					<dd><kbd>⌘ / Ctrl</kbd><kbd>K</kbd></dd>
				</div>
				<div>
					<dt>Play / pause with video focused</dt>
					<dd><kbd>Space</kbd></dd>
				</div>
			</dl>
			<p class="shortcut-note">
				Nudges pause the clip and move 0.25 seconds. Single-key shortcuts stay inactive while typing
				or using a menu.
			</p>
		</section>
	</div>
</div>

<style>
	.settings-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-block-size: var(--control-size, 40px);
		padding: 7px 10px;
		border: 1px solid transparent;
		font-size: 12px;
		font-weight: 500;
	}
	.settings-trigger:hover,
	.settings-trigger.expanded {
		background: var(--soft);
	}
	.settings-panel {
		position: fixed;
		inset: auto;
		z-index: 40;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		inline-size: min(400px, calc(100vw - 24px));
		max-block-size: calc(100vh - 24px);
		max-block-size: calc(100dvh - 24px);
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 12px 40px #252c2733;
		overflow: hidden;
	}
	.settings-panel[hidden] {
		display: none;
	}
	.settings-panel > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-block-size: 56px;
		padding: 4px 8px 4px 20px;
		border-bottom: 1px solid var(--line);
	}
	h4,
	h5 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}
	.close-settings {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: 44px;
		block-size: 44px;
	}
	.close-settings:hover {
		background: var(--soft);
	}
	.settings-body {
		min-block-size: 0;
		padding: 18px 20px 20px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.autoplay-options {
		min-inline-size: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.autoplay-options legend {
		margin-block-end: 8px;
		padding: 0;
		font-size: 12px;
		font-weight: 600;
	}
	.mode-row {
		display: flex;
		align-items: center;
		gap: 12px;
		min-block-size: 64px;
		padding: 10px 12px;
		border-radius: 4px;
		cursor: pointer;
	}
	.mode-row:hover {
		background: var(--soft);
	}
	.mode-row.chosen {
		background: var(--selected);
	}
	.mode-row input {
		flex: none;
		inline-size: 17px;
		block-size: 17px;
		margin: 0;
		accent-color: var(--accent);
	}
	.mode-row > span {
		display: grid;
		gap: 2px;
	}
	.mode-row strong {
		font-size: 13px;
		font-weight: 600;
	}
	.mode-row > span > span {
		color: var(--muted);
		font-size: 12px;
		line-height: 1.4;
	}
	.keyboard-settings {
		margin-block-start: 18px;
		padding-block-start: 16px;
		border-top: 1px solid var(--line);
	}
	.keyboard-settings h5 {
		font-size: 12px;
	}
	.shortcut-switch {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-block-size: 48px;
		font-size: 13px;
		cursor: pointer;
	}
	.switch-control {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
		inline-size: 44px;
		block-size: 44px;
	}
	.switch-control input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.switch-track {
		display: flex;
		align-items: center;
		inline-size: 36px;
		block-size: 22px;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 14px;
		background: var(--soft);
		pointer-events: none;
	}
	.switch-track > span {
		inline-size: 14px;
		block-size: 14px;
		border-radius: 50%;
		background: var(--muted);
	}
	.switch-control input:checked + .switch-track {
		border-color: var(--accent);
		background: var(--accent);
	}
	.switch-control input:checked + .switch-track > span {
		margin-inline-start: auto;
		background: var(--on-accent);
	}
	.switch-control input:focus-visible + .switch-track {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}
	.shortcut-list {
		display: grid;
		gap: 8px;
		margin: 6px 0 0;
		font-size: 12px;
	}
	.shortcut-list > div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	.shortcut-list dt {
		line-height: 1.4;
	}
	.shortcut-list dt > span {
		display: block;
		color: var(--muted);
		font-size: 11px;
	}
	.shortcut-pair {
		display: flex;
		gap: 4px;
	}
	.shortcut-pair + .shortcut-pair {
		margin-inline-start: 4px;
	}
	.shortcut-list dd {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
		flex: none;
		margin: 0;
	}
	.shortcut-list kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-inline-size: 24px;
		min-block-size: 24px;
		padding: 2px 5px;
		border: 1px solid var(--line);
		border-radius: 3px;
		background: var(--canvas);
		font:
			11px/1.2 'DM Sans',
			sans-serif;
	}
	.single-keys-off .single-key {
		color: var(--muted);
	}
	.shortcut-note {
		margin-block-start: 14px;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.5;
	}
	@media (max-width: 760px) {
		.settings-trigger {
			inline-size: 44px;
			min-block-size: 44px;
			padding-inline: 0;
		}
		.settings-trigger > span {
			display: none;
		}
	}
	@media (forced-colors: active) {
		.settings-panel {
			border: 1px solid CanvasText;
		}
		.mode-row.chosen {
			outline: 1px solid Highlight;
			outline-offset: -1px;
		}
		.switch-control input:checked + .switch-track {
			background: Highlight;
		}
		.switch-control input:checked + .switch-track > span {
			background: HighlightText;
		}
	}
</style>
