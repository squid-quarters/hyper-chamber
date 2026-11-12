<script lang="ts">
	import { tick } from 'svelte';
	import { Check, ChevronDown } from '@lucide/svelte';
	import {
		initialChoiceIndex,
		moveChoiceIndex,
		typeaheadChoiceIndex,
		type ChoiceOption,
	} from '../choice';

	let {
		id,
		label,
		value,
		options,
		onchange,
		compact = false,
		disabled = false,
		hint,
	}: {
		id: string;
		label: string;
		value: string;
		options: ChoiceOption[];
		onchange: (value: string) => void;
		compact?: boolean;
		disabled?: boolean;
		hint?: string;
	} = $props();

	let trigger = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();
	let open = $state(false);
	let fallback = $state(false);
	let activeIndex = $state(-1);
	let keyboardActive = $state(false);
	let left = $state(8);
	let top = $state(8);
	let width = $state(224);
	let maxHeight = $state(320);
	let query = '';
	let lastTyped = 0;
	let selected = $derived(options.find((option) => option.value === value));
	let unavailable = $derived(disabled || !options.some((option) => !option.disabled));

	function optionId(index: number) {
		return `${id}-option-${index}`;
	}

	function resetSearch() {
		query = '';
		lastTyped = 0;
	}

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
		width = Math.min(
			Math.max(bounds.width, compact ? 224 : bounds.width),
			Math.max(1, viewportWidth - margin * 2),
		);
		left = Math.max(
			viewportLeft + margin,
			Math.min(bounds.left, viewportLeft + viewportWidth - width - margin),
		);
		const below = Math.max(0, viewportTop + viewportHeight - bounds.bottom - gap - margin);
		const above = Math.max(0, bounds.top - viewportTop - gap - margin);
		const naturalHeight = panel.scrollHeight || 320;
		const desiredHeight = Math.min(320, naturalHeight);
		const placeBelow = below >= desiredHeight || below >= above;
		maxHeight = Math.min(320, placeBelow ? below : above);
		const height = Math.min(naturalHeight, maxHeight);
		top = Math.max(
			viewportTop + margin,
			Math.min(
				placeBelow ? bounds.bottom + gap : bounds.top - gap - height,
				viewportTop + viewportHeight - height - margin,
			),
		);
	}

	function scrollActive() {
		if (!panel || activeIndex < 0) return;
		const option = document.getElementById(optionId(activeIndex));
		if (!option) return;
		const itemBounds = option.getBoundingClientRect();
		const panelBounds = panel.getBoundingClientRect();
		const inset = 5;
		if (itemBounds.top < panelBounds.top + inset)
			panel.scrollTop -= panelBounds.top + inset - itemBounds.top;
		else if (itemBounds.bottom > panelBounds.bottom - inset)
			panel.scrollTop += itemBounds.bottom - panelBounds.bottom + inset;
	}

	async function show(keyboard = false) {
		if (unavailable || !panel || !trigger || open) return;
		activeIndex = initialChoiceIndex(options, value);
		keyboardActive = keyboard;
		resetSearch();
		fallback = !('popover' in HTMLElement.prototype && typeof panel.showPopover === 'function');
		open = true;
		position();
		await tick();
		if (!panel || !trigger || !open) return;
		if (!fallback) {
			try {
				panel.showPopover({ source: trigger });
			} catch {
				fallback = true;
			}
		}
		position();
		await tick();
		scrollActive();
	}

	function close(restoreFocus = true) {
		if (!open) return;
		open = false;
		if (!fallback && panel && typeof panel.hidePopover === 'function') {
			try {
				panel.hidePopover();
			} catch {
				/* The browser may already have light-dismissed it. */
			}
		}
		fallback = false;
		activeIndex = initialChoiceIndex(options, value);
		resetSearch();
		if (restoreFocus) trigger?.focus({ preventScroll: true });
	}

	function choose(index = activeIndex, restoreFocus = true) {
		const option = options[index];
		if (!option || option.disabled) {
			close(restoreFocus);
			return;
		}
		close(restoreFocus);
		if (option.value !== value) onchange(option.value);
	}

	function toggled(event: ToggleEvent) {
		if (fallback || !panel || event.newState !== 'closed' || panel.matches(':popover-open')) return;
		open = false;
		activeIndex = initialChoiceIndex(options, value);
		resetSearch();
	}

	async function setActive(index: number) {
		activeIndex = index;
		keyboardActive = true;
		await tick();
		scrollActive();
	}

	async function keys(event: KeyboardEvent) {
		if (unavailable || event.isComposing || event.ctrlKey || event.metaKey) return;
		if (event.altKey) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				event.stopPropagation();
				await show(true);
			} else if (event.key === 'ArrowUp' && open) {
				event.preventDefault();
				event.stopPropagation();
				choose();
			}
			return;
		}
		if (event.key === 'Tab') {
			if (open) choose(activeIndex, false);
			return;
		}
		if (event.key === 'Escape') {
			if (open) {
				event.preventDefault();
				event.stopPropagation();
				close();
			}
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			if (open) choose();
			else await show(true);
			return;
		}
		if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
			event.preventDefault();
			event.stopPropagation();
			resetSearch();
			const wasOpen = open;
			await show(true);
			const next =
				event.key === 'Home' || (!wasOpen && event.key === 'ArrowUp')
					? moveChoiceIndex(options, -1, 1)
					: event.key === 'End'
						? moveChoiceIndex(options, -1, -1)
						: wasOpen || event.key.startsWith('Page')
							? moveChoiceIndex(
									options,
									activeIndex,
									{ ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 }[event.key] ?? 0,
								)
							: activeIndex;
			await setActive(next);
			return;
		}
		if ([...event.key].length === 1) {
			event.preventDefault();
			event.stopPropagation();
			await show(true);
			const now = Date.now();
			query = now - lastTyped > 700 ? event.key : query + event.key;
			lastTyped = now;
			const match = typeaheadChoiceIndex(options, query, activeIndex);
			if (match >= 0) await setActive(match);
		}
	}

	$effect(() => {
		if (!open || !options[activeIndex] || options[activeIndex].disabled)
			activeIndex = initialChoiceIndex(options, value);
		if (unavailable && open) close(false);
	});

	$effect(() => {
		if (!open) return;
		const outside = (event: PointerEvent) => {
			if (
				event.target instanceof Node &&
				!panel?.contains(event.target) &&
				!trigger?.contains(event.target)
			)
				choose(activeIndex, false);
		};
		const viewport = window.visualViewport;
		window.addEventListener('pointerdown', outside, true);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		viewport?.addEventListener('resize', position);
		viewport?.addEventListener('scroll', position);
		const observer =
			typeof ResizeObserver === 'function' ? new ResizeObserver(position) : undefined;
		if (trigger) observer?.observe(trigger);
		if (panel) observer?.observe(panel);
		return () => {
			window.removeEventListener('pointerdown', outside, true);
			window.removeEventListener('resize', position);
			window.removeEventListener('scroll', position, true);
			viewport?.removeEventListener('resize', position);
			viewport?.removeEventListener('scroll', position);
			observer?.disconnect();
		};
	});
