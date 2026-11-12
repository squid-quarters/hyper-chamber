<script lang="ts">
	import { ArrowLeft, ArrowRight, X } from '@lucide/svelte';
	import type { GameDefinition } from '@hyper-chamber/reference';
	let {
		game,
		character,
		onclose,
	}: { game: GameDefinition; character: string; onclose: () => void } = $props();
	let section = $state('inputs');
	let glossaryPage = $state(0);
	let viewportWidth = $state(1024);
	let viewportHeight = $state(768);
	const termsPerPage = $derived(
		viewportWidth <= 400 || viewportHeight < 600 ? 1 : viewportWidth <= 580 ? 2 : 3,
	);
	$effect(() => {
		void character;
		void game.id;
		section = 'inputs';
		glossaryPage = 0;
	});
	const sections = [
		{ id: 'inputs', label: 'Inputs' },
		{ id: 'sequence', label: 'Sequence' },
		{ id: 'character', label: 'Character' },
	];
	const characterTerms = $derived(
		game.characters.find((item) => item.name === character)?.notationLegend ?? [],
	);
	const characterTermNames = $derived(new Set(characterTerms.map((item) => item.term)));
	const sequenceTerms = $derived(
		game.notation.legend.filter((item) => !characterTermNames.has(item.term)),
	);
	const terms = $derived(section === 'character' ? characterTerms : sequenceTerms);
	const pageCount = $derived(Math.max(1, Math.ceil(terms.length / termsPerPage)));
	$effect(() => {
		if (glossaryPage >= pageCount) glossaryPage = pageCount - 1;
	});
	const visibleTerms = $derived(
		terms.slice(glossaryPage * termsPerPage, (glossaryPage + 1) * termsPerPage),
	);
	function selectSection(id: string) {
		section = id;
		glossaryPage = 0;
	}
	function tabKeydown(event: KeyboardEvent, index: number) {
		let next = index;
		if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
		else if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = sections.length - 1;
		else return;
		event.preventDefault();
		selectSection(sections[next].id);
		const list = (event.currentTarget as HTMLElement).parentElement;
		list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
	}
	const directions = [
		{ number: 7, angle: -135, name: 'Up back' },
		{ number: 8, angle: -90, name: 'Up' },
		{ number: 9, angle: -45, name: 'Up forward' },
		{ number: 4, angle: 180, name: 'Back' },
		{ number: 5, angle: 0, name: 'Neutral' },
		{ number: 6, angle: 0, name: 'Forward' },
		{ number: 1, angle: 135, name: 'Down back' },
		{ number: 2, angle: 90, name: 'Down' },
		{ number: 3, angle: 45, name: 'Down forward' },
	];
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

<div class="dialog-heading">
	<div>
		<h2 id="notation-title">Notation</h2>
		<p class="dialog-context">{game.name} · {character}</p>
	</div>
	<button class="icon-button" aria-label="Close notation" onclick={onclose}
		><X size={20} aria-hidden="true" /></button
	>
</div>
<div class="notation-tabs" role="tablist" aria-label="Notation sections">
	{#each sections as item, index}
		<button
			id={'notation-tab-' + item.id}
			role="tab"
			aria-selected={section === item.id}
			aria-controls={'notation-' + item.id}
			tabindex={section === item.id ? 0 : -1}
			onclick={() => selectSection(item.id)}
			onkeydown={(event) => tabKeydown(event, index)}>{item.label}</button
		>
	{/each}
</div>
{#each sections as item}
	<div
		id={'notation-' + item.id}
		class="notation-content"
		role="tabpanel"
		aria-labelledby={'notation-tab-' + item.id}
		hidden={section !== item.id}
		tabindex="0"
	>
		{#if item.id === 'inputs'}
			<p class="notation-description">{game.notation.description}</p>
			<div class="notation-foundations">
				{#if game.notation.numpad}<section class="direction-key" aria-labelledby="direction-title">
						<h3 id="direction-title">Directions</h3>
						<div
							class="direction-pad"
							role="img"
							aria-label="Numpad directions facing right: 7 up back, 8 up, 9 up forward, 4 back, 5 neutral, 6 forward, 1 down back, 2 down, 3 down forward"
						>
							{#each directions as direction}<div
									class:neutral={direction.number === 5}
									aria-hidden="true"
								>
									<span>{direction.number}</span>
									{#if direction.number === 5}<svg viewBox="0 0 24 24" width="20" height="20"
											><circle cx="12" cy="12" r="3" fill="currentColor" /></svg
										>
									{:else}<svg
											viewBox="0 0 24 24"
											width="20"
											height="20"
											style={'transform: rotate(' + direction.angle + 'deg)'}
											><path
												d="M4 12h15m-6-6 6 6-6 6"
												fill="none"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linecap="round"
												stroke-linejoin="round"
											/></svg
										>{/if}
								</div>{/each}
						</div>
						<p class="facing-label">Facing right <ArrowRight size={15} aria-hidden="true" /></p>
					</section>{/if}
				{#if game.id === 'sf6'}<section class="button-key" aria-labelledby="buttons-title">
						<h3 id="buttons-title">Buttons</h3>
						<table>
							<thead
								><tr
									><td></td>{#each ['Light', 'Medium', 'Heavy'] as strength}<th scope="col"
											><abbr title={strength}>{strength[0]}</abbr></th
										>{/each}</tr
								></thead
							>
							<tbody
								>{#each ['P', 'K'] as type}<tr
										><th scope="row">{type === 'P' ? 'Punch' : 'Kick'}</th
										>{#each ['L', 'M', 'H'] as strength}<td
												><code class:punch={type === 'P'}>{strength}{type}</code></td
											>{/each}</tr
									>{/each}</tbody
							>
						</table>
						<p>L / M / H = light / medium / heavy.</p>
					</section>{/if}
			</div>
			<p class="notation-example"><code>2MP</code><span>Down + medium punch</span></p>
		{:else if section === item.id}
			<div class="notation-glossary" aria-live="polite" aria-atomic="true">
				{#if terms.length}<dl>
						{#each visibleTerms as term}<div>
								<dt><code>{term.term}</code></dt>
								<dd>{term.meaning}</dd>
							</div>{/each}
					</dl>{:else}<p>No additional character notation.</p>{/if}
			</div>
			{#if pageCount > 1}<nav class="notation-pages" aria-label="Notation pages">
					<button
						class="icon-button"
						aria-label="Previous notation page"
						disabled={glossaryPage === 0}
						onclick={() => glossaryPage--}><ArrowLeft size={18} aria-hidden="true" /></button
					>
					<span>{glossaryPage + 1} / {pageCount}</span>
					<button
						class="icon-button"
						aria-label="Next notation page"
						disabled={glossaryPage >= pageCount - 1}
						onclick={() => glossaryPage++}><ArrowRight size={18} aria-hidden="true" /></button
					>
				</nav>{/if}
		{/if}
	</div>
{/each}
