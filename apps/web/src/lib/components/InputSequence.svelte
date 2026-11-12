<script lang="ts">
	import type { GameDefinition, Reference } from '@hyper-chamber/reference';

	let {
		reference,
		game,
		compact = false,
		showActions = true,
	}: {
		reference: Reference;
		game: GameDefinition;
		compact?: boolean;
		showActions?: boolean;
	} = $props();
	let copyState = $state('');
	let copyFallback = $state(false);
	$effect(() => {
		if (!reference.id) return;
		copyState = '';
		copyFallback = false;
	});
	async function copyInputs() {
		const referenceId = reference.id;
		const notation = reference.notation;
		try {
			if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
			await navigator.clipboard.writeText(notation);
			if (reference.id !== referenceId) return;
			copyState = 'Input sequence copied.';
			copyFallback = false;
		} catch {
			if (reference.id !== referenceId) return;
			copyFallback = true;
			copyState = 'Copy unavailable. Select the sequence below to copy it.';
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

<div class="input-sequence" class:compact>
	<p class="sr-only">Moves in order. Connections show sequence only, not timing or cancel rules.</p>
	{#if compact}
		<div class="sequence-toolbar">
			<h3>Input sequence</h3>
			{#if showActions}
				<div class="sequence-actions">
					<button onclick={copyInputs}
						>{copyState === 'Input sequence copied.' ? 'Copied' : 'Copy inputs'}</button
					>
				</div>
			{/if}
		</div>
	{/if}
	<ol
		class="move-flow"
		class:short-sequence={reference.inputs.length <= 4}
		style={`--move-count: ${reference.inputs.length}`}
		role="list"
	>
		{#each reference.inputs as input, index (`${reference.id}:${input.id}`)}
			<li
				class="move-step"
				title={compact ? `${input.label}${input.cue ? ` — ${input.cue}` : ''}` : undefined}
			>
				<span class="move-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
				<div class="move-content">
					{#if actorName(input.actorId)}<span class="move-actor">{actorName(input.actorId)}</span
						>{/if}
					<code class="move-notation">{input.notation}</code>
					{#if input.label !== input.notation}<span class="move-label" class:sr-only={compact}
							>{input.label}</span
						>{/if}
					{#if input.cue}<p class="move-cue" class:sr-only={compact}>{input.cue}</p>{/if}
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
	{#if showActions}
		{#if compact}
			<p class="compact-copy-state" class:sr-only={!copyFallback} role="status">{copyState}</p>
			{#if copyFallback}
				<div class="compact-text-notation"><p><code>{reference.notation}</code></p></div>
			{/if}
		{:else}
			<div class="copy-inputs">
				<button onclick={copyInputs}>Copy inputs</button><span role="status">{copyState}</span>
			</div>
			{#if copyFallback}<p class="compact-text-notation"><code>{reference.notation}</code></p>{/if}
		{/if}
	{/if}
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
	.sequence-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin-bottom: 0.35rem;
	}
	.sequence-toolbar h3 {
		font-size: 0.75rem;
		font-weight: 600;

		color: var(--panel-muted);
	}
	.sequence-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
	}
	.sequence-actions button {
		min-block-size: 30px;
		padding: 0.2rem 0;
		color: var(--panel-ink);
		font-size: 0.8rem;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.sequence-actions button:focus-visible {
		outline-color: var(--panel-accent);
	}
	.compact .move-flow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.6rem;
		margin: 0;
	}
	.compact .move-step {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		max-inline-size: 100%;
		min-inline-size: 0;
		padding: 0;
	}
	.compact .move-index {
		display: none;
	}

	.compact .move-content {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem;
		min-inline-size: 0;
		margin: 0;
		padding: 0;
	}
	.compact .move-notation {
		padding: 2px 7px;
		border: 1px solid var(--line);
		border-radius: 3px;
		background: var(--surface);
		font-size: 0.95rem;
		line-height: 1.5;
	}
	.compact .move-actor {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.6;
	}
	.compact .move-connection {
		position: static;
		display: inline-flex;
		flex: none;
		align-self: center;
		flex-direction: row;
		width: 18px;
		height: 14px;
		margin-inline-start: 0.2rem;
	}
	.compact .move-connection::before {
		display: none;
	}
	.compact .move-connection svg {
		width: 12px;
		height: 18px;
		margin: -2px 3px;
		transform: rotate(-90deg);
	}
	.compact-copy-state:not(.sr-only) {
		margin-top: 0.65rem;
		font-size: 0.8rem;
		color: var(--panel-ink);
	}
	.compact-text-notation {
		margin-top: 0.65rem;
		border-top: 1px solid var(--border);
		padding-top: 0.65rem;
		color: var(--panel-ink);
		font-size: 0.85rem;
		line-height: 1.8;
		overflow-wrap: anywhere;
	}
	.compact-text-notation code {
		user-select: all;
	}
	@media (max-width: 760px) {
		.compact .sequence-toolbar {
			margin-block-end: 10px;
		}
		.compact .sequence-toolbar h3 {
			font-size: 14px;
		}
		.compact .sequence-actions {
			gap: 0 14px;
		}
		.compact .sequence-actions button {
			min-block-size: 44px;
			font-size: 12px;
		}
		.compact .move-flow {
			gap: 10px 8px;
		}
		.compact .move-notation {
			padding: 5px 9px;
			font-size: 16px;
			line-height: 1.5;
		}
		.compact .move-connection {
			width: 18px;
			margin-inline-start: 2px;
		}
	}
	@media (forced-colors: active) {
		.move-index,
		.move-cue {
			border-color: CanvasText;
		}
		.move-connection {
			color: CanvasText;
		}
	}
</style>
