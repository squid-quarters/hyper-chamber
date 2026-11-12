<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { sourceLink, type Reference } from '@hyper-chamber/reference';
	let { reference }: { reference: Reference } = $props();
	const time = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
</script>

<section class="source-details" aria-labelledby={reference.id + '-source-title'}>
	<h2 id={reference.id + '-source-title'}>Source &amp; review</h2>
	<div class="source-columns">
		<div class="source-record">
			<a class="source-title" href={sourceLink(reference)} target="_blank" rel="noreferrer">
				<span>{reference.source.title}</span><ArrowUpRight size={16} aria-hidden="true" />
			</a>
			<dl class="source-metadata">
				<div>
					<dt>Creator</dt>
					<dd>{reference.source.creator}</dd>
				</div>
				<div>
					<dt>Excerpt</dt>
					<dd>{time(reference.source.start)}–{time(reference.source.end)}</dd>
				</div>
			</dl>
		</div>
		<div class="source-review">
			<h3>
				{reference.verification.status === 'source-reviewed' ? 'Source reviewed' : 'Review pending'}
			</h3>
			<p>{reference.verification.note}</p>
			<dl class="source-metadata">
				<div>
					<dt>Game version</dt>
					<dd>{reference.verification.gameVersion ?? 'Not established'}</dd>
				</div>
			</dl>
		</div>
	</div>
</section>

<style>
	.source-details {
		margin-block-start: 28px;
		padding: 24px;
		border-radius: 6px;
		background: var(--canvas);
	}
	h2 {
		margin-block-end: 18px;
		font-size: 14px;
		font-weight: 600;
	}
	.source-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 28px;
	}
	.source-columns > div {
		min-inline-size: 0;
	}
	.source-title {
		display: inline-flex;
		align-items: flex-start;
		gap: 10px;
		max-inline-size: 100%;
		font-size: 14px;
		font-weight: 600;
		line-height: 1.6;
		text-decoration-color: var(--border);
		overflow-wrap: anywhere;
	}
	.source-title :global(svg) {
		flex: none;
		margin-block-start: 3px;
	}
	.source-title:hover {
		color: var(--accent);
	}
	.source-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 28px;
		margin: 18px 0 0;
	}
	.source-metadata > div {
		display: grid;
		gap: 3px;
	}
	dt {
		color: var(--muted);
		font-size: 11px;
	}
	dd {
		margin: 0;
		font-size: 12px;
	}
	.source-review {
		padding-inline-start: 28px;
		border-inline-start: 1px solid var(--line);
	}
	h3 {
		margin-block-end: 8px;
		font-size: 13px;
		font-weight: 600;
	}
	.source-review p {
		max-inline-size: 70ch;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.75;
	}
	@media (max-width: 760px) {
		.source-details {
			padding: 20px;
		}
		.source-review p,
		dd {
			font-size: 13px;
		}
		.source-columns {
			grid-template-columns: 1fr;
			gap: 22px;
		}
		.source-review {
			padding-inline-start: 0;
			padding-block-start: 20px;
			border-inline-start: 0;
			border-block-start: 1px solid var(--line);
		}
	}
	@media (forced-colors: active) {
		.source-details {
			border: 1px solid CanvasText;
		}
	}
</style>
