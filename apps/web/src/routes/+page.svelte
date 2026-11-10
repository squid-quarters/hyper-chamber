<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { collections } from '#lib/catalog';
	import {
		filterReferences,
		sourceLink,
		type Reference,
		type PersonalLibrary,
		type PersonalEntry,
		type PracticeStatus,
	} from '@hyper-chamber/reference';
	import {
		loadLibrary,
		persistChanges,
		mergePending,
		parseBackup,
		createBackup,
		blankEntry,
		STORAGE_KEY,
		type LibraryPatches,
	} from '#lib/personal';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import ReferenceMedia from '#lib/components/ReferenceMedia.svelte';
	import InputSequence from '#lib/components/InputSequence.svelte';
	import {
		readLibraryReturn,
		readCharacterLocation,
		referenceLocation,
		type LibraryReturn,
	} from '../lib/navigation';

	let characterId = $state(collections[0].id);
	let collection = $derived(collections.find((item) => item.id === characterId) ?? collections[0]);
	let references = $derived(collection.references);
	let game = $derived(collection.game);
	let subjectName = $derived(collection.name);
	let query = $state('');
	let kind = $state('all');
	let situation = $state('all');
	let savedOnly = $state(false);
	let practice = $state('all');
	let selectedId = $state('');
	let practising = $state(false);
	let library = $state<PersonalLibrary>({});
	let pendingChanges = $state<LibraryPatches>({});
	let storageError = $state<string | null>(null);
	let message = $state('');
	let help: HTMLDialogElement;
	let backup: HTMLDialogElement;
	let importInput: HTMLInputElement;
	let switcher: HTMLDialogElement;
	let switchSearch: HTMLInputElement;
	let ready = $state(false);
	let switchQuery = $state('');
	let switchScope = $state<'results' | 'saved' | 'all'>('results');
	let libraryReturn: LibraryReturn = { key: '', scrollY: 0, entryId: null };
	const libraryReturns = new Map<string, LibraryReturn>();
	let libraryFilterKey = '';
	let switchOrigin: string | null = null;
	let pendingHistory = false;
	let viewRevision = 0;
	let referenceIds = $derived(collection.referenceIds);
	let situations = $derived(collection.situations);
	let selected = $derived(references.find((r) => r.id === selectedId));
	let personal = $derived(selected ? (library[selected.id] ?? blankEntry(selected)) : null);
	let savedIds = $derived(
		new Set(
			Object.entries(library)
				.filter(([id, entry]) => entry.saved && referenceIds.has(id))
				.map(([id]) => id),
		),
	);
	let results = $derived(
		filterReferences(references, {
			query,
			kind,
			situation,
			savedIds: savedOnly ? savedIds : undefined,
		}).filter((ref) => practice === 'all' || (library[ref.id]?.status ?? 'untried') === practice),
	);
	let selectedIndex = $derived(results.findIndex((ref) => ref.id === selectedId));
	let previousReference = $derived(selectedIndex > 0 ? results[selectedIndex - 1] : undefined);
	let nextReference = $derived(selectedIndex >= 0 ? results[selectedIndex + 1] : undefined);
	let switchSet = $derived(
		switchScope === 'all'
			? references
			: switchScope === 'saved'
				? references.filter((ref) => savedIds.has(ref.id))
				: results,
	);
	let switchResults = $derived(filterReferences(switchSet, { query: switchQuery }));

	function currentFilters() {
		return { query, kind, situation, savedOnly, practice, characterId };
	}
	function entryHref(id: string) {
		return referenceLocation('https://hyper-chamber.invalid/', currentFilters(), id).search;
	}
	function readUrl() {
		const next = readCharacterLocation(location.search, collections);
		characterId = next.characterId;
		query = next.query;
		kind = next.kind;
		situation = next.situation;
		savedOnly = next.savedOnly;
		practice = next.practice;
		practising = next.entryId !== null;
		selectedId = next.entryId ?? references[0]?.id ?? '';
		if (next.invalidCharacter)
			message = `That character library was not found. Showing ${subjectName}.`;
		else if (next.invalidEntry)
			message = 'That reference was not found. Choose another from the library.';
		else if (
			message === 'That reference was not found. Choose another from the library.' ||
			message.startsWith('That character library was not found.')
		)
			message = '';
	}
	async function changeCharacter(id: string) {
		if (!ready || !collections.some((item) => item.id === id)) return;
		const revision = ++viewRevision;
		// A quick return to the current character must cancel a pending switch.
		if (id === characterId) return;
		if (!practising) {
			captureLibrary(null);
			await updateUrl();
			if (revision !== viewRevision) return;
		}
		document.querySelector<HTMLVideoElement>('.practice-view video')?.pause();
		for (const dialog of [switcher, help, backup]) if (dialog?.open) dialog.close();
		characterId = id;
		query = '';
		kind = 'all';
		situation = 'all';
		savedOnly = false;
		practice = 'all';
		selectedId = references[0]?.id ?? '';
		practising = false;
		libraryReturn = { key: '', scrollY: 0, entryId: null };
		libraryFilterKey = JSON.stringify(currentFilters());
		message = '';
		await updateUrl(true);
		await tick();
		if (revision !== viewRevision) return;
		window.scrollTo({ top: 0, behavior: 'instant' });
		document.getElementById('library-title')?.focus({ preventScroll: true });
	}
	async function updateUrl(push = false) {
		if (!ready) return;
		const url = referenceLocation(location.href, currentFilters(), practising ? selectedId : null);
		try {
			if (!practising && libraryFilterKey !== JSON.stringify(currentFilters()))
				captureLibrary(null);
			await goto(url, {
				shallow: true,
				replace: !push,
				reset: false,
				state: { ...page.state, libraryReturn },
			});
		} catch {
			message = 'Your view is open, but its URL could not be updated.';
		}
	}
	function captureLibrary(origin: string | null) {
		libraryReturn = { key: crypto.randomUUID(), scrollY: window.scrollY, entryId: origin };
		libraryReturns.set(libraryReturn.key, libraryReturn);
		libraryFilterKey = JSON.stringify(currentFilters());
	}
	async function focusPractice(revision: number) {
		await tick();
		if (revision !== viewRevision || !practising) return;
		window.scrollTo({ top: 0, behavior: 'instant' });
		document.getElementById('reference')?.focus({ preventScroll: true });
	}
	async function restoreLibrary(revision: number) {
		await tick();
		if (revision !== viewRevision || practising) return;
		const origin = [
			...document.querySelectorAll<HTMLAnchorElement>('.reference-card[data-entry-id]'),
		].find((tile) => tile.dataset.entryId === libraryReturn.entryId);
		(origin ?? document.getElementById('library-search'))?.focus({ preventScroll: true });
		window.scrollTo({ top: libraryReturn.scrollY, behavior: 'instant' });
	}
	async function selectEntry(ref: Reference, fromTile = false) {
		const revision = ++viewRevision;
		if (!practising) {
			captureLibrary(fromTile ? ref.id : switchOrigin);
			// Stamp this library history entry before pushing practice. Each visit
			// gets its own bookmark, even when two visits use identical filters.
			await updateUrl();
			if (revision !== viewRevision) return;
		}
		selectedId = ref.id;
		practising = true;
		if (switcher?.open) switcher.close();
		await updateUrl(true);
		await focusPractice(revision);
	}
	async function returnToLibrary() {
		const revision = ++viewRevision;
		practising = false;
		if (switcher?.open) switcher.close();
		await updateUrl(true);
		await restoreLibrary(revision);
	}
	function restoreFromHistory() {
		if (!practising && libraryReturn.key) {
			libraryReturns.set(libraryReturn.key, { ...libraryReturn, scrollY: window.scrollY });
		}
		viewRevision++;
		pendingHistory = true;
		for (const dialog of [switcher, help, backup]) if (dialog?.open) dialog.close();
	}
	function finishHashNavigation(event: HashChangeEvent) {
		const from = new URL(event.oldURL);
		const to = new URL(event.newURL);
		// Native fragment navigation emits popstate too. Let the browser keep
		// its anchor focus/scroll without leaving a pending reference traversal.
		if (from.pathname === to.pathname && from.search === to.search) pendingHistory = false;
	}
	$effect(() => {
		const url = page.shallow?.url ?? page.url;
		const bookmark = page.state.libraryReturn;
		if (!ready) return;
		untrack(() => {
			// Kit restores its state asynchronously after popstate. Wait for the
			// matching public URL/state before restoring our view and focus.
			if (!pendingHistory || url.href !== location.href) return;
			pendingHistory = false;
			readUrl();
			const restored = readLibraryReturn(bookmark, referenceIds);
			libraryReturn = restored
				? (libraryReturns.get(restored.key) ?? restored)
				: { key: '', scrollY: 0, entryId: null };
			libraryFilterKey = JSON.stringify(currentFilters());
			const revision = ++viewRevision;
			if (practising) void focusPractice(revision);
			else void restoreLibrary(revision);
		});
	});
	function reset() {
		query = '';
		kind = 'all';
		situation = 'all';
		savedOnly = false;
		practice = 'all';
		void updateUrl();
	}
	async function openSwitcher() {
		if (!ready || document.querySelector('dialog[open]')) return;
		switchOrigin =
			document.activeElement instanceof Element
				? (document.activeElement.closest<HTMLAnchorElement>('.reference-card')?.dataset.entryId ??
					null)
				: null;
		document.querySelector<HTMLVideoElement>('.practice-view video')?.pause();
		switchQuery = '';
		switchScope = results.length ? 'results' : 'all';
		switcher.showModal();
		await tick();
		switchSearch.focus();
	}
	function switcherKeys(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'Enter' && event.target === switchSearch && switchResults[0]) {
			event.preventDefault();
			void selectEntry(switchResults[0]);
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		if (event.target === switchSearch && ['Home', 'End'].includes(event.key)) return;
		const buttons = [...switcher.querySelectorAll<HTMLButtonElement>('.switch-result')];
		if (!buttons.length) return;
		event.preventDefault();
		const index = buttons.findIndex((button) => button === document.activeElement);
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? buttons.length - 1
					: event.key === 'ArrowDown'
						? Math.min(index + 1, buttons.length - 1)
						: index < 0
							? buttons.length - 1
							: Math.max(0, index - 1);
		buttons[next]?.focus();
	}
	function shortcuts(event: KeyboardEvent) {
		if (event.defaultPrevented || event.repeat) return;
		if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
			if (document.querySelector('dialog[open]')) return;
			event.preventDefault();
			void openSwitcher();
			return;
		}
		if (
			event.key !== 'Escape' ||
			!practising ||
			document.querySelector('dialog[open]') ||
			document.fullscreenElement
		)
			return;
		if (
			event.target instanceof Element &&
			event.target.closest('input, textarea, select, [contenteditable]')
		)
			return;
		event.preventDefault();
		void returnToLibrary();
	}
	function updatePersonal(patch: Partial<PersonalEntry>) {
		if (!selected || !ready) return;
		if (patch.status !== undefined) patch = { ...patch, revision: selected.revision };
		library = {
			...library,
			[selected.id]: { ...blankEntry(selected), ...library[selected.id], ...patch },
		};
		pendingChanges = {
			...pendingChanges,
			[selected.id]: { ...pendingChanges[selected.id], ...patch },
		};
		persistPending();
	}
	function persistPending() {
		const result = persistChanges(library, pendingChanges);
		library = result.library;
		pendingChanges = result.pending;
		storageError = result.error;
	}
	function syncFromStorage(event: StorageEvent) {
		if (event.key !== STORAGE_KEY && event.key !== null) return;
		const loaded = loadLibrary();
		if (loaded.error) {
			storageError = loaded.error;
			return;
		}
		library = mergePending(loaded.library, library, pendingChanges);
		if (Object.keys(pendingChanges).length === 0) storageError = null;
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
			pendingChanges = { ...pendingChanges, ...imported };
			persistPending();
			message = storageError
				? 'Backup loaded for this session. Browser storage could not save it.'
				: 'Backup imported. Matching entries were updated.';
		} catch (e) {
			message = e instanceof Error ? e.message : 'This backup could not be imported.';
		}
		input.value = '';
	}

	const time = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
	afterNavigate((navigation) => {
		if (
			!ready ||
			navigation.shallow ||
			navigation.type === 'enter' ||
			navigation.type === 'popstate'
		)
			return;
		const revision = ++viewRevision;
		readUrl();
		if (practising) void focusPractice(revision);
		else {
			libraryReturn = { key: '', scrollY: 0, entryId: null };
			libraryFilterKey = JSON.stringify(currentFilters());
			void restoreLibrary(revision);
		}
	});
	onMount(() => {
		const loaded = loadLibrary();
		library = loaded.library;
		storageError = loaded.error;
		readUrl();
		libraryReturn = readLibraryReturn(page.state.libraryReturn, referenceIds) ?? {
			key: '',
			scrollY: 0,
			entryId: null,
		};
		libraryFilterKey = JSON.stringify(currentFilters());
		ready = true;
		if (practising) void focusPractice(++viewRevision);
		window.addEventListener('popstate', restoreFromHistory);
		window.addEventListener('hashchange', finishHashNavigation);
		window.addEventListener('storage', syncFromStorage);
		return () => {
			viewRevision++;
			window.removeEventListener('popstate', restoreFromHistory);
			window.removeEventListener('hashchange', finishHashNavigation);
			window.removeEventListener('storage', syncFromStorage);
		};
	});
