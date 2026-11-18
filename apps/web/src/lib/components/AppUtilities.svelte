<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { ArrowUpRight, BookOpen, Ellipsis, FilePlus2 } from '@lucide/svelte';
	import type { GameDefinition } from '@hyper-chamber/reference';
	import { onMount, tick } from 'svelte';
	import HostSettings from './HostSettings.svelte';

	let {
		guides,
		onnotation,
		oncontentchange,
		onbeforemaintenance,
	}: {
		guides: GameDefinition['guides'];
		onnotation: () => void;
		oncontentchange: (notice?: string) => Promise<void>;
		onbeforemaintenance?: () => Promise<void>;
	} = $props();

	const panelId = $props.id();
	let compact = $state(false);
	let open = $state(false);
	let fallback = $state(false);
	let navigation: HTMLElement;
	let trigger = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();

	function position() {
		if (!open || !trigger || !panel) return;
		const bounds = trigger.getBoundingClientRect();
		const viewport = window.visualViewport;
		const viewportLeft = viewport?.offsetLeft ?? 0;
		const viewportTop = viewport?.offsetTop ?? 0;
		const viewportWidth = viewport?.width ?? window.innerWidth;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		const margin = 8;
		const gap = 6;
		const width = Math.max(0, Math.min(248, viewportWidth - margin * 2));
		const topEdge = viewportTop + margin;
		const bottomEdge = viewportTop + viewportHeight - margin;
		const left = Math.max(
			viewportLeft + margin,
			Math.min(bounds.right - width, viewportLeft + viewportWidth - width - margin),
		);
		panel.style.setProperty('--tools-width', `${width}px`);
		panel.style.setProperty('--tools-left', `${left}px`);

		const height = panel.scrollHeight;
		const belowStart = Math.max(topEdge, bounds.bottom + gap);
		const aboveEnd = Math.min(bottomEdge, bounds.top - gap);
		const below = Math.max(0, bottomEdge - belowStart);
		const above = Math.max(0, aboveEnd - topEdge);
		const placeBelow = height <= below || below >= above;
		const availableHeight = placeBelow ? below : above;
		const maxHeight = availableHeight || Math.max(0, bottomEdge - topEdge);
		const top = !availableHeight
			? topEdge
			: placeBelow
				? belowStart
				: aboveEnd - Math.min(height, maxHeight);
		panel.style.setProperty('--tools-height', `${maxHeight}px`);
		panel.style.setProperty('--tools-top', `${top}px`);
	}

	function close(restoreFocus = true) {
		if (!open) return;
		open = false;
		if (!fallback && panel?.matches(':popover-open')) panel.hidePopover();
		fallback = false;
		if (restoreFocus) trigger?.focus({ preventScroll: true });
	}

	async function toggle() {
		if (open) {
			close();
			return;
		}
		if (!panel || !trigger) return;
		open = true;
		fallback = typeof panel.showPopover !== 'function';
		if (!fallback) panel.showPopover();
		await tick();
		if (!open) return;
		position();
		panel?.querySelector('a')?.focus({ preventScroll: true });
	}

	function toggled(event: ToggleEvent) {
		if (!fallback && event.newState === 'closed' && !panel?.matches(':popover-open')) open = false;
	}

	beforeNavigate(() => close(false));

	onMount(() => {
		const media = window.matchMedia('(max-width: 1000px)');
		const viewport = window.visualViewport;
		function updateLayout() {
			if (compact === media.matches) return;
			const active = document.activeElement;
			const fromDesktop =
				active instanceof HTMLAnchorElement && active.parentElement === navigation;
			const fromCompact = active === trigger || panel?.contains(active);
			close(false);
			compact = media.matches;
			void tick().then(() => {
				if (compact && fromDesktop) trigger?.focus({ preventScroll: true });
				if (!compact && fromCompact && navigation) {
					const links = [...navigation.querySelectorAll<HTMLAnchorElement>(':scope > a')];
					const matching = links.find(
						(link) => active instanceof HTMLAnchorElement && link.href === active.href,
					);
					(matching ?? links[0])?.focus({ preventScroll: true });
				}
			});
		}
		updateLayout();
		media.addEventListener('change', updateLayout);
		viewport?.addEventListener('resize', position);
		viewport?.addEventListener('scroll', position);
		return () => {
			media.removeEventListener('change', updateLayout);
			viewport?.removeEventListener('resize', position);
			viewport?.removeEventListener('scroll', position);
		};
	});

	$effect(() => {
		if (!open) return;
		function outside(event: Event) {
			const target = event.target;
			if (target instanceof Node && !trigger?.contains(target) && !panel?.contains(target))
				close(false);
		}
		function escape(event: KeyboardEvent) {
			if (!open || event.isComposing || event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			close();
		}
		document.addEventListener('focusin', outside);
		if (fallback) document.addEventListener('pointerdown', outside);
		window.addEventListener('keydown', escape, true);
		return () => {
			document.removeEventListener('focusin', outside);
			document.removeEventListener('pointerdown', outside);
			window.removeEventListener('keydown', escape, true);
		};
	});
</script>

<svelte:window onresize={position} onscroll={position} />

{#snippet createLink(inPanel: boolean)}
	<a
		class="guide-link"
		class:button={inPanel}
		class:button--quiet={inPanel}
		href="/create"
		onclick={inPanel ? () => close() : undefined}
		>{#if !inPanel}<FilePlus2 size={16} aria-hidden="true" />{/if}<span class="utility-label"
			>Create Packs</span
		></a
	>
{/snippet}

{#snippet guideLinks(inPanel: boolean)}
	{#each guides as guide}
		<a
			class="guide-link"
			class:button={inPanel}
			class:button--quiet={inPanel}
			href={guide.url}
			title={guide.label}
			aria-label={guide.label}
			target="_blank"
			rel="noreferrer"
			onclick={inPanel ? () => close() : undefined}
			><span class="utility-label">{inPanel ? guide.label : 'Guides'}</span><ArrowUpRight
				size={15}
				aria-hidden="true"
			/></a
		>
	{/each}
{/snippet}

<nav class="header-actions" aria-label="Utilities" bind:this={navigation}>
	{#if !compact}{@render createLink(false)}{/if}
	<HostSettings {oncontentchange} {onbeforemaintenance} />
	<button type="button" aria-label="Notation" title="Notation" onclick={onnotation}>
		<BookOpen size={16} aria-hidden="true" /><span class="utility-label">Notation</span>
	</button>
	{#if compact}
		<button
			type="button"
			class="more-tools-trigger"
			bind:this={trigger}
			aria-label="More Tools"
			title="More Tools"
			aria-controls={panelId}
			aria-expanded={open}
			onclick={toggle}
			><Ellipsis size={18} aria-hidden="true" /><span class="utility-label">More Tools</span
			></button
		>
		<div
			id={panelId}
			class="tools-panel"
			class:fallback
			bind:this={panel}
			popover="auto"
			role="group"
			aria-label="More Tools"
			data-overlay-open={open ? 'true' : undefined}
			ontoggle={toggled}
		>
			{@render createLink(true)}
			{@render guideLinks(true)}
		</div>
	{:else}
		{@render guideLinks(false)}
	{/if}
</nav>

<style>
	.more-tools-trigger[aria-expanded='true'] {
		background: #ffffff12;
	}
	.tools-panel {
		display: none;
		position: fixed;
		inset: var(--tools-top, 8px) auto auto var(--tools-left, 8px);
		inline-size: var(--tools-width, 248px);
		max-block-size: var(--tools-height, calc(100dvh - 16px));
		margin: 0;
		padding: 6px;
		border: 0;
		border-radius: var(--control-radius);
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 8px 40px #20282238;
		overflow-y: auto;
		overscroll-behavior: contain;
		z-index: 20;
	}
	.tools-panel:is(:popover-open, .fallback) {
		display: grid;
	}
	.tools-panel > a {
		justify-content: space-between;
		text-align: start;
		overflow-wrap: anywhere;
	}
	.tools-panel :global(.utility-label) {
		display: inline;
	}
	.tools-panel > a:focus-visible {
		outline-color: var(--ink);
		outline-offset: -2px;
	}
	@media (forced-colors: active) {
		.more-tools-trigger[aria-expanded='true'] {
			outline: 2px solid Highlight;
			outline-offset: -3px;
		}
		.tools-panel {
			border: 1px solid ButtonText;
		}
	}
</style>
