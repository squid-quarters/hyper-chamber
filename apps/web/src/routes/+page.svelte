<script lang="ts">
	import { onMount } from 'svelte';
	import { pushState, replaceState } from '$app/navigation';
	import { references } from '#lib/catalog';
	import {
		filterReferences,
		sourceLink,
		type Reference,
		type PersonalLibrary,
		type PersonalEntry,
		type PracticeStatus,
	} from '@hyper-chamber/reference';
	import { loadLibrary, saveLibrary, parseBackup, createBackup, blankEntry } from '#lib/personal';
	import ReferenceMedia from '#lib/components/ReferenceMedia.svelte';
	let query = $state('');
	let kind = $state('all');
	let situation = $state('all');
	let savedOnly = $state(false);
	let selectedId = $state(references[0]?.id ?? '');
	let focused = $state(false);
	let library = $state<PersonalLibrary>({});
	let storageError = $state<string | null>(null);
	let message = $state('');
	let help: HTMLDialogElement;
	let backup: HTMLDialogElement;
	let importInput: HTMLInputElement;
	let ready = $state(false);
	const situations = [...new Set(references.flatMap((r) => r.situations))].sort();
	let selected = $derived(references.find((r) => r.id === selectedId));
	let personal = $derived(selected ? (library[selected.id] ?? blankEntry(selected)) : null);
	let savedIds = $derived(
		new Set(
			Object.entries(library)
				.filter(([, entry]) => entry.saved)
				.map(([id]) => id),
		),
	);
	let results = $derived(
		filterReferences(references, {
			query,
			kind,
			situation,
			savedIds: savedOnly ? savedIds : undefined,
		}),
	);
	function readUrl() {
		const p = new URLSearchParams(location.search);
		query = p.get('q') ?? '';
		kind = ['combo', 'setup', 'response'].includes(p.get('kind') ?? '') ? p.get('kind')! : 'all';
		situation = situations.includes(p.get('situation') ?? '') ? p.get('situation')! : 'all';
		savedOnly = p.get('saved') === '1';
		const id = p.get('entry');
		selectedId = id && references.some((r) => r.id === id) ? id : (references[0]?.id ?? '');
		if (id && !references.some((r) => r.id === id))
			message = 'That reference was not found. Showing the first available entry.';
	}
	function updateUrl(push = false) {
		if (!ready) return;
		const u = new URL(location.href);
		for (const key of ['q', 'kind', 'situation', 'saved', 'entry']) u.searchParams.delete(key);
		if (query) u.searchParams.set('q', query);
		if (kind !== 'all') u.searchParams.set('kind', kind);
		if (situation !== 'all') u.searchParams.set('situation', situation);
		if (savedOnly) u.searchParams.set('saved', '1');
		if (selectedId) u.searchParams.set('entry', selectedId);
		const navigation = push ? pushState(u, {}) : replaceState(u, {});
		navigation.catch(() => {
			message = 'The reference is open, but its URL could not be updated.';
		});
	}
	function selectEntry(ref: Reference) {
		selectedId = ref.id;
		updateUrl(true);
	}
	function reset() {
		query = '';
		kind = 'all';
		situation = 'all';
		savedOnly = false;
		updateUrl();
	}
	function updatePersonal(patch: Partial<PersonalEntry>) {
		if (!selected || !ready) return;
		library = {
			...library,
			[selected.id]: { ...blankEntry(selected), ...library[selected.id], ...patch },
		};
		storageError = saveLibrary(library);
	}
	function exportData() {
		const url = URL.createObjectURL(
			new Blob([createBackup(library)], { type: 'application/json' }),
		);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'hyper-chamber-library.json';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		message = 'Library backup exported.';
	}
	async function importData(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const imported = parseBackup(await file.text());
			library = { ...library, ...imported };
			storageError = saveLibrary(library);
			message = 'Backup imported. Matching entries were updated.';
		} catch (e) {
			message = e instanceof Error ? e.message : 'This backup could not be imported.';
		}
		input.value = '';
	}
	const time = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
	onMount(() => {
		const loaded = loadLibrary();
		library = loaded.library;
		storageError = loaded.error;
		readUrl();
		ready = true;
		window.addEventListener('popstate', readUrl);
		return () => window.removeEventListener('popstate', readUrl);
	});
