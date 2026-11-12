<script lang="ts">
	import { ArrowRight, X } from '@lucide/svelte';
	import type { GameDefinition } from '@hyper-chamber/reference';
	let {
		game,
		character,
		onclose,
	}: { game: GameDefinition; character: string; onclose: () => void } = $props();
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

<div class="dialog-heading">
	<div>
		<h2 id="notation-title">Notation</h2>
		<p class="dialog-context">{game.name} · {character}</p>
	</div>
	<button class="icon-button" aria-label="Close notation" onclick={onclose}
		><X size={20} aria-hidden="true" /></button
	>
</div>
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
						{#if direction.number === 5}<svg viewBox="0 0 24 24" width="22" height="22"
								><circle cx="12" cy="12" r="3" fill="currentColor" /></svg
							>
						{:else}<svg
								viewBox="0 0 24 24"
								width="22"
								height="22"
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
						><td></td><th scope="col">Light</th><th scope="col">Medium</th><th scope="col">Heavy</th
						></tr
					></thead
				>
				<tbody
					>{#each ['P', 'K'] as type}<tr
							><th scope="row">{type === 'P' ? 'Punch' : 'Kick'}</th>
							{#each ['L', 'M', 'H'] as strength}<td
									><code class:punch={type === 'P'}>{strength}{type}</code></td
								>{/each}
						</tr>{/each}</tbody
				>
			</table>
			<p>Directions and buttons combine in the written input, for example <code>2MP</code>.</p>
		</section>{/if}
</div>
<section class="notation-terms" aria-labelledby="terms-title">
	<h3 id="terms-title">Reading a sequence</h3>
	<dl>
		{#each game.notation.legend as item}<div>
				<dt><code>{item.term}</code></dt>
				<dd>{item.meaning}</dd>
			</div>{/each}
	</dl>
</section>
<p class="notation-footnote">
	Connectors show move order. Use the reference’s cues and replay for timing.
</p>
