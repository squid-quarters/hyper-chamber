<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { CircleHelp, X } from '@lucide/svelte';

	let { id }: { id: string } = $props();
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
		panel.style.inlineSize = `${Math.min(320, Math.max(1, viewportWidth - edge * 2))}px`;
		panel.style.maxBlockSize = `${Math.max(1, viewportHeight - edge * 2)}px`;
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
		panel.style.top = `${Math.max(minTop, Math.min(top, maxTop))}px`;
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
		await tick();
		if (!open || !panel?.isConnected) return;
		position();
		panel.focus({ preventScroll: true });
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
			if (!open || !(event.target instanceof Node)) return;
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
		document.addEventListener('keydown', escape, true);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		window.visualViewport?.addEventListener('resize', position);
		window.visualViewport?.addEventListener('scroll', position);
		return () => {
			document.removeEventListener('pointerdown', outsidePointer);
			document.removeEventListener('focusin', outsideFocus);
			document.removeEventListener('keydown', escape, true);
			window.removeEventListener('resize', position);
			window.removeEventListener('scroll', position, true);
			window.visualViewport?.removeEventListener('resize', position);
			window.visualViewport?.removeEventListener('scroll', position);
			if (nativePopover && panel?.matches(':popover-open')) panel.hidePopover();
		};
	});
</script>

<button
	bind:this={trigger}
	type="button"
	class="help-trigger"
	class:expanded={open}
	aria-label="Replay controls"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls={`${id}-playback-help`}
	popovertarget={nativePopover ? `${id}-playback-help` : undefined}
	onclick={toggle}
>
	<CircleHelp size={16} aria-hidden="true" /><span>Controls</span>
</button>
<div
	bind:this={panel}
	id={`${id}-playback-help`}
	class="help-panel"
	popover={nativePopover ? 'auto' : undefined}
	hidden={!open}
	role="dialog"
	aria-labelledby={`${id}-playback-help-title`}
	aria-describedby={`${id}-playback-help-details`}
	tabindex="-1"
	data-overlay-open={open ? 'true' : undefined}
	ontoggle={syncPopover}
>
	<header>
		<h4 id={`${id}-playback-help-title`}>Replay controls</h4>
		<button
			type="button"
			class="close-help"
			onclick={() => close(true)}
			aria-label="Close replay controls"
		>
			<X size={18} aria-hidden="true" />
		</button>
	</header>
	<dl id={`${id}-playback-help-details`}>
		<div>
			<dt>Play or pause</dt>
			<dd>Click or tap the video.</dd>
		</div>
		<div>
			<dt>Inspect a moment</dt>
			<dd>Drag left or right. The clip stays paused.</dd>
		</div>
		<div>
			<dt>Fine adjustment</dt>
			<dd>Use −0.25s / +0.25s.</dd>
		</div>
	</dl>
</div>

<style>
	.help-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-block-size: var(--control-size, 40px);
		padding: 7px 9px;
		border: 1px solid transparent;
		font-size: 12px;
		font-weight: 500;
	}
	.help-trigger:hover,
	.help-trigger.expanded,
	.close-help:hover {
		background: var(--soft);
	}
	.help-trigger:active,
	.close-help:active {
		background: var(--selected);
	}
	.help-panel {
		position: fixed;
		inset: auto;
		z-index: 40;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		inline-size: min(320px, calc(100vw - 24px));
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
	.help-panel[hidden] {
		display: none;
	}
	.help-panel > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-block-size: 48px;
		padding: 4px 6px 4px 18px;
		border-bottom: 1px solid var(--line);
	}
	h4 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}
	.close-help {
		display: grid;
		place-items: center;
		flex: none;
		inline-size: 40px;
		block-size: 40px;
	}
	dl {
		display: grid;
		gap: 14px;
		min-block-size: 0;
		margin: 0;
		padding: 16px 18px 18px;
		font-size: 13px;
		line-height: 1.5;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	dl > div {
		display: grid;
		gap: 2px;
	}
	dt {
		font-weight: 600;
	}
	dd {
		margin: 0;
		color: var(--muted);
	}
	@media (max-width: 760px) {
		.help-trigger {
			min-block-size: 44px;
		}
		.close-help {
			inline-size: 44px;
			block-size: 44px;
		}
	}
	@media (forced-colors: active) {
		.help-panel {
			border: 1px solid CanvasText;
		}
	}
</style>
