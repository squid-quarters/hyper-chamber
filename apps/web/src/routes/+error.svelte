<script lang="ts">
	import { page } from '$app/state';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import HostSettings from '#lib/components/HostSettings.svelte';
	import AppFooter from '#lib/components/AppFooter.svelte';
</script>

<svelte:head><title>Library unavailable — Hyper Chamber</title></svelte:head>
<div class="error-shell">
	<header><BrandMark size={36} /><strong>Hyper Chamber</strong></header>
	<main>
		<p class="eyebrow">Library connection</p>
		<h1>Your library isn’t available</h1>
		<p>{page.error?.message ?? 'Keep the desktop app running, then try connecting again.'}</p>
		<div class="actions">
			<button class="button" onclick={() => window.location.reload()}>Try again</button
			><HostSettings
				oncontentchange={async () => {
					window.location.reload();
				}}
			/>
		</div>
	</main>
	<AppFooter />
</div>

<style>
	.error-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	header {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 24px 32px;
	}
	main {
		width: min(640px, 100%);
		padding: 60px 24px 100px;
		margin: auto;
	}
	.eyebrow {
		color: var(--muted);
		font-size: 12px;
	}
	h1 {
		margin: 12px 0;
		font-size: clamp(30px, 6vw, 44px);
	}
	main > p {
		line-height: 1.7;
	}
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: 28px;
	}
</style>
