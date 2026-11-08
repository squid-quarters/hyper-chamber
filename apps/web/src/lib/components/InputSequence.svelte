<script lang="ts">
	import type { GameDefinition, Reference } from '@hyper-chamber/reference';

	let { reference, game }: { reference: Reference; game: GameDefinition } = $props();
	let copyState = $state('');
	let showText = $state(false);
	async function copyInputs() {
		try {
			if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
			await navigator.clipboard.writeText(reference.notation);
			copyState = 'Input sequence copied.';
		} catch {
			showText = true;
			copyState = 'Copy unavailable. Select the text notation below to copy it.';
		}
	}
	function actorName(actorId: string | undefined): string | undefined {
		if (!actorId || reference.participants.length < 2) return undefined;
		const participant = reference.participants.find((actor) => actor.id === actorId);
		if (!participant) return undefined;
		const name = game.characters.find(
			(character) => character.id === participant.characterId,
		)?.name;
		if (!name) return participant.id;
		const mirrored = reference.participants.some(
			(actor) => actor.id !== participant.id && actor.characterId === participant.characterId,
		);
		return mirrored ? `${name} (${participant.id})` : name;
	}
</script>

<div class="input-sequence">
	<p class="sr-only">Moves in order. Connections show sequence only, not timing or cancel rules.</p>
	<ol
		class="move-flow"
		class:short-sequence={reference.inputs.length <= 4}
		style={`--move-count: ${reference.inputs.length}`}
		role="list"
	>
		{#each reference.inputs as input, index (`${reference.id}:${input.id}`)}
			<li class="move-step">
				<span class="move-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
				<div class="move-content">
					{#if actorName(input.actorId)}<span class="move-actor">{actorName(input.actorId)}</span
						>{/if}
					<code class="move-notation">{input.notation}</code>
					{#if input.label !== input.notation}<span class="move-label">{input.label}</span>{/if}
					{#if input.cue}<p class="move-cue">{input.cue}</p>{/if}
				</div>
				{#if index < reference.inputs.length - 1}
					<span class="move-connection" aria-hidden="true"
						><svg viewBox="0 0 12 18" width="12" height="18" focusable="false"
							><path
								d="M6 0v15m-4-4 4 4 4-4"
								fill="none"
								stroke="currentColor"
								stroke-width="1.2"
							/></svg
						></span
					>
				{/if}
			</li>
		{/each}
	</ol>
	{#key reference.id}
		<div class="copy-inputs">
			<button onclick={copyInputs}>Copy inputs</button><span role="status">{copyState}</span>
		</div>
		<details class="sequence-text" bind:open={showText}>
			<summary>Text notation</summary>
			<p><code>{reference.notation}</code></p>
		</details>
	{/key}
</div>

<style>
	.copy-inputs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 14px;
		font-size: 12px;
		color: var(--panel-muted);
	}
	.copy-inputs button {
		min-height: 40px;
		border: 1px solid var(--border);
		padding: 8px 12px;
		color: var(--panel-ink);
	}
	.sequence-text code {
		user-select: all;
	}
	.input-sequence {
		container-type: inline-size;
		min-width: 0;
	}
	.move-flow {
		margin: 18px 0 0;
		padding: 0;
		list-style: none;
	}
	.move-step {
		position: relative;
		display: grid;
		grid-template-columns: 24px minmax(0, 1fr);
		column-gap: 12px;
		padding-bottom: 24px;
	}
	.move-step:last-child {
		padding-bottom: 0;
	}
	.move-index {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 1px solid var(--border);
		border-radius: 50%;
		color: var(--panel-muted);
		font:
			11px/1 ui-monospace,
			monospace;
	}
	.move-content {
		min-width: 0;
		padding-top: 1px;
	}
	.move-notation {
		display: block;
		color: var(--panel-accent);
		font:
			600 16px/1.4 ui-monospace,
			monospace;
		overflow-wrap: anywhere;
	}
	.move-label {
		display: block;
		margin-top: 4px;
		color: var(--panel-ink);
		font-size: 12px;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	.move-cue {
		margin-top: 7px;
		padding-left: 8px;
		border-left: 1px solid var(--border);
		color: var(--panel-muted);
		font-size: 12px;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}
	.move-actor {
		display: block;
		margin-bottom: 5px;
		color: var(--panel-ink);
		font-size: 12px;
		font-weight: 600;
	}
	.move-connection {
		position: absolute;
		top: 29px;
		bottom: 3px;
		left: 6px;
		width: 12px;
		color: var(--panel-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.move-connection::before {
		content: '';
		width: 1px;
		background: currentColor;
		flex: 1;
	}
	.move-connection svg {
		display: block;
		flex: none;
	}
	.sequence-text {
		margin-top: 18px;
		border-top: 1px solid var(--border);
	}
	.sequence-text summary {
		width: fit-content;
		padding: 12px 2px 2px;
		min-height: 36px;
		color: var(--panel-muted);
		cursor: pointer;
		font-size: 12px;
	}
	.sequence-text summary:focus-visible {
		outline-color: var(--panel-accent);
	}
	.sequence-text p {
		margin: 9px 0 1px;
		color: var(--panel-ink);
		font-size: 12px;
		line-height: 1.8;
		overflow-wrap: anywhere;
	}
	@container (min-width: 500px) {
		.short-sequence {
			display: grid;
			grid-template-columns: repeat(var(--move-count), minmax(0, 1fr));
			gap: 26px;
		}
		.short-sequence .move-step {
			display: block;
			padding: 0;
		}
		.short-sequence .move-content {
			margin-top: 10px;
		}
		.short-sequence .move-connection {
			top: 6px;
			bottom: auto;
			left: 34px;
			right: -15px;
			height: 12px;
			width: auto;
			flex-direction: row;
		}
		.short-sequence .move-connection::before {
			height: 1px;
			width: auto;
		}
		.short-sequence .move-connection svg {
			transform: rotate(-90deg);
			margin: -3px 3px;
		}
	}
	@media (forced-colors: active) {
		.move-index,
		.move-cue,
		.sequence-text {
			border-color: CanvasText;
		}
		.move-connection {
			color: CanvasText;
		}
	}
</style>
