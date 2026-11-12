<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { version } from '../../../package.json';
	import BrandMark from './BrandMark.svelte';
</script>

<footer class="site-footer">
	<div class="footer-identity">
		<span class="footer-brand"><BrandMark size={22} /><span>Hyper Chamber</span></span>
		<a
			class="app-version"
			href="https://github.com/squid-quarters/hyper-chamber/blob/develop/CHANGELOG.md"
			target="_blank"
			rel="noreferrer"
			aria-label={'Hyper Chamber v' + version + '. View changelog'}>v{version}</a
		>
	</div>
	<nav aria-label="Project links">
		<a href="https://github.com/squid-quarters/hyper-chamber" target="_blank" rel="noreferrer"
			>GitHub<ArrowUpRight size={13} aria-hidden="true" /></a
		>
	</nav>
	<p>
		By Squid Quarters. Independent reference. Game names and characters belong to their respective
		owners.
	</p>
</footer>

<style>
	.site-footer {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px 24px;
		margin-block-start: auto;
		padding: 22px max(32px, calc((100% - 1536px) / 2));
		border-block-start: 1px solid var(--line);
		background: var(--canvas);
		color: var(--muted);
		font-size: 12px;
	}
	.footer-identity,
	.footer-brand,
	nav,
	a {
		display: flex;
		align-items: center;
	}
	.footer-identity {
		flex-wrap: wrap;
		gap: 12px;
	}
	.footer-brand {
		gap: 8px;
		color: var(--ink);
		font-weight: 600;
	}
	.footer-brand :global(svg) {
		color: var(--accent);
	}
	.app-version {
		font-variant-numeric: tabular-nums;
		text-decoration-color: var(--border);
	}
	nav {
		flex-wrap: wrap;
		gap: 18px;
	}
	a {
		gap: 5px;
		min-block-size: 28px;
	}
	a:hover {
		color: var(--accent);
	}
	p {
		grid-column: 1 / -1;
		font-size: 11px;
	}
	@media (max-width: 760px) {
		.site-footer {
			grid-template-columns: 1fr;
			gap: 12px;
			padding: 20px;
		}
		a {
			min-block-size: 44px;
		}
		nav {
			gap: 24px;
		}
	}
</style>
