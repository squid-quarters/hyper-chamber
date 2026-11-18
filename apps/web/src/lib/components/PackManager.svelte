<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import { ArrowLeft, FilePlus2, FolderInput, Trash2 } from '@lucide/svelte';
	import type {
		InstalledPackInfo,
		PackChangePreview,
		PackInventory,
	} from '@hyper-chamber/reference';

	let {
		active,
		refreshRevision,
		onbeforemaintenance,
		oncontentchange,
		onbusychange,
		oncreate,
	}: {
		active: boolean;
		refreshRevision: number;
		onbeforemaintenance?: () => Promise<void>;
		oncontentchange: (notice?: string) => Promise<void>;
		onbusychange: (busy: boolean) => void;
		oncreate: () => Promise<void>;
	} = $props();
	let inventory = $state<PackInventory | null>(null);
	let preview = $state<PackChangePreview | null>(null);
	let busy = $state(false);
	let error = $state('');
	let message = $state('');
	let operation = $state('');
	let allowConflicts = $state(false);
	let allowDowngrade = $state(false);
	let changeLimit = $state(40);
	let query = $state('');
	let visiblePacks = $derived(
		(inventory?.packs ?? []).filter((pack) =>
			`${pack.title} ${pack.author ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
		),
	);
	let heading = $state<HTMLHeadingElement>();
	let previewHeading = $state<HTMLHeadingElement>();
	let disposed = false;
	let requestRevision = 0;
	let closedDiscardAttempt: string | null = null;

	async function manage<T>(request: Record<string, unknown>): Promise<T> {
		const { invoke } = await import('@tauri-apps/api/core');
		return invoke<T>('manage_content', { request });
	}
	function setBusy(value: boolean, label = '') {
		busy = value;
		operation = label;
		onbusychange(value);
	}
	function reason(error: unknown) {
		return error instanceof Error ? error.message : String(error);
	}
	function bytes(value: number) {
		if (value < 1024 ** 2) return `${Math.max(1, Math.round(value / 1024))}\u00a0KB`;
		if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)}\u00a0MB`;
		return `${(value / 1024 ** 3).toFixed(2)}\u00a0GB`;
	}
	function references(value: number) {
		return `${value.toLocaleString()} ${value === 1 ? 'reference' : 'references'}`;
	}
	async function load() {
		const revision = ++requestRevision;
		setBusy(true, 'Loading packs…');
		error = '';
		try {
			const value = await manage<PackInventory>({ command: 'list' });
			if (!disposed && revision === requestRevision) inventory = value;
		} catch (cause) {
			if (!disposed && revision === requestRevision) error = reason(cause);
		} finally {
			if (!disposed && revision === requestRevision) setBusy(false);
		}
	}
	$effect(() => {
		const visible = active;
		const revision = refreshRevision;
		untrack(() => {
			if (visible && !busy && !preview) void load();
		});
	});
	$effect(() => {
		const token = !active && !busy ? preview?.token : null;
		if (active) closedDiscardAttempt = null;
		if (token && token !== closedDiscardAttempt) {
			closedDiscardAttempt = token;
			untrack(() => {
				void cancel(false);
			});
		}
	});
	onDestroy(() => {
		disposed = true;
		requestRevision++;
	});

	async function showPreview(value: PackChangePreview) {
		allowConflicts = false;
		allowDowngrade = false;
		changeLimit = 40;
		if (value.action === 'identical') {
			await manage({ command: 'discard', token: value.token });
			message = `${value.pack.title} ${value.pack.version} is already installed.`;
			return;
		}
		preview = value;
		await tick();
		if (active) previewHeading?.focus();
	}
	async function choose() {
		if (busy) return;
		setBusy(true, 'Checking pack…');
		error = '';
		message = '';
		try {
			const value = await manage<PackChangePreview | { cancelled: true }>({ command: 'preview' });
			if (!disposed && 'token' in value) await showPreview(value);
		} catch (cause) {
			if (!disposed) error = reason(cause);
		} finally {
			if (!disposed) setBusy(false);
		}
	}
	async function remove(pack: InstalledPackInfo) {
		if (busy) return;
		setBusy(true, 'Checking removal…');
		error = '';
		message = '';
		try {
			const value = await manage<PackChangePreview>({ command: 'remove-preview', packId: pack.id });
			if (!disposed) await showPreview(value);
		} catch (cause) {
			if (!disposed) error = reason(cause);
		} finally {
			if (!disposed) setBusy(false);
		}
	}
	async function cancel(restoreFocus = true) {
		const current = preview;
		if (!current || busy) return;
		setBusy(true);
		error = '';
		try {
			await manage({ command: 'discard', token: current.token });
			if (!disposed && preview?.token === current.token) preview = null;
			if (restoreFocus && active) {
				await tick();
				heading?.focus();
			}
		} catch (cause) {
			if (!disposed) error = `The preview could not be closed: ${reason(cause)}`;
		} finally {
			if (!disposed) setBusy(false);
		}
	}
	async function commit() {
		const current = preview;
		if (
			!current ||
			busy ||
			(current.conflicts.length > 0 && !allowConflicts) ||
			(current.downgrade && !allowDowngrade)
		)
			return;
		setBusy(true, current.action === 'remove' ? 'Removing pack…' : 'Installing pack…');
		error = '';
		try {
			await onbeforemaintenance?.();
			await manage({
				command: 'commit',
				token: current.token,
				expectedGeneration: current.generation,
				allowConflicts,
				allowDowngrade,
			});
			preview = null;
			message =
				current.action === 'remove'
					? `${current.pack.title} removed. Your notes and progress are kept.`
					: `${current.pack.title} ${current.pack.version} installed. Your notes and progress are kept.`;
			await oncontentchange(message);
			await load();
			await tick();
			if (active && !disposed) heading?.focus();
		} catch (cause) {
			if (!disposed) error = reason(cause);
		} finally {
			if (!disposed) setBusy(false);
		}
	}
	async function create() {
		if (busy) return;
		error = '';
		setBusy(true, 'Opening editor…');
		try {
			await oncreate();
		} catch (cause) {
			if (!disposed) error = reason(cause);
		} finally {
			if (!disposed) setBusy(false);
		}
	}
	let changes = $derived(
		preview
			? [
					...preview.added.map((id) => ({ id, label: 'Added' })),
					...preview.changed.map((id) => ({ id, label: 'Updated' })),
					...preview.removed.map((id) => ({ id, label: 'Unavailable' })),
				]
			: [],
	);
</script>

<div class="pack-manager" aria-busy={busy}>
	{#if error}<div class="pack-error" role="alert">
			<p>{error}</p>
			<button
				type="button"
				class="button button--quiet"
				disabled={busy}
				onclick={preview ? () => cancel() : load}>{preview ? 'Close Preview' : 'Retry'}</button
			>
		</div>{/if}
	{#if preview}
		<button
			type="button"
			class="button button--quiet preview-back"
			disabled={busy}
			onclick={() => cancel()}><ArrowLeft size={15} aria-hidden="true" />Installed Packs</button
		>
		<h3 class="preview-title" tabindex="-1" bind:this={previewHeading}>
			{preview.action === 'remove'
				? 'Remove Pack'
				: preview.action === 'update'
					? 'Update Pack'
					: 'Install Pack'}
		</h3>
		<p class="preview-name">{preview.pack.title}</p>
		<p class="pack-meta">
			Edition {preview.pack.version} · {references(preview.pack.references)} · {bytes(
				preview.pack.bytes,
			)}
		</p>
		{#if preview.pack.author}<p class="pack-author">By {preview.pack.author}</p>{/if}
		<dl class="change-summary">
			{#if preview.added.length}<div>
					<dt>Added</dt>
					<dd>{references(preview.added.length)}</dd>
				</div>{/if}
			{#if preview.changed.length}<div>
					<dt>Updated</dt>
					<dd>{references(preview.changed.length)}</dd>
				</div>{/if}
			{#if preview.removed.length}<div>
					<dt>Unavailable After This Change</dt>
					<dd>{references(preview.removed.length)}</dd>
				</div>{/if}
			{#if preview.fallbacks.length}<div>
					<dt>Older Executions</dt>
					<dd>{references(preview.fallbacks.length)}</dd>
				</div>{/if}
		</dl>
		{#if !changes.length}<p class="pack-helper">Your visible references will stay the same.</p>{/if}
		{#if preview.action === 'remove'}<p class="removal-note">
				This removes the pack's media and recovery copies. Your notes, saved references and practice
				status stay in the library. Reimport the pack to use them again.
			</p>{/if}
		{#if preview.warnings.length}<ul class="preview-warnings">
				{#each preview.warnings as warning}<li>{warning}</li>{/each}
			</ul>{/if}
		{#if changes.length}<details class="change-details">
				<summary>View Reference Changes</summary>
				<ul>
					{#each changes.slice(0, changeLimit) as change}<li>
							<span>{preview.referenceTitles[change.id] ?? change.id}</span><small
								>{change.label}</small
							>
						</li>{/each}
				</ul>
				{#if changes.length > changeLimit}<button
						type="button"
						class="button button--quiet"
						onclick={() => (changeLimit += 40)}
						>Show {Math.min(40, changes.length - changeLimit)} More</button
					>{/if}
			</details>{/if}
		{#if preview.conflicts.length}<div class="consent-group">
				<p>Content overlaps with another installed pack:</p>
				<ul>
					{#each preview.conflicts as conflict}<li>{conflict}</li>{/each}
				</ul>
				<label
					><input type="checkbox" bind:checked={allowConflicts} disabled={busy} /><span
						>Allow this pack to provide overlapping content</span
					></label
				>
			</div>{/if}
		{#if preview.downgrade}<label class="older-consent"
				><input type="checkbox" bind:checked={allowDowngrade} disabled={busy} /><span
					>Use the older pack edition or execution revisions shown above</span
				></label
			>{/if}
		<div class="preview-actions">
			<button
				type="button"
				class="button primary-button"
				disabled={busy ||
					(preview.conflicts.length > 0 && !allowConflicts) ||
					(preview.downgrade && !allowDowngrade)}
				onclick={commit}
				>{preview.action === 'remove'
					? 'Remove Pack'
					: preview.action === 'update'
						? 'Update Pack'
						: 'Install Pack'}</button
			><button type="button" class="button button--quiet" disabled={busy} onclick={() => cancel()}
				>Cancel</button
			>
		</div>
	{:else}
		<div class="pack-heading">
			<h3 tabindex="-1" bind:this={heading}>Installed Packs</h3>
			{#if inventory}<span
					>{inventory.packs.length.toLocaleString()}
					{inventory.packs.length === 1 ? 'pack' : 'packs'}</span
				>{/if}
		</div>
		{#if !inventory && busy}<p class="pack-helper" role="status">
				Loading installed content…
			</p>{:else if inventory}
			{#if inventory.packs.length > 6}<label class="pack-search-label" for="installed-pack-search"
					>Search Packs</label
				><input
					class="pack-search"
					id="installed-pack-search"
					type="search"
					bind:value={query}
				/>{/if}{#if inventory.packs.length}<ul class="pack-list">
					{#each visiblePacks as pack (pack.id)}<li>
							<div class="pack-description">
								<h4>{pack.title}</h4>
								<p class="pack-meta">
									Edition {pack.version} · {references(pack.references)} · {bytes(pack.bytes)}
								</p>
								{#if pack.author}<p class="pack-author">
										By {pack.author}
									</p>{/if}{#if pack.retainedBytes}<p class="pack-helper">
										Recovery copy: {bytes(pack.retainedBytes)}
									</p>{/if}{#if pack.problem}<p class="pack-problem">
										This pack is unavailable. Reimport it to repair the content.
									</p>
									<details class="problem-details">
										<summary>Details</summary>
										<p>{pack.problem}</p>
									</details>{/if}
							</div>
							<div class="pack-row-actions">
								{#if pack.problem}<button
										type="button"
										class="button button--quiet"
										disabled={busy}
										onclick={choose}>Reimport</button
									>{/if}<button
									type="button"
									class="button button--quiet remove-pack"
									aria-label={`Remove ${pack.title}`}
									disabled={busy}
									onclick={() => remove(pack)}
									><Trash2 size={15} aria-hidden="true" /><span>Remove</span></button
								>
							</div>
						</li>{/each}
				</ul>
				{#if !visiblePacks.length}<p class="empty-packs">No packs match this search.</p>
					<button type="button" class="button button--quiet" onclick={() => (query = '')}
						>Clear Search</button
					>{/if}{:else}<p class="empty-packs">
					No packs installed. Import a pack to browse its references, or create your own.
				</p>{/if}
			{#if inventory.cleanupWarning}<p class="pack-error">{inventory.cleanupWarning}</p>{/if}
		{/if}
		<div class="pack-actions">
			<button type="button" class="button" disabled={busy} onclick={choose}
				><FolderInput size={16} aria-hidden="true" />Import Pack</button
			><button type="button" class="button button--quiet" disabled={busy} onclick={create}
				><FilePlus2 size={16} aria-hidden="true" />Create Pack</button
			>
		</div>
		<p class="pack-helper">Import a .hcpack file to add content or update an existing edition.</p>
	{/if}
	{#if busy && operation}<p class="operation-status" role="status">{operation}</p>{/if}
	{#if message}<p class="pack-message" role="status">{message}</p>{/if}
</div>

<style>
	.pack-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
	}
	h3,
	h4,
	p,
	ul,
	dl {
		margin: 0;
	}
	h3 {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.35;
	}
	h4 {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}
	.pack-heading > span,
	.pack-helper,
	.pack-meta,
	.pack-author {
		color: var(--muted);
		font-size: 12px;
		line-height: 1.6;
	}
	.pack-helper,
	.pack-author {
		margin-block-start: 5px;
	}
	.pack-list {
		list-style: none;
		padding: 0;
		margin-block: 8px 16px;
	}
	.pack-list > li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-block: 14px;
		border-block-end: 1px solid var(--line);
	}
	.pack-description {
		min-inline-size: 0;
	}
	.pack-meta {
		margin-block-start: 4px;
		overflow-wrap: anywhere;
	}
	.remove-pack {
		flex: none;
		padding-inline: 8px;
	}
	.pack-row-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: none;
	}
	.pack-search-label {
		display: block;
		margin-block: 16px 6px;
		font-size: 12px;
		color: var(--muted);
	}
	.pack-search {
		inline-size: 100%;
		font: inherit;
		min-block-size: 44px;
	}
	.pack-problem {
		font-size: 12px;
		line-height: 1.6;
		color: var(--error-text);
		margin-block-start: 7px;
	}
	.problem-details {
		font-size: 12px;
		line-height: 1.6;
		margin-block-start: 4px;
	}
	.problem-details summary {
		cursor: pointer;
		min-block-size: 32px;
	}
	.problem-details p {
		overflow-wrap: anywhere;
		margin-block: 6px;
	}
	.pack-actions,
	.preview-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.pack-actions + .pack-helper {
		margin-block-start: 10px;
	}
	.preview-back {
		margin-block: 0 14px;
		padding-inline-start: 0;
	}
	.preview-title {
		font-size: 17px;
	}
	.preview-name {
		font-size: 16px;
		font-weight: 600;
		margin-block-start: 10px;
		overflow-wrap: anywhere;
	}
	.change-summary {
		margin-block: 18px;
		display: grid;
		gap: 8px;
	}
	.change-summary > div {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		font-size: 13px;
		line-height: 1.5;
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		text-align: end;
		font-variant-numeric: tabular-nums;
	}
	.removal-note,
	.empty-packs {
		font-size: 13px;
		line-height: 1.65;
	}
	.empty-packs {
		margin-block: 16px;
	}
	.removal-note {
		margin-block: 14px;
	}
	.preview-warnings {
		padding-inline-start: 20px;
		margin-block: 12px;
		font-size: 12px;
		line-height: 1.7;
		color: var(--error-text);
	}
	.change-details {
		margin-block: 16px;
		font-size: 12px;
	}
	.change-details summary {
		min-block-size: 44px;
		display: list-item;
		padding-block: 12px;
		cursor: pointer;
	}
	.change-details ul {
		list-style: none;
		padding: 0;
		max-block-size: 16rem;
		overflow: auto;
	}
	.change-details li {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		border-block-start: 1px solid var(--line);
		padding-block: 10px;
		line-height: 1.5;
	}
	.change-details li > span {
		overflow-wrap: anywhere;
	}
	.change-details small {
		color: var(--muted);
		white-space: nowrap;
		font-size: 11px;
	}
	.consent-group,
	.older-consent {
		margin-block: 16px;
		font-size: 13px;
		line-height: 1.6;
	}
	.consent-group ul {
		padding-inline-start: 20px;
		margin-block: 8px;
		font-size: 12px;
		overflow-wrap: anywhere;
	}
	.consent-group label,
	.older-consent {
		display: flex;
		align-items: start;
		gap: 10px;
		min-block-size: 44px;
		padding-block: 10px;
		cursor: pointer;
	}
	.consent-group input,
	.older-consent input {
		inline-size: 18px;
		block-size: 18px;
		flex: none;
		margin: 3px 0 0;
		accent-color: var(--ink);
	}
	.preview-actions {
		margin-block-start: 20px;
	}
	.pack-error,
	.pack-message {
		padding: 12px;
		background: var(--selected);
		border-radius: 4px;
		margin-block: 12px;
		font-size: 13px;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}
	.pack-error {
		background: var(--error-bg);
		color: var(--error-text);
	}
	.pack-error .button {
		margin-block-start: 6px;
		padding-inline-start: 0;
	}
	.operation-status {
		margin-block-start: 12px;
		font-size: 12px;
		color: var(--muted);
	}
	@media (max-width: 420px) {
		.pack-list > li {
			align-items: start;
			gap: 6px;
		}
		.pack-list > li:has(.pack-problem) {
			flex-direction: column;
		}
		.remove-pack {
			min-block-size: 44px;
		}
		.change-summary > div {
			gap: 10px;
		}
		.pack-actions {
			align-items: stretch;
		}
		.pack-actions > * {
			flex: 1 1 auto;
			justify-content: center;
		}
	}
	@media (forced-colors: active) {
		.pack-error,
		.pack-message {
			border: 1px solid CanvasText;
		}
		.preview-warnings {
			color: CanvasText;
		}
	}
</style>