</script>

<div class="choice-field" class:compact>
	{#if !compact}<label class="choice-label" id={`${id}-label`} for={id}>{label}</label>{/if}
	<button
		{id}
		type="button"
		role="combobox"
		class="choice-trigger"
		bind:this={trigger}
		disabled={unavailable}
		aria-labelledby={`${id}-label`}
		aria-describedby={hint ? `${id}-hint` : undefined}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={`${id}-listbox`}
		aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
		onclick={() => (open ? close() : show())}
		onkeydown={keys}
		onblur={() => {
			if (open) choose(activeIndex, false);
		}}
	>
		{#if compact}<span class="choice-label" id={`${id}-label`}>{label}</span>{/if}
		<span class="choice-value">{selected?.label ?? value}</span>
		<ChevronDown class="choice-chevron" size={16} aria-hidden="true" />
	</button>
	<div
		id={`${id}-listbox`}
		role="listbox"
		tabindex="-1"
		aria-labelledby={`${id}-label`}
		class="choice-popup"
		bind:this={panel}
		popover="auto"
		data-open={open}
		data-overlay-open={open ? 'true' : undefined}
		style:left={`${left}px`}
		style:top={`${top}px`}
		style:width={`${width}px`}
		style:max-height={`${maxHeight}px`}
		ontoggle={toggled}
		onpointerdown={(event) => event.preventDefault()}
	>
		{#each options as option, index (option.value)}
			<!-- svelte-ignore a11y_click_events_have_key_events (Keyboard selection stays on the combobox through aria-activedescendant.) -->
			<div
				id={optionId(index)}
				role="option"
				tabindex="-1"
				class="choice-option"
				aria-selected={option.value === value}
				aria-disabled={option.disabled ? 'true' : undefined}
				data-active={index === activeIndex}
				data-keyboard={keyboardActive}
				onpointermove={(event) => {
					if (event.pointerType === 'mouse' && !option.disabled) {
						activeIndex = index;
						keyboardActive = false;
					}
				}}
				onclick={() => {
					if (!option.disabled) choose(index);
				}}
			>
				<span class="choice-option-text">
					<span class="choice-option-label">{option.label}</span>
					{#if option.description}<span class="choice-description">{option.description}</span>{/if}
				</span>
				<span class="choice-check" aria-hidden="true"
					>{#if option.value === value}<Check size={16} />{/if}</span
				>
			</div>
		{/each}
	</div>
	{#if hint}<span class="choice-hint" id={`${id}-hint`}>{hint}</span>{/if}
</div>

<style>
	.choice-field {
		display: grid;
		align-content: start;
		gap: 7px;
		min-inline-size: 0;
		inline-size: 100%;
	}
	.choice-field.compact {
		display: block;
		inline-size: auto;
		max-inline-size: 100%;
	}
	.choice-label {
		color: var(--muted);
		font-size: 12px;
		font-weight: 500;
	}
	.choice-trigger {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 16px;
		align-items: center;
		gap: 8px;
		inline-size: 100%;
		min-inline-size: 0;
		min-block-size: var(--control-size, 40px);
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		color: var(--ink);
		text-align: start;
		font-size: 12px;
	}
	.compact .choice-trigger {
		grid-template-columns: auto minmax(0, 1fr) 16px;
		min-inline-size: 124px;
	}
	.choice-value {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.compact .choice-value {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.choice-trigger[aria-expanded='true'] {
		background: var(--soft);
	}
	.choice-trigger :global(.choice-chevron) {
		color: var(--muted);
	}
	.choice-popup {
		display: none;
		position: fixed;
		inset: auto;
		z-index: 40;
		margin: 0;
		padding: 4px;
		overflow-y: auto;
		overscroll-behavior: contain;
		border: 1px solid var(--border);
		border-radius: 5px;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 8px 24px #20282224;
	}
	.choice-popup[data-open='true'] {
		display: block;
	}
	.choice-option {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 16px;
		align-items: center;
		gap: 12px;
		min-block-size: var(--control-size, 40px);
		padding: 8px 12px;
		border: 1px solid transparent;
		border-radius: 3px;
		font-size: 12px;
		line-height: 1.45;
		cursor: pointer;
	}
	.choice-option-text {
		display: grid;
		gap: 2px;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.choice-description,
	.choice-hint {
		color: var(--muted);
		font-size: 11px;
		font-weight: 400;
	}
	.choice-check {
		display: flex;
		align-items: center;
		inline-size: 16px;
	}
	.choice-option[aria-selected='true'] {
		background: var(--selected);
	}
	.choice-option[aria-selected='true'] .choice-option-label {
		font-weight: 600;
	}
	.choice-option[data-active='true'][data-keyboard='true'] {
		outline: 2px solid var(--ink);
		outline-offset: -3px;
	}
	.choice-option[aria-disabled='true'] {
		color: var(--muted);
		opacity: 0.6;
		cursor: default;
	}
	@media (hover: hover) {
		.choice-trigger:hover:not(:disabled) {
			background: var(--soft);
		}
		.choice-option:hover:not([aria-disabled='true']):not([aria-selected='true']) {
			background: var(--soft);
		}
	}
	@media (forced-colors: active) {
		.choice-trigger,
		.choice-popup {
			border-color: ButtonText;
		}
		.choice-option[aria-selected='true'] {
			color: Highlight;
			background: Canvas;
		}
		.choice-option[aria-selected='true'] .choice-description {
			color: inherit;
		}
		.choice-option[data-active='true'][data-keyboard='true'] {
			outline-color: ButtonText;
		}
		.choice-option[aria-disabled='true'] {
			color: GrayText;
			opacity: 1;
		}
	}
</style>
