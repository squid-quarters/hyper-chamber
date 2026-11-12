<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { collections } from '#lib/catalog';
	import {
		filterReferences,
		referenceGoals,
		type Reference,
		type PersonalLibrary,
		type PersonalEntry,
		type PracticeStatus,
		type ReferenceGoal,
	} from '@hyper-chamber/reference';
	import {
		loadLibrary,
		persistChanges,
		mergePending,
		createBackup,
		blankEntry,
		STORAGE_KEY,
		type LibraryPatches,
	} from '#lib/personal';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import AppFooter from '#lib/components/AppFooter.svelte';
	import CharacterPicker from '#lib/components/CharacterPicker.svelte';
	import CharacterPortrait from '#lib/components/CharacterPortrait.svelte';
	import NotationKey from '#lib/components/NotationKey.svelte';
	import SourceDetails from '#lib/components/SourceDetails.svelte';
	import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Search, Star, X } from '@lucide/svelte';
	import ReferenceMedia from '#lib/components/ReferenceMedia.svelte';
	import InputSequence from '#lib/components/InputSequence.svelte';
	import {
		readPlaybackPreferences,
		savePlaybackPreferences,
		shouldStartPlayback,
		type PlaybackPreferences,
	} from '../lib/player';
	import {
		readLibraryReturn,
		readCharacterLocation,
		referenceLocation,
		type LibraryReturn,
	} from '../lib/navigation';

	let playerPreferences = $state<PlaybackPreferences>({ autoplay: 'follow', loop: true, speed: 1 });
	let startPlaying = $state(false);
	let referenceVisit = $state(0);
	let switcherWasPlaying = false;
	function clipIsPlaying() {
		const clip = document.querySelector<HTMLVideoElement>('.practice-view video');
		return !!clip && !clip.paused && !clip.ended;
	}
	function updatePlayerPreferences(patch: Partial<PlaybackPreferences>) {
		playerPreferences = { ...playerPreferences, ...patch };
		savePlaybackPreferences(playerPreferences);
	}
	let characterId = $state(collections[0].id);
	let collection = $derived(collections.find((item) => item.id === characterId) ?? collections[0]);
	let references = $derived(collection.references);
	let characterOptions = $derived(
		collections.map((item) => ({ id: item.id, name: item.name, count: item.references.length })),
	);
	let game = $derived(collection.game);
	let subjectName = $derived(collection.name);
	let query = $state('');
	let kind = $state('all');
	let situation = $state('all');
	let outcome = $state('all');
	let goal = $state<ReferenceGoal | 'all'>('all');
	let savedOnly = $state(false);
	let practice = $state('all');
	let refinementsOpen = $state(false);
	let resultAnnouncement = $state('');
	let selectedId = $state('');
	let practising = $state(false);
	let library = $state<PersonalLibrary>({});
	let pendingChanges = $state<LibraryPatches>({});
	let storageError = $state<string | null>(null);
	let message = $state('');
	let help: HTMLDialogElement;
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
	let outcomes = $derived(collection.outcomes);
	let selected = $derived(references.find((r) => r.id === selectedId));
	let personal = $derived(selected ? (library[selected.id] ?? blankEntry(selected)) : null);
	let savedIds = $derived(
		new Set(
			Object.entries(library)
				.filter(([id, entry]) => entry.saved && referenceIds.has(id))
				.map(([id]) => id),
		),
	);
	let matchingReferences = $derived(
		filterReferences(references, {
			query,
			kind,
			situation,
			outcome,
			savedIds: savedOnly ? savedIds : undefined,
		}).filter((ref) => practice === 'all' || (library[ref.id]?.status ?? 'untried') === practice),
	);
	let results = $derived(filterReferences(matchingReferences, { goal }));
	let goalOptions = $derived([
		{ id: 'all' as const, label: 'All goals', count: matchingReferences.length },
		...referenceGoals.map((item) => ({
			...item,
			count: filterReferences(matchingReferences, { goal: item.id }).length,
		})),
	]);
	let goalLabel = $derived(goalOptions.find((item) => item.id === goal)?.label ?? 'All goals');
	let goalReferences = $derived(filterReferences(references, { goal }));
	let refinementCount = $derived(
		Number(situation !== 'all') + Number(outcome !== 'all') + Number(practice !== 'all'),
	);
	const typeOptions = [
		{ value: 'all', label: 'All types' },
		{ value: 'combo', label: 'Combos' },
		{ value: 'setup', label: 'Setups' },
		{ value: 'response', label: 'Responses' },
	];
	type FilterKey = 'query' | 'kind' | 'situation' | 'outcome' | 'goal' | 'savedOnly' | 'practice';
	let activeFilters = $derived([
		...(savedOnly ? [{ key: 'savedOnly' as const, label: 'Saved only' }] : []),
		...(goal !== 'all' ? [{ key: 'goal' as const, label: `Goal: ${goalLabel}` }] : []),
		...(kind !== 'all'
			? [
					{
						key: 'kind' as const,
						label: `Type: ${typeOptions.find((item) => item.value === kind)?.label}`,
					},
				]
			: []),
		...(query ? [{ key: 'query' as const, label: `Search: ${query}` }] : []),
		...(situation !== 'all' ? [{ key: 'situation' as const, label: `Starts: ${situation}` }] : []),
		...(outcome !== 'all' ? [{ key: 'outcome' as const, label: `Outcome: ${outcome}` }] : []),
		...(practice !== 'all'
			? [
					{
						key: 'practice' as const,
						label: `Status: ${practice[0].toUpperCase()}${practice.slice(1)}`,
					},
				]
			: []),
	]);
	let practiceContext = $derived(
		[
			...(savedOnly ? ['Saved'] : []),
			...(goal !== 'all' ? [goalLabel] : []),
			...(kind !== 'all' ? [typeOptions.find((item) => item.value === kind)?.label] : []),
		].join(' · ') || 'Current results',
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
		return { query, kind, situation, outcome, goal, savedOnly, practice, characterId };
	}
	function entryHref(id: string) {
		return referenceLocation('https://hyper-chamber.invalid/', currentFilters(), id).search;
	}
	function readUrl() {
		const wasPlaying = clipIsPlaying();
		const next = readCharacterLocation(location.search, collections);
		const changingReference = !practising || next.entryId !== selectedId;
		characterId = next.characterId;
		query = next.query;
		kind = next.kind;
		situation = next.situation;
		outcome = next.outcome;
		goal = next.goal;
		savedOnly = next.savedOnly;
		practice = next.practice;
		if (next.situation !== 'all' || next.outcome !== 'all' || next.practice !== 'all')
			refinementsOpen = true;
		practising = next.entryId !== null;
		selectedId = next.entryId ?? references[0]?.id ?? '';
		if (changingReference) {
			startPlaying =
				!!next.entryId &&
				!!references.find((item) => item.id === next.entryId)?.media.clip &&
				shouldStartPlayback(playerPreferences.autoplay, wasPlaying);
			referenceVisit++;
		}
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
		for (const dialog of [switcher, help]) if (dialog?.open) dialog.close();
		characterId = id;
		query = '';
		kind = 'all';
		situation = 'all';
		outcome = 'all';
		goal = 'all';
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
		const playNext =
			!!ref.media.clip &&
			shouldStartPlayback(
				playerPreferences.autoplay,
				switcher?.open ? switcherWasPlaying : clipIsPlaying(),
			);
		const revision = ++viewRevision;
		if (!practising) {
			captureLibrary(fromTile ? ref.id : switchOrigin);
			// Stamp this library history entry before pushing practice. Each visit
			// gets its own bookmark, even when two visits use identical filters.
			await updateUrl();
			if (revision !== viewRevision) return;
		}
		startPlaying = playNext;
		referenceVisit++;
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
		for (const dialog of [switcher, help]) if (dialog?.open) dialog.close();
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
	$effect(() => {
		if (!ready || practising) return;
		const count = results.length;
		const context = activeFilters.map((filter) => filter.label).join(', ');
		const timeout = window.setTimeout(() => {
			resultAnnouncement = `${count} ${count === 1 ? 'reference' : 'references'}${context ? `. ${context}` : ''}.`;
		}, 300);
		return () => window.clearTimeout(timeout);
	});
	async function clearFilters(keepGoal = false) {
		const revision = ++viewRevision;
		query = '';
		kind = 'all';
		situation = 'all';
		outcome = 'all';
		if (!keepGoal) goal = 'all';
		savedOnly = false;
		practice = 'all';
		await updateUrl();
		await tick();
		if (revision !== viewRevision) return;
		if (practising) await focusPractice(revision);
		else document.getElementById('library-search')?.focus();
	}
	function reset() {
		void clearFilters();
	}
	async function removeFilter(key: FilterKey) {
		const revision = ++viewRevision;
		const index = activeFilters.findIndex((filter) => filter.key === key);
		if (key === 'query') query = '';
		else if (key === 'kind') kind = 'all';
		else if (key === 'situation') situation = 'all';
		else if (key === 'outcome') outcome = 'all';
		else if (key === 'goal') goal = 'all';
		else if (key === 'savedOnly') savedOnly = false;
		else if (key === 'practice') practice = 'all';
		await updateUrl();
		await tick();
		if (revision !== viewRevision) return;
		const remaining = [...document.querySelectorAll<HTMLButtonElement>('.active-filter')];
		(
			remaining[Math.min(index, remaining.length - 1)] ?? document.getElementById('library-search')
		)?.focus();
	}
	async function showPunishCombos() {
		const revision = ++viewRevision;
		kind = 'combo';
		await updateUrl();
		await tick();
		if (revision === viewRevision) document.getElementById('type-combo')?.focus();
	}
	async function openSwitcher() {
		if (!ready || document.querySelector('dialog[open], [data-character-picker-open="true"]'))
			return;
		switchOrigin =
			document.activeElement instanceof Element
				? (document.activeElement.closest<HTMLAnchorElement>('.reference-card')?.dataset.entryId ??
					null)
				: null;
		switcherWasPlaying = clipIsPlaying();
		document.querySelector<HTMLVideoElement>('.practice-view video')?.pause();
		switchQuery = '';
		switchScope = results.length ? 'results' : 'all';
		switcher.showModal();
		await tick();
		switchSearch.focus();
	}
	function switcherKeys(event: KeyboardEvent) {
		if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
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
		if (event.defaultPrevented || event.repeat || event.isComposing) return;
		if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
			if (document.querySelector('dialog[open], [data-character-picker-open="true"]')) return;
			event.preventDefault();
			void openSwitcher();
			return;
		}
		const key = event.key.toLowerCase();
		const editable =
			event.target instanceof Element &&
			event.target.closest('input, textarea, select, [contenteditable]');
		const overlayOpen = document.querySelector('dialog[open], [data-character-picker-open="true"]');
		if (
			practising &&
			!editable &&
			!overlayOpen &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		) {
			if (key === 'n' || key === 'p') {
				const target = key === 'n' ? nextReference : previousReference;
				if (target) {
					event.preventDefault();
					void selectEntry(target);
				}
				return;
			}
			if (key === 'k' || key === 'r') {
				const control = document.querySelector<HTMLButtonElement>(
					key === 'k'
						? '.practice-view .playback-button'
						: '.practice-view button[aria-keyshortcuts="R"]',
				);
				if (control) {
					event.preventDefault();
					control.click();
				}
				return;
			}
		}
		if (
			event.key !== 'Escape' ||
			!practising ||
			document.querySelector('dialog[open], [data-character-picker-open="true"]') ||
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
		message = 'Unsaved notes downloaded.';
	}

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
		playerPreferences = readPlaybackPreferences();
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
			aria-label="Hyper Chamber home"
			><BrandMark /><span class="brand-wordmark"><span>HYPER</span><span>CHAMBER</span></span></a
		>
		<CharacterPicker
			characters={characterOptions}
			gameName={game.name}
			selected={characterId}
			disabled={!ready}
			onchange={changeCharacter}
			onopen={() => document.querySelector<HTMLVideoElement>('.practice-view video')?.pause()}
		/>
		<nav class="header-actions" aria-label="Utilities">
			<button aria-label="Notation" title="Notation" onclick={() => help.showModal()}
				><BookOpen size={16} aria-hidden="true" /><span class="utility-label">Notation</span
				></button
			>
			{#each game.guides as guide}<a
					class="guide-link"
					href={guide.url}
					title={guide.label}
					aria-label={guide.label}
					target="_blank"
					rel="noreferrer"
					><span class="utility-label">Guides</span><ArrowUpRight size={15} aria-hidden="true" /></a
				>{/each}
		</nav>
	</header>
	<main id="main-content">
		{#if storageError}<p class="global-notice" role="alert">
				{storageError} Your changes remain available in this session.
				<button class="text-button" onclick={persistPending}>Retry saving</button><button
					class="text-button"
					onclick={exportData}>Download unsaved notes</button
				>
			</p>{/if}
		{#if message}<p class="message-bar" role="status">{message}</p>{/if}
		{#if !practising}
			<section class="library-view" aria-labelledby="library-title">
				<header class="library-heading">
					<CharacterPortrait {characterId} size={64} class="library-portrait" />
					<div>
						<h1 id="library-title" tabindex="-1">{subjectName}</h1>
						<p class="library-meta">
							{game.name}<span aria-hidden="true"> · </span>{references.length} references
						</p>
					</div>
				</header>
				<search class="library-filters" aria-label="Reference library">
					<div class="library-search-row">
						<div class="library-search-field">
							<label class="sr-only" for="library-search">Search references</label>
							<div class="search">
								<Search size={18} aria-hidden="true" /><input
									id="library-search"
									type="search"
									placeholder="Search moves, inputs or situations"
									bind:value={query}
									oninput={(event) => {
										query = event.currentTarget.value;
										void updateUrl();
									}}
								/>
							</div>
						</div>
						<div class="collection-switch" role="group" aria-label="Reference collection">
							<button
								aria-pressed={!savedOnly}
								onclick={() => {
									savedOnly = false;
									void updateUrl();
								}}>All references</button
							>
							<button
								aria-pressed={savedOnly}
								onclick={() => {
									savedOnly = true;
									void updateUrl();
								}}>Saved <span>{savedIds.size}</span></button
							>
						</div>
						<button
							class="text-button library-quick-switch"
							onclick={openSwitcher}
							aria-keyshortcuts="Control+k Meta+k">Quick switch <kbd>⌘ / Ctrl K</kbd></button
						>
					</div>
					<div class="browse-categories">
						<fieldset class="training-goals">
							<legend class="filter-label">Training goal</legend>
							<div class="training-goal-options">
								{#each goalOptions as option}<button
										class="goal-chip"
										aria-pressed={goal === option.id}
										onclick={() => {
											goal = option.id;
											void updateUrl();
										}}>{option.label} <span>{option.count}</span></button
									>{/each}
							</div>
						</fieldset>
						<fieldset class="reference-types">
							<legend class="filter-label">Reference type</legend>
							<div class="type-options">
								{#each typeOptions as option}<button
										id={`type-${option.value}`}
										aria-pressed={kind === option.value}
										onclick={() => {
											kind = option.value;
											void updateUrl();
										}}>{option.label}</button
									>{/each}
							</div>
						</fieldset>
					</div>
					{#if goal === 'punishes' && kind !== 'combo'}<p class="goal-note">
							<button onclick={showPunishCombos}>Show punish combos</button>
						</p>{/if}
					<div class="filter-bottom">
						<details class="library-refinements" bind:open={refinementsOpen}>
							<summary
								>Situation, outcome &amp; status <span
									>{refinementCount ? `${refinementCount} active` : 'More filters'}</span
								></summary
							>
							<div class="filters">
								<label for="situation-filter"
									>Starting situation<select
										id="situation-filter"
										bind:value={situation}
										onchange={(event) => {
											situation = event.currentTarget.value;
											void updateUrl();
										}}
										><option value="all">Any situation</option>{#each situations as value}<option
												{value}>{value}</option
											>{/each}</select
									></label
								>
								<label for="outcome-filter"
									>Outcome<select
										id="outcome-filter"
										bind:value={outcome}
										onchange={(event) => {
											outcome = event.currentTarget.value;
											void updateUrl();
										}}
										><option value="all">Any outcome</option>{#each outcomes as value}<option
												{value}>{value}</option
											>{/each}</select
									></label
								>
								<label for="practice-filter"
									>Practice status <span>(self-reported)</span><select
										id="practice-filter"
										bind:value={practice}
										onchange={(event) => {
											practice = event.currentTarget.value;
											void updateUrl();
										}}
										><option value="all">All statuses</option><option value="untried"
											>Untried</option
										><option value="practising">Practising</option><option value="reliable"
											>Reliable</option
										></select
									></label
								>
							</div>
						</details>
						<div class="results-meta">
							<p class="result-count">
								<strong>{results.length}</strong>
								{results.length === 1 ? 'reference' : 'references'}
							</p>
							{#if activeFilters.length}<button class="reset-filters" onclick={reset}
									>Reset all filters</button
								>{/if}
						</div>
					</div>
					{#if activeFilters.length}<ul
							class="active-filters"
							aria-label="Active filters"
							role="list"
						>
							{#each activeFilters as filter (filter.key)}<li>
									<button
										class="active-filter"
										onclick={() => removeFilter(filter.key)}
										aria-label={`Remove ${filter.label}`}
										><span>{filter.label}</span><X size={13} aria-hidden="true" /></button
									>
								</li>{/each}
						</ul>{/if}
					<p class="sr-only" role="status" aria-atomic="true">{resultAnnouncement}</p>
				</search>
				<noscript
					><p class="notice">
						Enable JavaScript to open a practice reference, or <a href={game.guides[0]?.url}
							>read the {subjectName} guide</a
						>.
					</p></noscript
				>
				<ul class="reference-list reference-grid" aria-label="Matching references">
					{#each results as ref (ref.id)}<li>
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
							>
								<div class="card-top">
									<span class="kind-label">{ref.kind}</span><span
										>{#if library[ref.id]?.saved}<Star
												size={13}
												fill="currentColor"
												aria-hidden="true"
											/>Saved{/if}</span
									>
								</div>
								<h2>{ref.title}</h2>
								{#if ref.media.poster}<img
										class="card-preview"
										src={ref.media.poster}
										alt=""
										width="480"
										height="270"
										loading="lazy"
										decoding="async"
									/>{/if}
								<dl class="card-facts">
									<div>
										<dt>Starts</dt>
										<dd>{ref.situations.join(' · ')}</dd>
									</div>
									<div>
										<dt>Outcome</dt>
										<dd>{ref.outcomes.join(' · ')}</dd>
									</div>
								</dl>
								<p class="card-summary">{ref.summary}</p>
								<div class="card-bottom">
									<span
										>{ref.inputs.length}
										{ref.inputs.length === 1
											? 'input'
											: 'inputs'}{#if library[ref.id]?.status && library[ref.id].status !== 'untried'}<span
												class="card-practice-status">Your status: {library[ref.id].status}</span
											>{/if}</span
									><span>Open reference<ArrowUpRight size={15} aria-hidden="true" /></span>
								</div></a
							>
						</li>{/each}
				</ul>
				{#if results.length === 0}<div class="empty">
						<h2>
							{savedOnly && savedIds.size === 0
								? 'Nothing saved here yet.'
								: goal !== 'all' && goalReferences.length === 0
									? `No ${goalLabel.toLowerCase()} references tagged yet.`
									: 'No matching references.'}
						</h2>
						<p>
							{savedOnly && savedIds.size === 0
								? 'Open a reference and use the star to save it for practice.'
								: goal !== 'all' && goalReferences.length === 0
									? 'This character library has no references tagged for this goal yet. Try another goal or browse the full library.'
									: 'Your filters have no matches. Remove an active filter above to broaden the results.'}
						</p>
						<div class="empty-actions">
							{#if goal !== 'all' && goalReferences.length > 0}<button
									class="button primary-button"
									onclick={() => clearFilters(true)}
									>Show all {goalLabel.toLowerCase()}
									<span>{goalReferences.length}</span><ArrowRight
										size={16}
										aria-hidden="true"
									/></button
								><button class="text-button" onclick={reset}>Browse all references</button
								>{:else}<button class="button primary-button" onclick={reset}
									>Browse all references<ArrowRight size={16} aria-hidden="true" /></button
								>{/if}
						</div>
					</div>{/if}
			</section>
		{:else if selected && personal}
			<article class="reference-detail practice-view" aria-label="Selected reference">
				<nav class="practice-nav" aria-label="Practice navigation">
					<button class="text-button back-library" onclick={returnToLibrary}
						><ArrowLeft size={16} aria-hidden="true" />Back to library <kbd>Esc</kbd></button
					>
					<button
						class="button small quick-switch-trigger"
						onclick={openSwitcher}
						aria-keyshortcuts="Control+k Meta+k">Quick switch <kbd>⌘ / Ctrl K</kbd></button
					>
					<div class="practice-pagination">
						<button
							class="practice-step practice-previous"
							aria-keyshortcuts="P"
							disabled={!previousReference}
							onclick={() => previousReference && selectEntry(previousReference)}
							aria-label="Previous reference"
							title={selectedIndex < 0
								? 'Reference is outside these results'
								: (previousReference?.title ?? 'First reference in these results')}
						>
							<ArrowLeft size={18} aria-hidden="true" />Previous<kbd aria-hidden="true">P</kbd>
						</button>
						<div class="practice-position">
							<span>{practiceContext}</span>
							<strong
								>{selectedIndex >= 0
									? `${selectedIndex + 1} of ${results.length}`
									: 'Outside filters'}</strong
							>
						</div>
						<button
							class="practice-step practice-next"
							aria-keyshortcuts="N"
							disabled={!nextReference}
							onclick={() => nextReference && selectEntry(nextReference)}
							aria-label="Next reference"
							title={selectedIndex < 0
								? 'Reference is outside these results'
								: (nextReference?.title ?? 'Last reference in these results')}
						>
							Next<kbd aria-hidden="true">N</kbd><ArrowRight size={18} aria-hidden="true" />
						</button>
					</div>
					{#if selectedIndex < 0}<div class="practice-filter-recovery">
							<p role="status">This reference is outside your current results.</p>
							<div>
								{#if results[0]}<button onclick={() => selectEntry(results[0])}
										>Return to {results.length}
										{results.length === 1 ? 'result' : 'results'}<ArrowRight
											size={14}
											aria-hidden="true"
										/></button
									>{/if}<button onclick={reset}>Use all references</button>
							</div>
						</div>{/if}
				</nav>
				{#key `${selected.id}:${referenceVisit}`}<ReferenceMedia
						reference={selected}
						layout="practice"
						preferences={playerPreferences}
						{startPlaying}
						onpreferencechange={updatePlayerPreferences}
					>
						{#snippet beforeReplay()}
							<header class="practice-heading">
								<p class="practice-breadcrumb">
									{subjectName} <span aria-hidden="true">/</span>
									{selected.kind}
								</p>
								<div class="detail-title-row">
									<h1 id="reference" tabindex="-1">{selected.title}</h1>
									<button
										class="save-button"
										class:saved={personal.saved}
										aria-pressed={personal.saved}
										aria-label={personal.saved ? 'Unsave reference' : 'Save reference'}
										onclick={() => updatePersonal({ saved: !personal?.saved })}
										><Star
											size={21}
											fill={personal.saved ? 'currentColor' : 'none'}
											aria-hidden="true"
										/></button
									>
								</div>
							</header>
							<section class="notation-panel" aria-label="Input sequence">
								<InputSequence reference={selected} {game} compact />
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
						<span class="section-label">Conditions</span>
						<p>{selected.conditions.join(' · ')}</p>
					</div>
				</section>
				<div class="detail-bottom">
					<section class="reference-notes">
						<div class="section-heading">
							<h2>Execution notes</h2>
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
							<h2>Your notes</h2>
							<span class="panel-meta">This browser</span>
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
							placeholder="Add a timing cue or practice note"
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
				<SourceDetails reference={selected} />
				{#if selected.relatedIds.length}<section class="related">
						<h2>Related references</h2>
						<div>
							{#each references.filter( (ref) => selected?.relatedIds.includes(ref.id) ) as ref}<button
									onclick={() => selectEntry(ref)}
									>{ref.title}<ArrowRight size={15} aria-hidden="true" /></button
								>{/each}
						</div>
					</section>{/if}
			</article>
		{/if}
	</main>
	<AppFooter />
</div>
<dialog class="quick-switch-dialog" bind:this={switcher} aria-labelledby="switch-title">
	<div class="dialog-heading">
		<h2 id="switch-title">Quick switch <span class="switch-character">{subjectName}</span></h2>
		<button class="button small" onclick={() => switcher.close()}
			><X size={16} aria-hidden="true" />Close</button
		>
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
<dialog class="notation-dialog" bind:this={help} aria-labelledby="notation-title">
	<NotationKey {game} {characterId} character={subjectName} onclose={() => help.close()} />
</dialog>