</script>

<svelte:head
	><title>Hyper Chamber — Dhalsim reference</title><meta
		name="description"
		content="A compact Dhalsim reference for Street Fighter 6. Replay source clips, inspect key moments and keep your own practice notes."
	/></svelte:head
>
<a class="skip-link" href="#reference">Skip to selected reference</a>
<div class="app-shell" class:focus-mode={focused}>
	<header class="masthead">
		<a class="brand" href="/" aria-label="Hyper Chamber home"
			><span class="brand-symbol" aria-hidden="true">H<span>↗</span></span><span
				>HYPER<br />CHAMBER</span
			></a
		>
		<div class="masthead-description">
			A fighting game reference.<br /><span>Less searching. More playing.</span>
		</div>
		<nav class="header-actions" aria-label="Utilities">
			<button onclick={() => help.showModal()}>Notation <span aria-hidden="true">?</span></button
			><button onclick={() => backup.showModal()}
				>Your library <span aria-hidden="true">↗</span></button
			><a
				class="guide-link"
				href="https://sf6-lab.net/en/fighters/dhalsim"
				target="_blank"
				rel="noreferrer">Guides on SF6 Lab ↗</a
			>
		</nav>
	</header>
	<main>
		<section class="character-band" aria-label="Current character">
			<div class="character-name">
				<span class="eyebrow">STREET FIGHTER 6 / CHARACTER FILE 01</span>
				<h1>DHALSIM<span class="title-dot">.</span></h1>
			</div>
			<p>A reference within reach.<br /><span>Combos, setups and the moments between.</span></p>
			<span class="character-seal" aria-hidden="true">ध्यान</span>
		</section>
		{#if storageError}<p class="global-notice" role="alert">
				{storageError} Your changes are available in this session; export a backup to keep them.
			</p>{/if}
		<p class="sr-only" role="status">{message}</p>
		<div class="workspace">
			<aside class="browser" aria-label="Reference browser">
				<div class="browser-heading">
					<h2>Compendium</h2>
					<span>{references.length.toString().padStart(2, '0')}</span>
				</div>
				<label class="search"
					><span aria-hidden="true">⌕</span><span class="sr-only">Search references</span><input
						type="search"
						placeholder="Find an input, situation…"
						bind:value={query}
						oninput={(e) => {
							query = e.currentTarget.value;
							updateUrl();
						}}
					/></label
				>
				<div class="collection-switch">
					<button
						class:current={!savedOnly}
						aria-pressed={!savedOnly}
						onclick={() => {
							savedOnly = false;
							updateUrl();
						}}>All references</button
					><button
						class:current={savedOnly}
						aria-pressed={savedOnly}
						onclick={() => {
							savedOnly = true;
							updateUrl();
						}}>Saved <span>{savedIds.size}</span></button
					>
				</div>
				<div class="filters">
					<label
						>Type<select
							bind:value={kind}
							onchange={(e) => {
								kind = e.currentTarget.value;
								updateUrl();
							}}
							><option value="all">All types</option><option value="combo">Combo</option><option
								value="setup">Setup</option
							><option value="response">Response</option></select
						></label
					><label
						>Situation<select
							bind:value={situation}
							onchange={(e) => {
								situation = e.currentTarget.value;
								updateUrl();
							}}
							><option value="all">Anywhere</option>{#each situations as s}<option value={s}
									>{s}</option
								>{/each}</select
						></label
					>
				</div>
				<div class="results-meta">
					<span>{results.length} {results.length === 1 ? 'reference' : 'references'}</span
					>{#if query || kind !== 'all' || situation !== 'all' || savedOnly}<button onclick={reset}
							>Reset filters</button
						>{/if}
				</div>
				<ul class="reference-list">
					{#each results as ref}<li>
							<button
								class="reference-card"
								class:selected={selectedId === ref.id}
								aria-current={selectedId === ref.id ? 'true' : undefined}
								onclick={() => selectEntry(ref)}
								><div class="card-top">
									<span class="kind-label">{ref.kind}</span><span
										>{library[ref.id]?.saved ? '★' : '↗'}</span
									>
								</div>
								<h3>{ref.title}</h3>
								<p>{ref.situations.join(' · ')}</p>
								<div class="card-bottom">
									<code>{ref.notation}</code><span aria-hidden="true">→</span>
								</div></button
							>
						</li>{/each}
				</ul>
				{#if results.length === 0}<div class="empty">
						<h3>{savedOnly ? 'Nothing saved here yet.' : 'No matching references.'}</h3>
						<p>
							{savedOnly
								? 'Save a reference with the star to keep it close.'
								: 'Try a shorter input or another situation.'}
						</p>
						<button class="button" onclick={reset}>Show all references</button>
					</div>{/if}
				<div class="browser-foot">
					<span class="tiny-mark" aria-hidden="true">HC</span>
					<p>Built for the space<br />beside your game.</p>
				</div>
			</aside>
			<article class="reference-detail" aria-label="Selected reference">
				{#if selected && personal}
					<div class="detail-toolbar">
						<span class="eyebrow">DHALSIM / {selected.kind.toUpperCase()}</span><button
							class="text-button"
							aria-pressed={focused}
							onclick={() => (focused = !focused)}
							>{focused ? '↙ Exit focus' : '↗ Focus view'}</button
						>
					</div>
					<div class="detail-heading">
						<div>
							<h2 id="reference" tabindex="-1">{selected.title}</h2>
							<p>{selected.summary}</p>
						</div>
						<button
							class="save-button"
							class:saved={personal.saved}
							aria-pressed={personal.saved}
							aria-label={personal.saved ? 'Unsave reference' : 'Save reference'}
							onclick={() => updatePersonal({ saved: !personal?.saved })}
							>{personal.saved ? '★' : '☆'}</button
						>
					</div>
					<div class="tags">
						{#each selected.situations as tag}<span>{tag}</span
							>{/each}{#each selected.outcomes as tag}<span class="outcome">{tag}</span>{/each}
					</div>
					{#if !results.some((r) => r.id === selected?.id)}<p class="notice">
							This reference is outside your current filters. <button onclick={reset}
								>Clear filters</button
							>
						</p>{/if}
					<div class="practice-stage">
						<div class="practice-inputs">
							<section class="notation-panel" aria-label="Input sequence">
								<div class="section-heading">
									<h3>Input sequence</h3>
									<button onclick={() => help.showModal()}>Notation key ↗</button>
								</div>
								<p class="notation-line">{selected.notation}</p>
								<ol class="input-steps">
									{#each selected.inputs as input, i}<li>
											<span class="step-index">{String(i + 1).padStart(2, '0')}</span>
											<div>
												<code>{input.notation}</code><span>{input.label}</span>{#if input.cue}<small
														>{input.cue}</small
													>{/if}
											</div>
										</li>{/each}
								</ol>
							</section>
							<div class="condition-row">
								<span class="eyebrow">SET THE SCENE</span>
								<p>{selected.conditions.join(' · ')}</p>
							</div>
						</div>
						{#key selected.id}<ReferenceMedia reference={selected} />{/key}
					</div>
					<div class="detail-bottom">
						<section class="reference-notes">
							<div class="section-heading">
								<h3>Keep in mind</h3>
								<span aria-hidden="true">↳</span>
							</div>
							<ul>
								{#each selected.notes as note}<li>{note}</li>{/each}
							</ul>
							<div class="resource-line">
								<span>Drive <strong>{selected.resources.drive}</strong></span><span
									>Super <strong>{selected.resources.super}</strong></span
								>
							</div>
						</section>
						<section class="personal-panel">
							<div class="section-heading">
								<h3>Your quick notes</h3>
								<span class="eyebrow">LOCAL ONLY</span>
							</div>
							{#if personal.revision !== selected.revision}<p class="revision-hint">
									This reference has been updated since your saved notes. Recheck the source; your
									practice status is unchanged.
								</p>{/if}<label class="status-label"
								>Practice status<select
									value={personal.status}
									onchange={(e) =>
										updatePersonal({ status: e.currentTarget.value as PracticeStatus })}
									><option value="untried">Untried</option><option value="practising"
										>Practising</option
									><option value="reliable">Reliable</option></select
								></label
							><label class="sr-only" for="personal-note">Personal note</label><textarea
								id="personal-note"
								placeholder="A timing cue. A reminder. Make it yours."
								value={personal.note}
								oninput={(e) => updatePersonal({ note: e.currentTarget.value })}
								maxlength="4000"
								rows="3"></textarea>
							<p class="local-hint">
								{storageError
									? 'Not saved to this browser.'
									: ready
										? 'Saved on this browser as you type.'
										: 'Loading your library…'}
							</p>
						</section>
					</div>
					<footer class="source-footer">
						<div>
							<span class="eyebrow">FROM THE SOURCE</span><a
								href={sourceLink(selected)}
								target="_blank"
								rel="noreferrer">{selected.source.title} ↗</a
							>
							<p>
								{selected.source.creator} · {time(selected.source.start)}–{time(
									selected.source.end,
								)}
							</p>
						</div>
						<details>
							<summary
								>{selected.verification.status === 'source-reviewed'
									? 'Source reviewed'
									: 'Review pending'}</summary
							>
							<p>{selected.verification.note}</p>
							<p>Game version: {selected.verification.gameVersion ?? 'not established'}.</p>
						</details>
					</footer>
					{#if selected.relatedIds.length}<section class="related">
							<h3>Also in the chamber</h3>
							<div>
								{#each references.filter((r) => selected?.relatedIds.includes(r.id)) as ref}<button
										onclick={() => selectEntry(ref)}
										>{ref.title}<span aria-hidden="true">↗</span></button
									>{/each}
							</div>
						</section>{/if}
				{:else}<div class="empty">
						<h2 id="reference">No references available</h2>
						<p>The compendium will appear here when reviewed entries are available.</p>
					</div>{/if}
			</article>
		</div>
	</main>
	<footer class="site-footer">
		<span>HYPER CHAMBER</span>
		<p>Independent reference. Street Fighter is a trademark of Capcom.</p>
		<span>Keep it within reach.</span>
	</footer>
</div>
<dialog bind:this={help} aria-labelledby="notation-title">
	<div class="dialog-heading">
		<h2 id="notation-title">Read the notation</h2>
		<button class="button small" onclick={() => help.close()}>Close ×</button>
	</div>
	<p>Directions assume your character faces right. Mirror them when facing left.</p>
	<div class="notation-help">
		<div
			class="numpad"
			aria-label="Direction notation: 7 up back, 8 up, 9 up forward, 4 back, 5 neutral, 6 forward, 1 down back, 2 down, 3 down forward"
		>
			{#each ['7 ↖', '8 ↑', '9 ↗', '4 ←', '5 ·', '6 →', '1 ↙', '2 ↓', '3 ↘'] as key}<span
					>{key}</span
				>{/each}
		</div>
		<dl>
			<dt>LP / MP / HP</dt>
			<dd>Light / medium / heavy punch</dd>
			<dt>LK / MK / HK</dt>
			<dd>Light / medium / heavy kick</dd>
			<dt>j. / cr. / st. / b.</dt>
			<dd>Jumping / crouching / standing / back</dd>
			<dt>DR / DRC / DI / OD / SA / CH</dt>
			<dd>Drive Rush / cancel Drive Rush / Drive Impact / Overdrive / Super Art / Counter Hit</dd>
			<dt>xx / > / →</dt>
			<dd>Cancel / next action</dd>
		</dl>
	</div>
	<p class="muted">
		Use each entry’s execution cues alongside the notation. Timing is shown in the source clip.
	</p>
</dialog>
<dialog bind:this={backup} aria-labelledby="library-title">
	<div class="dialog-heading">
		<h2 id="library-title">Your library</h2>
		<button class="button small" onclick={() => backup.close()}>Close ×</button>
	</div>
	<p>
		Favorites, practice status and notes stay in this browser. Export a backup to keep a copy or
		move to another device.
	</p>
	<div class="backup-actions">
		<button class="button" onclick={exportData}>Export backup ↓</button><button
			class="button"
			onclick={() => importInput.click()}>Import backup ↑</button
		><input
			class="sr-only"
			type="file"
			accept="application/json,.json"
			bind:this={importInput}
			onchange={importData}
		/>
	</div>
	<p class="muted">
		Import merges your backup into this library. Matching entries use the imported notes and status.
	</p>
	{#if message}<p class="notice" role="status">{message}</p>{/if}
</dialog>