</script>

<svelte:window onkeydown={shortcuts} />
<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title
		>{practising && selected
			? `${selected.title} — Hyper Chamber`
			: `Hyper Chamber — ${subjectName} library`}</title
	>
	<meta
		name="description"
		content={`A compact ${subjectName} reference for ${game.name}. Replay source clips, inspect key moments and keep your own practice notes.`}
	/>
</svelte:head>
<a class="skip-link" href={practising ? '#reference' : '#library-title'}
	>{practising ? 'Skip to selected reference' : 'Skip to reference library'}</a
>
<div
	class="app-shell"
	class:in-practice={practising}
	data-ready={ready}
	data-character={characterId}
>
	<header class="masthead">
		<a
			class="brand"
			href={characterId === 'dhalsim' ? '/' : `/?character=${characterId}`}
			aria-label="Hyper Chamber home"><BrandMark /><span>HYPER<br />CHAMBER</span></a
		>
		<div class="masthead-description">
			A fighting game reference.<br /><span>Less searching. More playing.</span>
		</div>
		<label class="character-picker" for="character-picker">
			<span>Character</span>
			<select
				id="character-picker"
				value={characterId}
				disabled={!ready}
				onchange={(event) => changeCharacter(event.currentTarget.value)}
			>
				{#each collections as item}<option value={item.id}>{item.name}</option>{/each}
			</select>
		</label>
		<nav class="header-actions" aria-label="Utilities">
			<button onclick={() => help.showModal()}>Notation <span aria-hidden="true">?</span></button>
			<button onclick={() => backup.showModal()}
				>Your library <span aria-hidden="true">↗</span></button
			>
			{#each game.guides as guide}<a
					class="guide-link"
					href={guide.url}
					target="_blank"
					rel="noreferrer">{guide.label} ↗</a
				>{/each}
		</nav>
	</header>
	<main id="main-content">
		{#if storageError}<p class="global-notice" role="alert">
				{storageError} Your changes remain available in this session.
				<button class="text-button" onclick={persistPending}>Retry saving</button><button
					class="text-button"
					onclick={exportData}>Export session backup</button
				>
			</p>{/if}
		{#if message}<p class="message-bar" role="status">{message}</p>{/if}
		{#if !practising}
			<section class="library-view" aria-labelledby="library-title">
				<header class="library-heading">
					<div>
						<span class="eyebrow">{game.name.toUpperCase()} / CHARACTER LIBRARY</span>
						<h1 id="library-title" tabindex="-1">{subjectName}<span class="title-dot">.</span></h1>
						<p class="library-intro">Find your next route. Take it into practice.</p>
					</div>
					<p class="library-total">
						<strong>{references.length}</strong><span
							>combo, setup &amp;<br />response references</span
						>
					</p>
				</header>
				<div class="library-filters" aria-label="Reference filters">
					<label class="search"
						><span aria-hidden="true">⌕</span><span class="sr-only">Search references</span><input
							id="library-search"
							type="search"
							placeholder="Find an input, situation…"
							bind:value={query}
							oninput={(event) => {
								query = event.currentTarget.value;
								void updateUrl();
							}}
						/></label
					>
					<div class="collection-switch">
						<button
							class:current={!savedOnly}
							aria-pressed={!savedOnly}
							onclick={() => {
								savedOnly = false;
								void updateUrl();
							}}>All references</button
						><button
							class:current={savedOnly}
							aria-pressed={savedOnly}
							onclick={() => {
								savedOnly = true;
								void updateUrl();
							}}>Saved <span>{savedIds.size}</span></button
						>
					</div>
					<div class="filters">
						<label
							>Type<select
								bind:value={kind}
								onchange={(event) => {
									kind = event.currentTarget.value;
									void updateUrl();
								}}
								><option value="all">All types</option><option value="combo">Combo</option><option
									value="setup">Setup</option
								><option value="response">Response</option></select
							></label
						>
						<label
							>Situation<select
								bind:value={situation}
								onchange={(event) => {
									situation = event.currentTarget.value;
									void updateUrl();
								}}
								><option value="all">Anywhere</option>{#each situations as s}<option value={s}
										>{s}</option
									>{/each}</select
							></label
						>
						<label
							>Practice status <span>(self-reported)</span><select
								bind:value={practice}
								onchange={(event) => {
									practice = event.currentTarget.value;
									void updateUrl();
								}}
								><option value="all">All statuses</option><option value="untried">Untried</option
								><option value="practising">Practising</option><option value="reliable"
									>Reliable</option
								></select
							></label
						>
					</div>
					<div class="results-meta">
						<span>{results.length} {results.length === 1 ? 'reference' : 'references'}</span>
						<div class="results-actions">
							{#if query || kind !== 'all' || situation !== 'all' || savedOnly || practice !== 'all'}<button
									onclick={reset}>Reset filters</button
								>{/if}
							<button
								class="text-button"
								onclick={openSwitcher}
								aria-keyshortcuts="Control+k Meta+k">Quick switch <kbd>⌘ / Ctrl K</kbd></button
							>
						</div>
					</div>
				</div>
				<noscript
					><p class="notice">
						Enable JavaScript to open a practice reference, or <a href={game.guides[0]?.url}
							>read the Dhalsim guide ↗</a
						>.
					</p></noscript
				>
				<ul class="reference-list reference-grid" aria-label="Matching references">
					{#each results as ref, index (ref.id)}<li>
							<a
								class="reference-card"
								href={entryHref(ref.id)}
								data-entry-id={ref.id}
								onclick={(event) => {
									if (
										event.button ||
										event.metaKey ||
										event.ctrlKey ||
										event.shiftKey ||
										event.altKey
									)
										return;
									event.preventDefault();
									void selectEntry(ref, true);
								}}
								><div class="card-top">
									<span class="kind-label">{ref.kind}</span><span
										>{library[ref.id]?.saved ? '★ Saved' : String(index + 1).padStart(2, '0')}</span
									>
								</div>
								<h3>{ref.title}</h3>
								<p class="card-situations">{ref.situations.join(' · ')}</p>
								<p class="card-summary">{ref.summary}</p>
								<div class="card-bottom">
									<span>{ref.inputs.length} {ref.inputs.length === 1 ? 'input' : 'inputs'}</span
									><span>Practice ↗</span>
								</div></a
							>
						</li>{/each}
				</ul>
				{#if results.length === 0}<div class="empty">
						<h2>
							{savedOnly && savedIds.size === 0
								? 'Nothing saved here yet.'
								: 'No matching references.'}
						</h2>
						<p>
							{savedOnly && savedIds.size === 0
								? 'Save a reference with the star to keep it close.'
								: 'Try a shorter input or another situation.'}
						</p>
						<button class="button" onclick={reset}>Show all references</button>
					</div>{/if}
			</section>
		{:else if selected && personal}
			<article class="reference-detail practice-view" aria-label="Selected reference">
				<nav class="practice-nav" aria-label="Practice navigation">
					<button class="text-button back-library" onclick={returnToLibrary}
						>← Back to library <kbd>Esc</kbd></button
					>
					<button
						class="button small quick-switch-trigger"
						onclick={openSwitcher}
						aria-keyshortcuts="Control+k Meta+k">Quick switch <kbd>⌘ / Ctrl K</kbd></button
					>
					<div class="practice-pagination">
						<button
							class="text-button"
							disabled={!previousReference}
							onclick={() => previousReference && selectEntry(previousReference)}
							aria-label="Previous reference">← Previous</button
						><span
							>{selectedIndex >= 0
								? `${selectedIndex + 1} / ${results.length}`
								: 'Outside filters'}</span
						><button
							class="text-button"
							disabled={!nextReference}
							onclick={() => nextReference && selectEntry(nextReference)}
							aria-label="Next reference">Next →</button
						>
					</div>
				</nav>
				{#key selected.id}<ReferenceMedia reference={selected} layout="practice">
						{#snippet beforeReplay()}
							<header class="practice-heading">
								<span class="eyebrow"
									>{subjectName.toUpperCase()} / {selected.kind.toUpperCase()}</span
								>
								<div class="detail-title-row">
									<h1 id="reference" tabindex="-1">{selected.title}</h1>
									<button
										class="save-button"
										class:saved={personal.saved}
										aria-pressed={personal.saved}
										aria-label={personal.saved ? 'Unsave reference' : 'Save reference'}
										onclick={() => updatePersonal({ saved: !personal?.saved })}
										>{personal.saved ? '★' : '☆'}</button
									>
								</div>
							</header>
							<section class="notation-panel" aria-label="Input sequence">
								<InputSequence
									reference={selected}
									{game}
									compact
									onNotation={() => help.showModal()}
								/>
							</section>
						{/snippet}
					</ReferenceMedia>{/key}
				<section class="input-details">
					<details class="input-explanations">
						<summary
							>Move explanations &amp; timing cues <span
								>({selected.inputs.length}
								{selected.inputs.length === 1 ? 'input' : 'inputs'})</span
							></summary
						>
						<div class="notation-panel">
							<InputSequence reference={selected} {game} showActions={false} />
						</div>
					</details>
				</section>
				<section class="reference-context" aria-label="Reference context">
					<p>{selected.summary}</p>
					<div class="tags">
						{#each selected.situations as tag}<span>{tag}</span
							>{/each}{#each selected.outcomes as tag}<span class="outcome">{tag}</span>{/each}
					</div>
					<div class="condition-row">
						<span class="eyebrow">SET THE SCENE</span>
						<p>{selected.conditions.join(' · ')}</p>
					</div>
				</section>
				{#if selectedIndex < 0}<p class="notice">
						This reference is outside your current filters. <button onclick={reset}
							>Clear filters</button
						> or use Quick switch to browse all references.
					</p>{/if}
				<div class="detail-bottom">
					<section class="reference-notes">
						<div class="section-heading">
							<h2>Keep in mind</h2>
							<span aria-hidden="true">↳</span>
						</div>
						<ul>
							{#each selected.notes as note}<li>{note}</li>{/each}
						</ul>
						<div class="resource-line">
							{#each Object.entries(selected.resources) as [resource, value]}<span
									>{game.resourceLabels[resource]} <strong>{value}</strong></span
								>{/each}
						</div>
					</section>
					<section class="personal-panel">
						<div class="section-heading">
							<h2>Your quick notes</h2>
							<span class="eyebrow">LOCAL ONLY</span>
						</div>
						{#if personal.revision !== selected.revision}<p class="revision-hint">
								This reference has been updated since your saved notes. Recheck the source; your
								practice status is unchanged.
							</p>{/if}<label class="status-label"
							>Practice status (self-reported)<select
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
							{selected.source.creator} · {time(selected.source.start)}–{time(selected.source.end)}
						</p>
					</div>
					<div class="source-review">
						<strong
							>{selected.verification.status === 'source-reviewed'
								? 'Source reviewed'
								: 'Review pending'}</strong
						>
						<p>{selected.verification.note}</p>
						<p>Game version: {selected.verification.gameVersion ?? 'not established'}.</p>
						<p>Current-patch validity is not established.</p>
					</div>
				</footer>
				{#if selected.relatedIds.length}<section class="related">
						<h2>Also in the chamber</h2>
						<div>
							{#each references.filter( (ref) => selected?.relatedIds.includes(ref.id) ) as ref}<button
									onclick={() => selectEntry(ref)}
									>{ref.title}<span aria-hidden="true">↗</span></button
								>{/each}
						</div>
					</section>{/if}
			</article>
		{/if}
	</main>
	<footer class="site-footer">
		<span>HYPER CHAMBER</span>
		<p>Independent reference. Game names and characters belong to their respective owners.</p>
		<span>Keep it within reach.</span>
	</footer>
</div>
<dialog class="quick-switch-dialog" bind:this={switcher} aria-labelledby="switch-title">
	<div class="dialog-heading">
		<h2 id="switch-title">Quick switch <span class="switch-character">{subjectName}</span></h2>
		<button class="button small" onclick={() => switcher.close()}>Close ×</button>
	</div>
	<label class="switch-search"
		>Find a reference<input
			type="search"
			bind:this={switchSearch}
			bind:value={switchQuery}
			onkeydown={switcherKeys}
			placeholder="Type a move, input or situation…"
		/></label
	>
	<div class="switch-scopes" aria-label="Quick switch collection">
		<button
			aria-pressed={switchScope === 'results'}
			onclick={() => {
				switchScope = 'results';
				switchSearch.focus();
			}}>Current results <span>{results.length}</span></button
		><button
			aria-pressed={switchScope === 'saved'}
			onclick={() => {
				switchScope = 'saved';
				switchSearch.focus();
			}}>Saved <span>{savedIds.size}</span></button
		><button
			aria-pressed={switchScope === 'all'}
			onclick={() => {
				switchScope = 'all';
				switchSearch.focus();
			}}>All references <span>{references.length}</span></button
		>
	</div>
	<p class="switch-count" role="status">
		{switchResults.length}
		{switchResults.length === 1 ? 'reference' : 'references'}
	</p>
	<ul class="switch-results" aria-label="Choose a reference">
		{#each switchResults as ref (ref.id)}<li>
				<button
					class="switch-result"
					aria-current={practising && ref.id === selectedId ? 'true' : undefined}
					onclick={() => selectEntry(ref)}
					onkeydown={switcherKeys}
					><span class="kind-label">{ref.kind}</span><strong>{ref.title}</strong><small
						>{ref.situations.join(' · ')}{practising && ref.id === selectedId
							? ' · Current reference'
							: ''}</small
					></button
				>
			</li>{/each}
	</ul>
	{#if switchResults.length === 0}<p class="empty-switch">
			No matching references. Try another search or choose All references.
		</p>{/if}
</dialog>
<dialog bind:this={help} aria-labelledby="notation-title">
	<div class="dialog-heading">
		<h2 id="notation-title">{subjectName} notation</h2>
		<button class="button small" onclick={() => help.close()}>Close ×</button>
	</div>
	<p>{game.notation.description}</p>
	<div class="notation-help">
		{#if game.notation.numpad}
			<div
				class="numpad"
				aria-label="Direction notation: 7 up back, 8 up, 9 up forward, 4 back, 5 neutral, 6 forward, 1 down back, 2 down, 3 down forward"
			>
				{#each ['7 ↖', '8 ↑', '9 ↗', '4 ←', '5 ·', '6 →', '1 ↙', '2 ↓', '3 ↘'] as key}<span
						>{key}</span
					>{/each}
			</div>
		{/if}
		<dl>
			{#each game.notation.legend as item}
				<dt>{item.term}</dt>
				<dd>{item.meaning}</dd>
			{/each}
		</dl>
	</div>
	<p class="muted">
		Use each entry’s execution cues alongside the notation. Timing is shown in the source clip.
	</p>
</dialog>
<dialog bind:this={backup} aria-labelledby="backup-title">
	<div class="dialog-heading">
		<h2 id="backup-title">Your library</h2>
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
