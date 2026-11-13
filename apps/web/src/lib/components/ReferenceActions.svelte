<script lang="ts">
	import type { Reference } from '@hyper-chamber/reference';
	import { Check, Copy, Star } from '@lucide/svelte';
	let { reference, saved, onsave }: { reference: Reference; saved: boolean; onsave: () => void } =
		$props();
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
</script>

<div class="reference-actions" role="group" aria-label="Reference actions">
	<button
		class="button save-reference-button"
		class:enabled={saved}
		aria-pressed={saved}
		aria-label={saved ? 'Unsave reference' : 'Save reference'}
		onclick={onsave}
	>
		<Star size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />{saved
			? 'Saved'
			: 'Save'}
	</button>
	<button class="button copy-input-button" type="button" onclick={copyInputs}>
		{#if copyState === 'Input sequence copied.'}<Check
				size={16}
				aria-hidden="true"
			/>Copied{:else}<Copy size={16} aria-hidden="true" />Copy inputs{/if}
	</button>
</div>
<p class="copy-feedback" class:sr-only={!copyFallback} role="status">{copyState}</p>
{#if copyFallback}<div class="copy-fallback"><code>{reference.notation}</code></div>{/if}

<style>
	.reference-actions {
		display: flex;
		align-items: center;
		gap: var(--control-gap);
	}
	.save-reference-button {
		min-inline-size: 88px;
	}
	.copy-input-button {
		min-inline-size: 132px;
	}
	.copy-feedback:not(.sr-only),
	.copy-fallback {
		grid-column: 1 / -1;
		color: var(--ink);
		font-size: 13px;
		line-height: 1.7;
	}
	.copy-fallback {
		padding: 12px 14px;
		border-radius: 6px;
		background: var(--soft);
		overflow-wrap: anywhere;
	}
	.copy-fallback code {
		user-select: all;
	}
</style>
