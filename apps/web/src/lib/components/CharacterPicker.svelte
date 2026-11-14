<script lang="ts">
	import { onMount, tick } from 'svelte';
	import CharacterPortrait from './CharacterPortrait.svelte';
	import { Check, ChevronDown, Search, X } from '@lucide/svelte';

	let {
		characters,
		selected,
		gameName,
		disabled = false,
		onchange,
		onopen,
	}: {
		characters: { id: string; characterId?: string; name: string; count: number }[];
		selected: string;
		gameName: string;
		disabled?: boolean;
		onchange: (id: string) => void | Promise<void>;
		onopen?: () => void;
	} = $props();
	let trigger = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();
	let search = $state<HTMLInputElement>();
	let grid = $state<HTMLUListElement>();
	let open = $state(false);
	let fallback = $state(false);
	let query = $state('');
	let left = $state(16);
	let top = $state(72);
	let availableHeight = $state(480);
	let availableWidth = $state(624);
	let current = $derived(characters.find((item) => item.id === selected) ?? characters[0]);
	function searchKey(value: string) {
		return value
			.normalize('NFKD')
			.toLocaleLowerCase()
			.replace(/[^\p{L}\p{N}]/gu, '');
	}
	let matches = $derived(
		characters.filter(
			(item) =>
				searchKey(item.name).includes(searchKey(query)) ||
				searchKey(item.id).includes(searchKey(query)),
		),
	);
	function position() {
		if (!trigger || !open) return;
		const bounds = trigger.getBoundingClientRect();
		const viewport = window.visualViewport;
		const width = viewport?.width ?? window.innerWidth;
		const height = viewport?.height ?? window.innerHeight;
		const x = viewport?.offsetLeft ?? 0;
		const y = viewport?.offsetTop ?? 0;
		const edge = 16;
		availableWidth = Math.min(624, Math.max(0, width - edge * 2));
		left = Math.max(x + edge, Math.min(bounds.left, x + width - availableWidth - edge));
		const below = Math.max(y + edge, bounds.bottom + 8);
		const remaining = y + height - below - edge;
		top = remaining >= Math.min(320, height - edge * 2) ? below : y + edge;
		availableHeight = Math.max(0, y + height - top - edge);
	}
	async function show() {
		if (!panel || disabled) return;
		if (open) {
			close();
			return;
		}
		query = '';
		open = true;
		position();
		onopen?.();
		if (typeof panel.showPopover === 'function') panel.showPopover();
		else fallback = true;
		await tick();
		search?.focus({ preventScroll: true });
	}
	function close(restore = true) {
		if (!panel) return;
		if (!fallback && typeof panel.hidePopover === 'function') panel.hidePopover();
		open = false;
		fallback = false;
		if (restore) trigger?.focus({ preventScroll: true });
	}
	function toggled(event: ToggleEvent) {
		open = event.newState === 'open';
		if (!open && panel?.contains(document.activeElement)) trigger?.focus({ preventScroll: true });
	}
	async function choose(id: string) {
		close();
		await onchange(id);
	}
	function keys(event: KeyboardEvent) {
		if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			close();
			return;
		}
		if (event.target === search) {
			if (event.key === 'Enter' && matches[0]) {
				event.preventDefault();
				void choose(matches[0].id);
			} else if (event.key === 'ArrowDown') {
				event.preventDefault();
				grid?.querySelector('button')?.focus();
			}
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
			return;
		const buttons = [...(grid?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
		if (!buttons.length) return;
		const index = buttons.findIndex((button) => button === event.target);
		if (index < 0) return;
		event.preventDefault();
		const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1;
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? buttons.length - 1
					: index +
						({ ArrowDown: columns, ArrowUp: -columns, ArrowLeft: -1, ArrowRight: 1 }[event.key] ??
							0);
		if (next < 0 && event.key === 'ArrowUp') search?.focus({ preventScroll: true });
		else buttons[Math.max(0, Math.min(next, buttons.length - 1))]?.focus();
	}
	onMount(() => {
		const viewport = window.visualViewport;
		viewport?.addEventListener('resize', position);
		viewport?.addEventListener('scroll', position);
		return () => {
			viewport?.removeEventListener('resize', position);
			viewport?.removeEventListener('scroll', position);
		};
	});
	$effect(() => {
		if (!open || !fallback) return;
		const outside = (event: PointerEvent) => {
			if (
				event.target instanceof Node &&
				!panel?.contains(event.target) &&
				!trigger?.contains(event.target)
			)
				close(false);
		};
		const dismiss = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			close();
		};
		window.addEventListener('pointerdown', outside);
		window.addEventListener('keydown', dismiss, true);
		return () => {
			window.removeEventListener('pointerdown', outside);
			window.removeEventListener('keydown', dismiss, true);
		};
	});
</script>

<svelte:window onresize={position} onscroll={position} />
<button
	class="character-trigger"
	bind:this={trigger}
	{disabled}
	aria-label={'Choose character, ' + current.name + ' selected'}
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls="character-roster"
	onclick={show}
>
	<CharacterPortrait
		characterId={current.characterId ?? current.id}
		size={36}
		class="trigger-portrait"
	/>
	<span><small>{gameName}</small><strong>{current.name}</strong></span>
	<ChevronDown size={16} aria-hidden="true" />
</button>
<div
	id="character-roster"
	class="roster-panel"
	class:fallback
	bind:this={panel}
	popover="auto"
	role="dialog"
	aria-labelledby="character-roster-title"
	data-character-picker-open={open}
	style:left={`${left}px`}
	style:top={`${top}px`}
	style:--roster-width={`${availableWidth}px`}
	style:--roster-height={`${availableHeight}px`}
	ontoggle={toggled}
	onkeydown={keys}
	tabindex="-1"
>
	<div class="roster-heading">
		<h2 id="character-roster-title">Characters</h2>
		<button class="icon-button" aria-label="Close character picker" onclick={() => close()}
			><X size={18} aria-hidden="true" /></button
		>
	</div>
	<label class="roster-search">
		<Search size={17} aria-hidden="true" />
		<span class="sr-only">Find a character</span>
		<input
			type="search"
			bind:this={search}
			bind:value={query}
			placeholder="Find a character"
			autocomplete="off"
		/>
	</label>
	<p class="sr-only" role="status">{matches.length} characters</p>
	<ul class="roster-grid" bind:this={grid} aria-label="Characters" role="list">
		{#each matches as character (character.id)}
			<li>
				<button
					class="roster-choice"
					aria-pressed={character.id === selected}
					onclick={() => choose(character.id)}
				>
					<CharacterPortrait characterId={character.characterId ?? character.id} size={44} lazy />
					<span class="roster-identity"
						><strong>{character.name}</strong><small>{character.count} references</small></span
					>
					{#if character.id === selected}<Check size={16} aria-hidden="true" /><span class="sr-only"
							>Selected</span
						>{/if}
				</button>
			</li>
		{/each}
	</ul>
	{#if !matches.length}<p class="roster-empty">No character matches “{query}”.</p>{/if}
</div>
