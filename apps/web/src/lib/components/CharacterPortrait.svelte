<script lang="ts">
	import { UserRound } from '@lucide/svelte';
	let {
		characterId,
		size = 40,
		class: className = '',
		lazy = false,
	}: {
		characterId: string;
		size?: number;
		class?: string;
		lazy?: boolean;
	} = $props();
	let failed = $state(false);
	$effect(() => {
		void characterId;
		failed = false;
	});
</script>

<span
	class={'character-face ' + className}
	style:width={size + 'px'}
	style:height={size + 'px'}
	aria-hidden="true"
>
	{#if !failed}<img
			src={'/portraits/' + characterId + '.webp'}
			alt=""
			width={size}
			height={size}
			loading={lazy ? 'lazy' : 'eager'}
			onerror={() => (failed = true)}
		/>
	{:else}<UserRound size={Math.round(size * 0.5)} />{/if}
</span>

<style>
	.character-face {
		display: inline-grid;
		place-items: center;
		flex: none;
		overflow: clip;
		border-radius: 3px;
		background: var(--soft);
		color: var(--muted);
	}
	img {
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
	}
</style>
