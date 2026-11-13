<script lang="ts">
	import { onMount } from 'svelte';
	import { MonitorSmartphone, X, ArrowUpRight, FolderInput } from '@lucide/svelte';
	import type { LibraryRuntime } from '@hyper-chamber/reference';
	import QRCode from 'qrcode';

	let {
		oncontentchange,
		onbeforemaintenance,
	}: { oncontentchange: () => Promise<void>; onbeforemaintenance?: () => Promise<void> } = $props();
	let dialog: HTMLDialogElement;
	let runtime = $state<LibraryRuntime | null>(null);
	let desktop = $state(false);
	let libraryDir = $state('');
	let busy = $state(false);
	let error = $state('');
	let message = $state('');
	let qr = $state('');
	let selectedAddress = $state('');
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
	}
	async function show() {
		error = '';
		message = '';
		dialog.showModal();
		busy = true;
		try {
			await refresh();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : String(reason);
		} finally {
			busy = false;
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
		}
	}
	async function importPack() {
		busy = true;
		error = '';
		message = '';
		try {
			const result = await invoke<{ cancelled?: boolean }>('import_content_pack');
			if (!result.cancelled) {
				await refresh();
				await oncontentchange();
			}
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
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
		error = '';
		message = '';
		try {
			await onbeforemaintenance?.();
			const result = await invoke<{ file: string }>('create_backup');
			message = `Library backup created: ${result.file}`;
		} catch (reason) {
			error = String(reason);
		} finally {
			busy = false;
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
	class="host-trigger"
	aria-label="Library and devices"
	title="Library and devices"
	onclick={show}
>
	<MonitorSmartphone size={18} aria-hidden="true" /><span class="utility-label">Devices</span>
</button>
<dialog class="host-dialog" bind:this={dialog} aria-labelledby="host-title">
	<header>
		<div>
			<p class="eyebrow">Hyper Chamber</p>
			<h2 id="host-title">Library &amp; devices</h2>
		</div>
		<button
			class="icon-button"
			onclick={() => dialog.close()}
			aria-label="Close library and devices"><X size={20} aria-hidden="true" /></button
		>
	</header>
	<div class="host-body" aria-busy={busy}>
		{#if error}<p class="host-error" role="alert">{error}</p>
			<button class="button" disabled={busy} onclick={show}>Retry connection</button>{/if}
		{#if !runtime && !error}<p class="loading" role="status">Connecting to your library…</p>{/if}
		{#if runtime}
			<section class="library-summary" aria-labelledby="installed-title">
				<div class="section-title">
					<h3 id="installed-title">Installed content</h3>
					<span>{runtime.content.references.toLocaleString()} references</span>
				</div>
				<p>
					{runtime.content.packs}
					{runtime.content.packs === 1 ? 'content pack' : 'content packs'}. Your notes and progress
					are stored separately.
				</p>
				{#if desktop}<button class="button import-button" disabled={busy} onclick={importPack}
						><FolderInput size={16} aria-hidden="true" />Import content pack</button
					>
					<p class="helper">Choose a .hcpack file to add or update a collection.</p>{/if}
			</section>
			<section class="device-section" aria-labelledby="device-title">
				<div class="section-title">
					<h3 id="device-title">Use on another device</h3>
					{#if desktop}<label class="sharing-switch"
							><span class="sr-only">Allow devices on the same network</span><input
								type="checkbox"
								role="switch"
								checked={runtime.sharing.enabled}
								disabled={busy}
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
			{#if desktop}<section class="storage-section" aria-labelledby="storage-title">
					<h3 id="storage-title">Library folder</h3>
					<p class="library-path">{libraryDir}</p>
					<p class="helper">
						This folder contains your database and installed content. Quit the app before moving it.
					</p>
					<div class="storage-actions">
						<button class="button button--quiet" disabled={busy} onclick={revealLibrary}
							>Show folder</button
						><button class="button button--quiet" disabled={busy} onclick={chooseLibrary}
							>Choose library folder</button
						><button class="button button--quiet" disabled={busy} onclick={backup}
							>Create database backup</button
						>
					</div>
				</section>{/if}
		{/if}
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
		width: min(620px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 24px 80px #18231e40;
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
	}
	.eyebrow {
		margin: 0 0 4px;
		color: var(--muted);
		font-size: 11px;
	}
	h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
	}
	.host-body {
		padding: 24px;
	}
	section + section {
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
	.section-title > span {
		color: var(--muted);
		font-size: 12px;
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
	.import-button {
		margin-top: 16px;
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
		.section-title > span {
			text-align: end;
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
