<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PackManager from './PackManager.svelte';
	import { MonitorSmartphone, X, ArrowUpRight, RotateCcw, Save } from '@lucide/svelte';
	import type { LibraryRuntime, LibraryBackupInfo } from '@hyper-chamber/reference';
	import QRCode from 'qrcode';

	let {
		oncontentchange,
		onbeforemaintenance,
	}: {
		oncontentchange: (notice?: string) => Promise<void>;
		onbeforemaintenance?: () => Promise<void>;
	} = $props();
	let dialog: HTMLDialogElement;
	let runtime = $state<LibraryRuntime | null>(null);
	let desktop = $state(false);
	let libraryDir = $state('');
	let busy = $state(false);
	let error = $state('');
	let message = $state('');
	let qr = $state('');
	let selectedAddress = $state('');
	let opened = $state(false);
	let contentBusy = $state(false);
	let refreshRevision = $state(0);
	let snapshots = $state<LibraryBackupInfo[] | null>(null);
	let snapshotRevision = $state(0);
	let selectedSnapshot = $state<LibraryBackupInfo | null>(null);
	let restoreConfirmed = $state(false);
	let controlsBusy = $derived(busy || contentBusy);
	let maintenanceStatus = $state('');
	async function manage<T>(request: Record<string, unknown>) {
		return invoke<T>('manage_content', { request });
	}
	function close() {
		opened = false;
		snapshots = null;
		selectedSnapshot = null;
		restoreConfirmed = false;
	}
	function date(value: string) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime())
			? value
			: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
					parsed,
				);
	}
	function size(value: number) {
		return value < 1024 ** 2
			? `${Math.max(1, Math.round(value / 1024))}\u00a0KB`
			: `${(value / 1024 ** 2).toFixed(1)}\u00a0MB`;
	}
	async function contentChanged(notice?: string) {
		await oncontentchange(notice);
		try {
			await refresh();
		} catch {
			// The committed change is already reported. Reopening retries host information.
		}
	}
	async function createPack() {
		await onbeforemaintenance?.();
		const currentDialog = dialog;
		await goto('/create');
		currentDialog.close();
	}
	async function invoke<T>(command: string, args?: Record<string, unknown>) {
		const { invoke } = await import('@tauri-apps/api/core');
		return invoke<T>(command, args);
	}
	async function refresh() {
		if (desktop) {
			const info = await invoke<{ libraryDir: string; runtime: LibraryRuntime }>('get_host_info');
			runtime = info.runtime;
			libraryDir = info.libraryDir;
		} else {
			const response = await fetch('/api/runtime');
			if (!response.ok) throw new Error('The library could not be reached.');
			runtime = await response.json();
		}
		selectedAddress = runtime?.sharing.addresses.includes(selectedAddress)
			? selectedAddress
			: (runtime?.sharing.addresses[0] ?? '');
		refreshRevision++;
	}
	async function show() {
		error = '';
		message = '';
		dialog.showModal();
		opened = true;
		busy = true;
		try {
			await refresh();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : String(reason);
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}
	async function setSharing(enabled: boolean) {
		busy = true;
		error = '';
		message = '';
		try {
			await invoke('set_sharing_enabled', { enabled });
			await refresh();
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}
	async function chooseLibrary() {
		busy = true;
		error = '';
		message = '';
		try {
			await onbeforemaintenance?.();
			await invoke('choose_library_folder');
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}
	async function revealLibrary() {
		error = '';
		try {
			await invoke('reveal_library_folder');
		} catch (reason) {
			error = String(reason);
		}
	}

	async function backup() {
		busy = true;
		maintenanceStatus = 'Saving backup…';
		error = '';
		message = '';
		try {
			await onbeforemaintenance?.();
			await invoke<{ file: string }>('create_backup');
			message = 'Your notes and progress are backed up.';
			if (snapshots) await readSnapshots();
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}
	async function readSnapshots() {
		const result = await manage<{ snapshots: LibraryBackupInfo[]; maintenanceRevision: number }>({
			command: 'backups',
		});
		if (!opened) return;
		snapshots = result.snapshots;
		snapshotRevision = result.maintenanceRevision;
		selectedSnapshot = null;
		restoreConfirmed = false;
	}
	async function showSnapshots() {
		busy = true;
		maintenanceStatus = 'Loading backups…';
		error = '';
		message = '';
		try {
			await readSnapshots();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}
	async function restore() {
		const selected = selectedSnapshot;
		if (!selected || !restoreConfirmed || !runtime) return;
		busy = true;
		maintenanceStatus = 'Restoring notes and progress…';
		error = '';
		message = '';
		try {
			await onbeforemaintenance?.();
			const result = await manage<{ restored: number; maintenanceRevision: number }>({
				command: 'restore',
				file: selected.file,
				expectedMaintenanceRevision: snapshotRevision,
			});
			selectedSnapshot = null;
			restoreConfirmed = false;
			snapshots = null;
			message = `Restored notes and progress for ${result.restored.toLocaleString()} ${result.restored === 1 ? 'reference' : 'references'}. Installed packs are unchanged.`;
			await contentChanged(message);
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
			restoreConfirmed = false;
		} finally {
			busy = false;
			maintenanceStatus = '';
		}
	}

	$effect(() => {
		const address = selectedAddress;
		qr = '';
		if (!address) return;
		let current = true;
		void QRCode.toDataURL(address, {
			width: 208,
			margin: 2,
			color: { dark: '#252c27', light: '#ffffff' },
		})
			.then((value) => {
				if (current) qr = value;
			})
			.catch(() => {});
		return () => {
			current = false;
		};
	});
	onMount(() => {
		desktop = '__TAURI_INTERNALS__' in window;
	});
</script>

<button
	type="button"
	class="host-trigger"
	aria-label="Library and Devices"
	title="Library and Devices"
	onclick={show}
>
	<MonitorSmartphone size={18} aria-hidden="true" /><span class="utility-label">Devices</span>
</button>
<dialog class="host-dialog" bind:this={dialog} aria-labelledby="host-title" onclose={close}>
	<header>
		<div>
			<h2 id="host-title">Library &amp; Devices</h2>
		</div>
		<button
			type="button"
			class="icon-button"
			onclick={() => dialog.close()}
			aria-label="Close Library and Devices"><X size={20} aria-hidden="true" /></button
		>
	</header>
	<div class="host-body" aria-busy={controlsBusy}>
		{#if error}<p class="host-error" role="alert">{error}</p>
			<button type="button" class="button" disabled={controlsBusy} onclick={show}
				>Retry Connection</button
			>{/if}
		{#if !runtime && !error}<p class="loading" role="status">Connecting to your library…</p>{/if}
		{#if runtime}
			{#if desktop}<div class="content-controls" inert={busy}>
					<PackManager
						active={opened}
						{refreshRevision}
						{onbeforemaintenance}
						oncontentchange={contentChanged}
						onbusychange={(value) => (contentBusy = value)}
						oncreate={createPack}
					/>
				</div>{:else}<section class="library-summary">
					<h3>Installed Content</h3>
					<p>
						{runtime.content.references.toLocaleString()} references in {runtime.content.packs}
						{runtime.content.packs === 1 ? 'pack' : 'packs'}.
					</p>
					<p class="helper">Import, create or remove packs in the desktop app.</p>
				</section>{/if}
			<section class="device-section" aria-labelledby="device-title">
				<div class="section-title">
					<h3 id="device-title">Use on Another Device</h3>
					{#if desktop}<label class="sharing-switch"
							><span class="sr-only">Allow devices on the same network</span><input
								type="checkbox"
								role="switch"
								checked={runtime.sharing.enabled}
								disabled={controlsBusy}
								onchange={(event) => setSharing(event.currentTarget.checked)}
							/><span aria-hidden="true"></span></label
						>{/if}
				</div>
				{#if !desktop}<p>
						Manage device access from the Hyper Chamber desktop app.
					</p>{:else if !runtime.sharing.enabled}<p>
						Allow your phone or tablet to use this library on the same network.
					</p>{/if}
				{#if runtime.sharing.enabled}
					<p>
						Connect to the same network, then open an address below. Keep Hyper Chamber running on
						this computer.
					</p>
					{#if runtime.sharing.addresses.length}
						<div class="device-connect">
							{#if qr}<img
									class="connection-qr"
									src={qr}
									width="208"
									height="208"
									alt="QR code for the selected library address"
								/>{/if}
							<div class="address-list">
								<p class="helper">Open in your device’s browser</p>
								{#each runtime.sharing.addresses as address}<label class="address-row"
										><input
											type="radio"
											name="host-address"
											checked={selectedAddress === address}
											onchange={() => (selectedAddress = address)}
										/><a href={address} target="_blank" rel="noreferrer"
											>{address}<ArrowUpRight size={14} aria-hidden="true" /></a
										></label
									>{/each}
							</div>
						</div>
					{:else}<p class="helper">
							No network address is available. Connect this computer to Wi-Fi or Ethernet.
						</p>{/if}
					<p class="helper">
						Anyone on this network with the address can view and edit this library. Device access
						stops when you quit the app.
					</p>
				{/if}
			</section>
			{#if desktop}<section class="recovery-section">
					<details>
						<summary>Notes and Progress Recovery</summary>
						<p class="helper">
							Backups restore your personal entries while keeping installed packs as they are.
						</p>
						<div class="recovery-actions">
							<button
								type="button"
								class="button button--quiet"
								disabled={controlsBusy}
								onclick={backup}><Save size={15} aria-hidden="true" />Back Up Notes</button
							><button
								type="button"
								class="button button--quiet"
								disabled={controlsBusy}
								onclick={showSnapshots}
								><RotateCcw size={15} aria-hidden="true" />Restore Notes…</button
							>
						</div>
						{#if snapshots}{#if snapshots.length}<fieldset
									class="snapshot-list"
									disabled={controlsBusy}
								>
									<legend>Choose a Backup</legend>{#each snapshots as snapshot}<label
											class="snapshot-row"
											><input
												type="radio"
												name="restore-snapshot"
												checked={selectedSnapshot?.file === snapshot.file}
												onchange={() => {
													selectedSnapshot = snapshot;
													restoreConfirmed = false;
												}}
											/><span
												><strong>{date(snapshot.createdAt)}</strong><small
													>{snapshot.migration ? 'Before a library upgrade' : 'Manual backup'} · {size(
														snapshot.bytes,
													)}</small
												></span
											></label
										>{/each}
								</fieldset>{:else}<p class="helper">
									No backups are available yet. Create one with Back Up Notes.
								</p>{/if}{/if}
						{#if selectedSnapshot}<div class="restore-confirmation">
								<p>
									Restore the notes and progress saved on <strong
										>{date(selectedSnapshot.createdAt)}</strong
									>? This replaces newer personal edits. A backup of the current data is saved
									first.
								</p>
								<label
									><input
										type="checkbox"
										bind:checked={restoreConfirmed}
										disabled={controlsBusy}
									/><span>Replace my current notes and progress</span></label
								>
								<div class="recovery-actions">
									<button
										type="button"
										class="button primary-button"
										disabled={controlsBusy || !restoreConfirmed}
										onclick={restore}>Restore Notes and Progress</button
									><button
										type="button"
										class="button button--quiet"
										disabled={controlsBusy}
										onclick={() => {
											selectedSnapshot = null;
											restoreConfirmed = false;
										}}>Cancel</button
									>
								</div>
							</div>{/if}
					</details>
				</section>
				<section class="storage-section" aria-labelledby="storage-title">
					<h3 id="storage-title">Library Folder</h3>
					<p class="library-path">{libraryDir}</p>
					<p class="helper">
						This folder contains your database and installed content. Quit the app before moving it.
					</p>
					<div class="storage-actions">
						<button
							type="button"
							class="button button--quiet"
							disabled={controlsBusy}
							onclick={revealLibrary}>Show Folder</button
						><button
							type="button"
							class="button button--quiet"
							disabled={controlsBusy}
							onclick={chooseLibrary}>Choose Library Folder</button
						>
					</div>
				</section>{/if}
		{/if}
		{#if maintenanceStatus}<p class="maintenance-status" role="status">{maintenanceStatus}</p>{/if}
		{#if message}<p class="host-message" role="status">{message}</p>{/if}
	</div>
</dialog>

<style>
	.host-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.host-dialog {
		width: min(720px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 24px 80px #18231e40;
	}
	.host-dialog[open] {
		display: flex;
		flex-direction: column;
	}
	.host-dialog::backdrop {
		background: #18231e80;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 24px 24px 20px;
		border-bottom: 1px solid var(--line);
		flex: none;
	}
	h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
	}
	.host-body {
		padding: 24px;
		min-block-size: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}
	.content-controls[inert] {
		opacity: 0.6;
	}
	section + section,
	.content-controls + section {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid var(--line);
	}
	.section-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	h3 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}
	p {
		margin: 10px 0 0;
		font-size: 13px;
		line-height: 1.6;
	}
	.helper {
		color: var(--muted);
		font-size: 12px;
	}
	.sharing-switch {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		cursor: pointer;
	}
	.sharing-switch input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.sharing-switch > span:last-child {
		width: 36px;
		height: 22px;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 14px;
		background: var(--soft);
		pointer-events: none;
	}
	.sharing-switch > span:last-child::after {
		content: '';
		display: block;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--muted);
	}
	.sharing-switch input:checked + span {
		background: var(--accent);
		border-color: var(--accent);
	}
	.sharing-switch input:checked + span::after {
		margin-left: auto;
		background: var(--on-accent);
	}
	.sharing-switch input:focus-visible + span {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}
	.sharing-switch input:disabled + span {
		opacity: 0.5;
	}
	.device-connect {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-top: 18px;
	}
	.connection-qr {
		flex: none;
		width: 160px;
		height: 160px;
		border: 1px solid var(--line);
		border-radius: 4px;
	}
	.address-list {
		min-width: 0;
	}
	.address-list .helper {
		margin: 0 0 6px;
	}
	.address-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		font-size: 13px;
	}
	.address-row input {
		accent-color: var(--accent);
	}
	.address-row a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		overflow-wrap: anywhere;
	}
	.library-path {
		overflow-wrap: anywhere;
		user-select: all;
		font-size: 12px;
	}
	.storage-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
	}
	.storage-section .button {
		margin-top: 12px;
		padding-inline-start: 0;
	}
	.maintenance-status {
		color: var(--muted);
		font-size: 12px;
		margin-block-start: 16px;
	}
	.host-error,
	.host-message {
		padding: 12px;
		border-radius: 4px;
		background: var(--selected);
		overflow-wrap: anywhere;
	}
	.host-error + .button {
		margin-top: 10px;
	}
	.recovery-section summary {
		cursor: pointer;
		min-block-size: 44px;
		padding-block: 10px;
		font-size: 14px;
		font-weight: 600;
	}
	.recovery-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-block-start: 10px;
	}
	.snapshot-list {
		border: 0;
		padding: 0;
		margin: 18px 0 0;
		max-block-size: 18rem;
		overflow: auto;
	}
	.snapshot-list legend {
		font-size: 13px;
		font-weight: 600;
		margin-block-end: 8px;
	}
	.snapshot-row {
		display: flex;
		align-items: center;
		gap: 12px;
		min-block-size: 54px;
		padding-block: 10px;
		border-block-end: 1px solid var(--line);
		cursor: pointer;
	}
	.snapshot-row input {
		flex: none;
		margin: 0;
		accent-color: var(--ink);
		inline-size: 18px;
		block-size: 18px;
	}
	.snapshot-row strong {
		font-size: 12px;
		font-weight: 500;
	}
	.snapshot-row small {
		display: block;
		color: var(--muted);
		font-size: 11px;
		margin-block-start: 3px;
	}
	.restore-confirmation {
		margin-block-start: 16px;
		padding: 16px;
		background: var(--soft);
		border-radius: 4px;
	}
	.restore-confirmation > p {
		margin-block-start: 0;
	}
	.restore-confirmation > label {
		display: flex;
		align-items: start;
		gap: 10px;
		min-block-size: 44px;
		padding-block: 12px;
		font-size: 13px;
		line-height: 1.5;
		cursor: pointer;
	}
	.restore-confirmation > label input {
		inline-size: 18px;
		block-size: 18px;
		margin: 2px 0 0;
		flex: none;
		accent-color: var(--ink);
	}
	@media (max-width: 520px) {
		header,
		.host-body {
			padding: 20px;
		}
		.device-connect {
			align-items: flex-start;
			flex-direction: column;
			gap: 12px;
		}
		.connection-qr {
			width: 176px;
			height: 176px;
		}
	}
	@media (forced-colors: active) {
		.host-dialog,
		.sharing-switch > span:last-child {
			border: 1px solid CanvasText;
		}
		.sharing-switch input:checked + span {
			background: Highlight;
		}
	}
</style>
