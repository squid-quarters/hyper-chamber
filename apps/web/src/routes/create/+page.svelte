<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import {
		ArrowLeft,
		Plus,
		FolderOpen,
		Copy,
		Save,
		Download,
		Camera,
		Trash2,
		Play,
		X,
	} from '@lucide/svelte';
	import {
		gameDefinitionSchema,
		packVersionSchema,
		referenceSchema,
		type Reference,
	} from '@hyper-chamber/reference';
	import type { Workspace } from '@hyper-chamber/authoring';
	import sf6 from '../../../../../content/games/sf6/game.json';
	import BrandMark from '#lib/components/BrandMark.svelte';
	import AppFooter from '#lib/components/AppFooter.svelte';
	import InputSequence from '#lib/components/InputSequence.svelte';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ReferenceMedia from '#lib/components/ReferenceMedia.svelte';
	import SourceDetails from '#lib/components/SourceDetails.svelte';
	import type { PlaybackPreferences } from '../../lib/player';
	import {
		mediaForClip,
		nextPackEdition,
		participantsForCharacter,
		publicationForSource,
		sameSourceIdentity,
		sourceFieldsForKind,
		sourceForReference,
	} from '../../lib/creator';

	const defaultGame = gameDefinitionSchema.parse(sf6);
	type Step = { id: string; notation: string; label: string; cue?: string };
	type Frame = Reference['media']['frames'][number];
	type Draft = {
		id: string;
		title: string;
		summary: string;
		gameId: string;
		characterId: string;
		kind: Reference['kind'];
		steps: Step[];
		situations: string;
		outcomes: string;
		notes: string;
		conditions: string;
		clip: string;
		hasAudio: boolean;
		duration: number;
		poster: string;
		frames: Frame[];
		sourceKind: 'recording' | 'youtube';
		sourceUrl: string;
		sourceTitle: string;
		sourceCreator: string;
		sourceStart: number;
		reviewed: boolean;
		gameVersion: string;
	};
	let desktop = $state(false);
	let workspace = $state<Workspace | null>(null);
	let directory = $state('');
	let previewBase = $state('');
	let title = $state('');
	let author = $state('');
	let edition = $state('1.0.0');
	let draft = $state<Draft | null>(null);
	let baseline = $state('');
	let busy = $state(false);
	let error = $state('');
	let errorNotice = $state<HTMLDivElement>();
	let message = $state('');
	let video = $state<HTMLVideoElement>();
	let showPreview = $state(false);
	let previewPreferences = $state<PlaybackPreferences>({
		autoplay: 'paused',
		shortcuts: false,
		loop: true,
		muted: true,
		speed: 1,
	});
	let confirmDelete = $state(false);
	let validation = $state<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
	const dirty = $derived(!!draft && JSON.stringify(draft) !== baseline);
	const metadataDirty = $derived(
		!!workspace &&
			(title !== workspace.title || author !== workspace.author || edition !== workspace.version),
	);
	const game = $derived(
		workspace?.games.find((item) => item.id === draft?.gameId) ??
			workspace?.games[0] ??
			defaultGame,
	);
	const characterOptions = $derived(
		game.characters.map((item) => ({ value: item.id, label: item.name })),
	);
	const selected = $derived(workspace?.references.find((item) => item.id === draft?.id));
	const previewReference = $derived(
		selected
			? {
					...selected,
					media: {
						...selected.media,
						clip: selected.media.clip ? media(selected.media.clip) : undefined,
						poster: media(selected.media.poster),
						frames: selected.media.frames.map((frame) => ({ ...frame, src: media(frame.src) })),
						descriptionTrack: selected.media.descriptionTrack
							? media(selected.media.descriptionTrack)
							: undefined,
					},
				}
			: null,
	);
	const sequence = $derived(
		draft?.steps.filter((item) => item.notation.trim() && item.label.trim()) ?? [],
	);
	async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
		const { invoke } = await import('@tauri-apps/api/core');
		return invoke<T>(command, args);
	}
	function media(path: string) {
		return previewBase + path.replace(/^\//, '');
	}
	const lines = (text: string) =>
		text
			.split('\n')
			.map((value) => value.trim())
			.filter(Boolean);
	const tags = (text: string) =>
		text
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
	async function task(action: () => Promise<void>) {
		if (busy) return;
		busy = true;
		error = '';
		message = '';
		try {
			await action();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : String(reason);
			await tick();
			errorNotice?.focus({ preventScroll: true });
			errorNotice?.scrollIntoView({ block: 'center', behavior: 'instant' });
		} finally {
			busy = false;
		}
	}
	function accept(result: { directory: string; workspace: Workspace; previewBaseUrl?: string }) {
		workspace = result.workspace;
		directory = result.directory;
		title = workspace.title;
		author = workspace.author;
		edition = workspace.version;
		if (result.previewBaseUrl) previewBase = result.previewBaseUrl;
	}
	function openReference(reference: Reference) {
		if (dirty) {
			error = 'Save or discard this reference before opening another.';
			return;
		}
		video?.pause();
		showPreview = false;
		confirmDelete = false;
		validation = null;
		draft = {
			id: reference.id,
			title: reference.title,
			summary: reference.summary,
			gameId: reference.gameId,
			characterId: reference.participants[0].characterId,
			kind: reference.kind,
			steps: reference.inputs.map((item) => ({ ...item })),
			situations: reference.situations.join(', '),
			outcomes: reference.outcomes.join(', '),
			conditions: reference.conditions.join('\n'),
			notes: reference.notes.join('\n'),
			clip: reference.media.clip ?? '',
			hasAudio: reference.media.hasAudio === true,
			duration: reference.source.end - reference.source.start,
			poster: reference.media.poster,
			frames: reference.media.frames.map((item) => ({ ...item })),
			sourceKind: reference.source.kind === 'recording' ? 'recording' : 'youtube',
			sourceUrl: reference.source.url ?? '',
			sourceTitle: reference.source.title,
			sourceCreator: reference.source.creator,
			sourceStart: reference.source.start,
			reviewed: reference.verification.status === 'source-reviewed',
			gameVersion: reference.verification.gameVersion ?? '',
		};
		baseline = JSON.stringify(draft);
	}
	function newReference() {
		if (!workspace) return;
		if (dirty) {
			error = 'Save or discard this reference before adding another.';
			return;
		}
		video?.pause();
		showPreview = false;
		confirmDelete = false;
		validation = null;
		draft = {
			id: `${workspace.id}-${crypto.randomUUID()}`,
			title: '',
			summary: '',
			gameId: workspace.games[0].id,
			characterId: workspace.games[0].characters[0]?.id ?? '',
			kind: 'combo',
			steps: [{ id: 'step-1', notation: '', label: '' }],
			situations: '',
			outcomes: '',
			notes: '',
			conditions: '',
			clip: '',
			hasAudio: false,
			duration: 0,
			poster: '',
			frames: [],
			sourceKind: 'recording',
			sourceUrl: '',
			sourceTitle: '',
			sourceCreator: workspace.author,
			sourceStart: 0,
			reviewed: false,
			gameVersion: '',
		};
		baseline = JSON.stringify(draft);
	}
	async function open(mode: 'new' | 'open' | 'fork') {
		if (dirty || metadataDirty) {
			error = 'Save or discard your edits before changing workspaces.';
			return;
		}
		await task(async () => {
			const result = await invoke<{
				cancelled?: boolean;
				directory: string;
				workspace: Workspace;
				previewBaseUrl?: string;
			}>('open_authoring_workspace', {
				options: {
					mode,
					title: title.trim() || 'My reference pack',
					author: author.trim() || 'Local creator',
					games: [defaultGame],
				},
			});
			if (result.cancelled) return;
			accept(result);
			draft = null;
			baseline = '';
			validation = null;
			if (workspace?.references.length) openReference(workspace.references[0]);
			else newReference();
		});
	}
	async function reloadWorkspace() {
		if (dirty || metadataDirty) {
			error = 'Save or discard your edits before reloading the workspace.';
			return;
		}
		await task(async () => {
			const id = draft?.id;
			accept(await invoke('authoring_action', { request: { command: 'read' } }));
			draft = null;
			baseline = '';
			showPreview = false;
			validation = null;
			const reference =
				workspace?.references.find((item) => item.id === id) ?? workspace?.references[0];
			if (reference) openReference(reference);
			else newReference();
			message = 'Workspace reloaded from disk.';
		});
	}

	function buildReference(): Reference {
		if (!workspace || !draft) throw new Error('Open a workspace first.');
		if (!draft.title.trim()) throw new Error('Give this reference a title.');
		if (!draft.summary.trim())
			throw new Error('Add a quick note about when to use this reference.');
		const incomplete = draft.steps.findIndex((step) => !step.notation.trim() || !step.label.trim());
		if (incomplete >= 0)
			throw new Error(`Complete the notation and move label for step ${incomplete + 1}.`);
		if (draft.frames.some((frame) => !frame.label.trim()))
			throw new Error('Give each key moment a short label.');
		if (!Number.isFinite(draft.sourceStart) || draft.sourceStart < 0)
			throw new Error('Enter an excerpt start of zero or more seconds.');
		if (!draft.clip || !draft.duration)
			throw new Error('Choose a playable, already-trimmed video clip.');
		if (!draft.frames.length) throw new Error('Capture at least one key moment from the clip.');
		const original = workspace.references.find((item) => item.id === draft!.id);
		const source = sourceForReference(draft, {
			id: original?.source.id ?? `${draft.id}-recording`,
			title: draft.title.trim(),
			creator: author,
			published: publicationForSource(original, draft, draft.clip),
			start: draft.sourceStart,
			end: draft.sourceStart + draft.duration,
		});
		return referenceSchema.parse({
			...original,
			id: draft.id,
			revision: original?.revision ?? 1,
			gameId: draft.gameId,
			participants: participantsForCharacter(
				original?.gameId === draft.gameId ? original.participants : undefined,
				draft.characterId,
			),
			title: draft.title.trim(),
			summary: draft.summary.trim(),
			kind: draft.kind,
			notation:
				original && JSON.stringify(original.inputs) === JSON.stringify(draft.steps)
					? original.notation
					: draft.steps.map((step) => step.notation.trim()).join(' > '),
			inputs: draft.steps.map((step) => ({
				...step,
				notation: step.notation.trim(),
				label: step.label.trim(),
			})),
			situations: tags(draft.situations),
			outcomes: tags(draft.outcomes),
			conditions: lines(draft.conditions),
			notes: lines(draft.notes),
			resources: original?.resources ?? {},
			source,
			verification:
				original &&
				sameSourceIdentity(original, draft, draft.clip) &&
				original.verification.status === (draft.reviewed ? 'source-reviewed' : 'draft') &&
				original.verification.gameVersion === (draft.gameVersion.trim() || null)
					? original.verification
					: {
							status: draft.reviewed ? 'source-reviewed' : 'draft',
							gameVersion: draft.gameVersion.trim() || null,
							note: draft.reviewed
								? 'The creator checked these inputs and notes against the recording. Current-patch in-game accuracy is not established.'
								: 'Draft annotations; review the recording before relying on these inputs.',
						},
			media: mediaForClip(original?.media, {
				clip: draft.clip,
				hasAudio: draft.hasAudio,
				poster: draft.poster || draft.frames[0].src,
				frames: draft.frames,
			}),
			relatedIds: original?.relatedIds ?? [],
		});
	}
	async function saveWorkspace(references = workspace?.references ?? []) {
		if (!workspace) return;
		if (!title.trim() || !author.trim())
			throw new Error('Enter a pack title and creator in Pack details.');
		if (!packVersionSchema.safeParse(edition).success)
			throw new Error('Use a semantic edition such as 1.0.0 or 1.0.0-beta.1.');
		let version = edition;
		const changed =
			title !== workspace.title ||
			author !== workspace.author ||
			JSON.stringify(references) !== JSON.stringify(workspace.references);
		if (changed && workspace.lastExport?.version === version) version = nextPackEdition(version);
		accept(
			await invoke<{ directory: string; workspace: Workspace }>('authoring_action', {
				request: {
					command: 'save',
					workspace: {
						...workspace,
						title: title.trim(),
						author: author.trim(),
						version,
						references,
					},
				},
			}),
		);
	}
	async function saveReference() {
		await task(async () => {
			const reference = buildReference();
			const references = workspace!.references.map((item) =>
				item.id === reference.id ? reference : item,
			);
			if (!references.some((item) => item.id === reference.id)) references.push(reference);
			await saveWorkspace(references);
			openReferenceAfterSave(reference.id);
			message = 'Reference saved to this workspace.';
		});
	}
	function openReferenceAfterSave(id: string) {
		baseline = JSON.stringify(draft);
		const reference = workspace?.references.find((item) => item.id === id);
		if (reference) openReference(reference);
	}
	async function chooseClip() {
		if (!draft) return;
		await task(async () => {
			video?.pause();
			showPreview = false;
			const result = await invoke<{ cancelled?: boolean; path: string }>('authoring_action', {
				request: { command: 'add-media', referenceId: draft!.id },
			});
			if (!result.cancelled) {
				draft!.clip = result.path;
				draft!.frames = [];
				draft!.poster = '';
				draft!.duration = 0;
				draft!.hasAudio = false;
				draft!.reviewed = false;
			}
		});
	}
	async function captureMoment() {
		if (!draft || !video || video.readyState < 2) {
			error = 'Wait for the clip to load before capturing a moment.';
			return;
		}
		await task(async () => {
			video!.pause();
			const canvas = document.createElement('canvas');
			const scale = Math.min(1, 1280 / video!.videoWidth, 720 / video!.videoHeight);
			canvas.width = Math.max(1, Math.round(video!.videoWidth * scale));
			canvas.height = Math.max(1, Math.round(video!.videoHeight * scale));
			canvas.getContext('2d')!.drawImage(video!, 0, 0, canvas.width, canvas.height);
			const data = canvas.toDataURL('image/jpeg', 0.86);
			canvas.width = 0;
			canvas.height = 0;
			const id = `moment-${crypto.randomUUID()}`;
			const result = await invoke<{ path: string }>('authoring_action', {
				request: {
					command: 'write-asset',
					path: `/media/${workspace!.id}/${draft!.id}/${id}.jpg`,
					base64: data.slice(data.indexOf(',') + 1),
				},
			});
			const at = Math.min(video!.currentTime, Math.max(0, draft!.duration - 0.001));
			draft!.frames = [
				...draft!.frames.filter((frame) => Math.abs(frame.at - at) > 0.001),
				{
					id,
					src: result.path,
					at,
					label: `Moment ${draft!.frames.length + 1}`,
					alt: `Key moment from ${draft!.title || 'this reference'}`,
				},
			].sort((a, b) => a.at - b.at);
			draft!.poster ||= result.path;
			message = 'Key moment captured. Add a short label below.';
		});
	}
	async function exportPack() {
		if (dirty) {
			error = 'Save your current reference before exporting the pack.';
			return;
		}
		await task(async () => {
			await saveWorkspace();
			validation = await invoke('authoring_action', { request: { command: 'validate' } });
			if (!validation?.valid)
				throw new Error('Fix the listed workspace problems before exporting.');
			const result = await invoke<{ cancelled?: boolean; path: string; warnings: string[] }>(
				'authoring_action',
				{ request: { command: 'export' } },
			);
			if (!result.cancelled) {
				message = `Exported ${result.path}. Import it from Library & devices when you are ready to practise.`;
				accept(await invoke('authoring_action', { request: { command: 'read' } }));
			}
		});
	}
	function discard() {
		const original = selected;
		baseline = JSON.stringify(draft);
		if (original) openReference(original);
		else {
			draft = null;
			baseline = '';
		}
	}
	function unload() {
		if (video) {
			video.pause();
			video.removeAttribute('src');
			video.load();
		}
	}
	beforeNavigate((event) => {
		if (dirty || metadataDirty) {
			event.cancel();
			error = 'Save or discard your edits before leaving the creator.';
		}
	});
	onMount(() => {
		desktop = '__TAURI_INTERNALS__' in window;
		const protect = (event: BeforeUnloadEvent) => {
			if (dirty || metadataDirty) event.preventDefault();
		};
		window.addEventListener('beforeunload', protect);
		return () => window.removeEventListener('beforeunload', protect);
	});
	onDestroy(() => {
		unload();
		if (desktop) void invoke('close_authoring_workspace').catch(() => {});
	});
</script>

<svelte:head
	><title>Pack creator · Hyper Chamber</title><meta
		name="description"
		content="Create, edit and export local Hyper Chamber reference packs."
	/></svelte:head
>
<header class="creator-top">
	<a class="creator-brand" href="/" aria-label="Hyper Chamber library"
		><BrandMark /><span>HYPER CHAMBER</span></a
	>
	<a class="button back" href="/"><ArrowLeft size={16} aria-hidden="true" />Library</a>
</header>
<main class="creator-page">
	<header class="creator-heading">
		<div>
			<h1>Pack creator</h1>
			<p>
				{workspace
					? workspace.title
					: 'Build a collection from your recordings and execution notes.'}
			</p>
		</div>
		{#if workspace}<button
				type="button"
				class="button export-button"
				disabled={busy}
				onclick={exportPack}><Download size={16} aria-hidden="true" />Export pack</button
			>{/if}
	</header>
	{#if error}<div class="notice" role="alert" tabindex="-1" bind:this={errorNotice}>
			{error}
		</div>{/if}
	{#if message}<p class="notice success" role="status">{message}</p>{/if}
	{#if !desktop}<section class="desktop-required">
			<h2>Open the desktop app to create packs</h2>
			<p>
				Workspaces and video files stay on your computer. You can browse the installed library from
				this device.
			</p>
			<a class="button" href="/">Return to library</a>
		</section>
	{:else if !workspace}
		<section class="start-workspace" aria-labelledby="workspace-title">
			<h2 id="workspace-title">Start a workspace</h2>
			<p>
				Choose an empty folder for a new pack. Existing workspaces can be opened and edited at any
				time.
			</p>
			<div class="start-fields">
				<label
					>Pack title<input
						disabled={busy}
						bind:value={title}
						placeholder="My Dhalsim references"
						maxlength="120"
					/></label
				><label
					>Creator<input
						disabled={busy}
						bind:value={author}
						placeholder="Your name or handle"
						maxlength="120"
					/></label
				>
			</div>
			<div class="workspace-actions">
				<button type="button" class="button primary" disabled={busy} onclick={() => open('new')}
					><Plus size={16} aria-hidden="true" />New workspace</button
				><button type="button" class="button" disabled={busy} onclick={() => open('open')}
					><FolderOpen size={16} aria-hidden="true" />Open workspace</button
				><button type="button" class="button" disabled={busy} onclick={() => open('fork')}
					><Copy size={16} aria-hidden="true" />Fork a pack</button
				>
			</div>
			<p class="help">Forking makes an independent copy and preserves the original attribution.</p>
		</section>
	{:else}
		<details class="workspace-settings">
			<summary
				>Pack details <span
					>{edition} · {workspace.references.length}
					{workspace.references.length === 1 ? 'reference' : 'references'}</span
				></summary
			>
			<div class="metadata-fields">
				<label>Title<input disabled={busy} bind:value={title} maxlength="120" /></label><label
					>Creator<input disabled={busy} bind:value={author} maxlength="120" /></label
				><label
					>Edition<input disabled={busy} bind:value={edition} spellcheck="false" /><small
						>Updated automatically after changes to an exported pack.</small
					></label
				><button
					type="button"
					class="button"
					disabled={busy}
					onclick={() =>
						task(async () => {
							await saveWorkspace();
							message = 'Pack details saved.';
						})}>Save details</button
				>
			</div>
			<p class="workspace-path">{directory}</p>
			<div class="workspace-actions">
				<button
					type="button"
					class="button button--quiet"
					disabled={busy || !metadataDirty}
					onclick={() => {
						if (workspace) {
							title = workspace.title;
							author = workspace.author;
							edition = workspace.version;
							error = '';
						}
					}}>Discard detail changes</button
				>
				<button type="button" class="button" disabled={busy} onclick={reloadWorkspace}
					>Reload workspace</button
				><button type="button" class="button" disabled={busy} onclick={() => open('open')}
					>Open another workspace</button
				><button type="button" class="button" disabled={busy} onclick={() => open('new')}
					>New workspace</button
				><button type="button" class="button" disabled={busy} onclick={() => open('fork')}
					>Fork a pack</button
				>
			</div>
		</details>
		<div class="editor-layout">
			<aside class="reference-sidebar">
				<div class="sidebar-heading">
					<h2>References</h2>
					<button type="button" class="button button--quiet" disabled={busy} onclick={newReference}
						><Plus size={16} aria-hidden="true" />Add</button
					>
				</div>
				{#if !workspace.references.length}<p class="help">
						Add the first reference, then save it to this workspace.
					</p>{/if}
				<ul>
					{#each workspace.references as reference (reference.id)}<li>
							<button
								type="button"
								class:active={draft?.id === reference.id}
								disabled={busy}
								onclick={() => openReference(reference)}
								><span>{reference.title}</span><small
									>{reference.kind} · revision {reference.revision}</small
								></button
							>
						</li>{/each}
				</ul>
			</aside>
			<div class="editor-main">
				<form
					class="reference-editor"
					aria-label="Reference editor"
					onsubmit={(event) => {
						event.preventDefault();
						void saveReference();
					}}
				>
					{#if draft}<fieldset disabled={busy}>
							<div class="editor-toolbar">
								<h2>
									{selected ? 'Edit reference' : 'New reference'}{#if dirty}<span class="unsaved"
											>Unsaved</span
										>{/if}
								</h2>
								<div>
									{#if selected}<button
											type="button"
											class="button button--quiet"
											disabled={busy}
											onclick={() => {
												confirmDelete = true;
											}}>Remove</button
										>{/if}<button
										type="button"
										class="button button--quiet"
										disabled={busy}
										onclick={discard}>Discard</button
									><button type="submit" class="button primary" disabled={busy}
										><Save size={16} aria-hidden="true" />Save reference</button
									>
								</div>
							</div>
							{#if confirmDelete}<div class="notice" role="alert">
									<p>
										Remove this reference from the workspace? Installed packs and learner notes stay
										in place.
									</p>
									<div class="workspace-actions">
										<button
											type="button"
											class="button"
											disabled={busy}
											onclick={() =>
												task(async () => {
													const id = draft!.id;
													await saveWorkspace(
														workspace!.references.filter((item) => item.id !== id),
													);
													draft = null;
													baseline = '';
													confirmDelete = false;
													message = 'Reference removed from the workspace.';
												})}>Remove reference</button
										><button
											type="button"
											class="button button--quiet"
											onclick={() => {
												confirmDelete = false;
											}}>Keep reference</button
										>
									</div>
								</div>{/if}
							<div class="reference-fields">
								<label class="wide"
									>Title<input
										bind:value={draft.title}
										required
										maxlength="160"
										placeholder="Corner light confirm"
									/></label
								>
								<div class="creator-choice">
									<ChoiceField
										id="creator-character"
										label="Character"
										options={characterOptions}
										value={draft.characterId}
										onchange={(value) => {
											if (draft) draft.characterId = value;
										}}
									/>
								</div>
								<div class="creator-choice">
									<ChoiceField
										id="creator-kind"
										label="Reference type"
										options={[
											{ value: 'combo', label: 'Combo' },
											{ value: 'setup', label: 'Setup' },
											{ value: 'response', label: 'Response' },
										]}
										value={draft.kind}
										onchange={(value) => {
											if (draft) draft.kind = value as Reference['kind'];
										}}
									/>
								</div>
								<label class="wide"
									>Quick note<textarea
										bind:value={draft.summary}
										rows="2"
										placeholder="When to use this route, or what to watch for."
										required></textarea></label
								><label
									>Starting situations<input
										bind:value={draft.situations}
										placeholder="Punish Counter, Corner"
									/><small>Separate with commas.</small></label
								><label
									>Outcomes<input
										bind:value={draft.outcomes}
										placeholder="Corner carry, Knockdown"
									/></label
								>
							</div>
							<section class="editor-section">
								<div class="section-heading">
									<h3>Inputs</h3>
									<button
										type="button"
										class="button button--quiet"
										disabled={busy}
										onclick={() => {
											if (draft)
												draft.steps = [
													...draft.steps,
													{ id: `step-${crypto.randomUUID()}`, notation: '', label: '' },
												];
										}}><Plus size={15} aria-hidden="true" />Add step</button
									>
								</div>
								<div class="input-labels" aria-hidden="true">
									<span>Notation</span><span>Move / action</span>
								</div>
								{#each draft.steps as step, index (step.id)}<div class="input-row">
										<input
											aria-label={`Step ${index + 1} notation`}
											bind:value={step.notation}
											placeholder="2LP"
											spellcheck="false"
										/><input
											aria-label={`Step ${index + 1} move or action`}
											bind:value={step.label}
											placeholder="Crouching light punch"
										/><button
											type="button"
											class="icon-button"
											disabled={busy || draft.steps.length === 1}
											aria-label={`Remove step ${index + 1}`}
											onclick={() => {
												if (draft) draft.steps = draft.steps.filter((item) => item.id !== step.id);
											}}><X size={16} aria-hidden="true" /></button
										>
									</div>{/each}{#if sequence.length}<div class="sequence-preview">
										<InputSequence
											reference={{
												id: draft.id,
												inputs: sequence,
												participants: [{ id: 'main', characterId: draft.characterId }],
											}}
											{game}
										/>
									</div>{/if}
							</section>
							<section class="editor-section">
								<div class="section-heading">
									<div>
										<h3>Recording</h3>
										<p class="help">Choose a short, already-trimmed MP4 or WebM clip.</p>
									</div>
									<button type="button" class="button" disabled={busy} onclick={chooseClip}
										><FolderOpen size={16} aria-hidden="true" />{draft.clip
											? 'Replace clip'
											: 'Choose clip'}</button
									>
								</div>
								{#if draft.clip}<video
										bind:this={video}
										src={media(draft.clip)}
										controls
										playsinline
										preload="metadata"
										aria-label="Reference recording"
										onplay={() => {
											showPreview = false;
										}}
										onloadedmetadata={() => {
											if (
												draft &&
												draft.duration === 0 &&
												video &&
												Number.isFinite(video.duration) &&
												video.duration > 0
											)
												draft.duration = video.duration;
										}}
										onerror={() => {
											error =
												'This clip could not be played. Reopen the workspace or choose a supported MP4/WebM recording.';
										}}><track kind="captions" /></video
									>
									<div class="capture-row">
										<span class="help">Pause at an important moment, then capture it.</span><button
											type="button"
											class="button"
											disabled={busy}
											onclick={captureMoment}
											><Camera size={16} aria-hidden="true" />Capture moment</button
										>
									</div>{/if}
								<label class="review-check audio-check"
									><input type="checkbox" bind:checked={draft.hasAudio} />Clip includes audio</label
								>
								{#if draft.frames.length}<ul class="moment-list">
										{#each draft.frames as frame, index (frame.id)}<li>
												<img
													src={media(frame.src)}
													alt={frame.alt}
													width="240"
													height="135"
													loading="lazy"
												/><label
													>Moment {index + 1} · {frame.at.toFixed(2)}s<input
														bind:value={frame.label}
														oninput={(event) => {
															frame.alt = event.currentTarget.value;
														}}
													/></label
												><button
													type="button"
													class="icon-button"
													disabled={busy}
													aria-label={`Remove moment ${index + 1}`}
													onclick={() => {
														if (draft) {
															draft.frames = draft.frames.filter((item) => item.id !== frame.id);
															if (draft.poster === frame.src)
																draft.poster = draft.frames[0]?.src ?? '';
														}
													}}><Trash2 size={16} aria-hidden="true" /></button
												>
											</li>{/each}
									</ul>{/if}
							</section>
							<details class="editor-section">
								<summary>Source and review</summary>
								<div class="reference-fields">
									<div class="creator-choice">
										<ChoiceField
											id="creator-source"
											label="Recording source"
											value={draft.sourceKind}
											options={[
												{ value: 'recording', label: 'Own recording' },
												{ value: 'youtube', label: 'YouTube excerpt' },
											]}
											onchange={(value) => {
												if (draft) {
													Object.assign(
														draft,
														sourceFieldsForKind(draft, value as 'recording' | 'youtube', author),
													);
													draft.reviewed = false;
												}
											}}
										/>
									</div>
									<label>Creator<input bind:value={draft.sourceCreator} /></label><label
										class="wide"
										>{draft.sourceKind === 'youtube'
											? 'Original video title'
											: 'Source title'}<input
											bind:value={draft.sourceTitle}
											placeholder={draft.sourceKind === 'youtube'
												? 'Title as published on YouTube'
												: draft.title}
										/></label
									><label class="wide"
										>{draft.sourceKind === 'youtube'
											? 'YouTube URL'
											: 'Source link (optional)'}<input
											type="url"
											bind:value={draft.sourceUrl}
											oninput={() => {
												if (draft) draft.reviewed = false;
											}}
											placeholder={draft.sourceKind === 'youtube'
												? 'https://www.youtube.com/watch?v=…'
												: 'https://…'}
											spellcheck="false"
										/></label
									><label
										>Excerpt start (seconds)<input
											type="number"
											min="0"
											step="0.001"
											bind:value={draft.sourceStart}
										/></label
									><label>Game version (optional)<input bind:value={draft.gameVersion} /></label
									><label class="wide review-check"
										><input type="checkbox" bind:checked={draft.reviewed} />I checked the inputs and
										notes against this recording.</label
									>
								</div>
								<p class="help">
									Source review does not establish that a route works on the current game patch.
								</p>
							</details>
							<details class="editor-section">
								<summary>Conditions and execution notes</summary>
								<div class="reference-fields">
									<label
										>Conditions<textarea
											rows="3"
											bind:value={draft.conditions}
											placeholder="One condition per line"></textarea></label
									><label
										>Execution notes<textarea
											rows="3"
											bind:value={draft.notes}
											placeholder="One note per line"></textarea></label
									>
								</div>
							</details>
							<div class="editor-bottom">
								<button type="submit" class="button primary" disabled={busy}
									><Save size={16} aria-hidden="true" />Save reference</button
								><button
									type="button"
									class="button"
									disabled={busy || dirty || !selected}
									onclick={() => {
										video?.pause();
										showPreview = !showPreview;
									}}
									><Play size={16} aria-hidden="true" />{showPreview
										? 'Hide preview'
										: 'Preview saved reference'}</button
								>
							</div>
						</fieldset>
					{:else}<div class="empty-reference">
							<h2>Select or add a reference</h2>
							<button type="button" class="button" onclick={newReference}
								><Plus size={16} aria-hidden="true" />Add reference</button
							>
						</div>{/if}
				</form>
				{#if showPreview && previewReference}
					<section class="practice-preview" aria-label="Saved reference preview">
						<header>
							<h2>{previewReference.title}</h2>
							<button
								type="button"
								class="button button--quiet"
								onclick={() => {
									showPreview = false;
								}}>Close preview</button
							>
						</header>
						<p>{previewReference.summary}</p>
						<div class="sequence-preview">
							<InputSequence reference={previewReference} {game} />
						</div>
						<ReferenceMedia
							reference={previewReference}
							preferences={previewPreferences}
							onpreferencechange={(patch) => {
								previewPreferences = { ...previewPreferences, ...patch };
							}}
						/>
						<SourceDetails reference={previewReference} />
					</section>
				{/if}
			</div>
		</div>
		{#if validation}<section class="validation" aria-label="Pack validation">
				<h2>{validation.valid ? 'Pack is ready to export' : 'Workspace needs attention'}</h2>
				{#each [...validation.errors, ...validation.warnings] as issue}<p>{issue}</p>{/each}
			</section>{/if}
	{/if}
</main>
<AppFooter />

<style>
	.creator-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		min-height: 64px;
		padding: 12px max(24px, calc((100vw - 1280px) / 2));
		background: var(--panel);
		color: var(--panel-ink);
	}
	.creator-brand {
		display: flex;
		align-items: center;
		gap: 12px;
		color: inherit;
		text-decoration: none;
		font-family: var(--display);
		font-size: 22px;
		font-weight: 700;
	}
	.creator-brand :global(svg) {
		width: 32px;
		height: 40px;
		color: var(--panel-accent);
	}
	.back {
		background: transparent;
		color: var(--panel-ink);
		border-color: var(--panel-muted);
	}
	.creator-page {
		max-width: 1280px;
		margin: 0 auto;
		padding: 32px 24px 64px;
		min-height: calc(100dvh - 140px);
	}
	.creator-heading,
	.section-heading,
	.sidebar-heading,
	.editor-toolbar,
	.capture-row,
	.editor-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	.creator-heading {
		margin-bottom: 28px;
	}
	h1 {
		font-family: var(--display);
		font-size: 40px;
		line-height: 1.1;
		margin: 0 0 8px;
	}
	h2 {
		font-size: 19px;
		margin: 0;
	}
	h3 {
		font-size: 16px;
		margin: 0;
	}
	p {
		margin: 6px 0 12px;
	}
	.creator-heading p,
	.help,
	small {
		color: var(--muted);
	}
	.help,
	small {
		font-size: 12px;
		line-height: 1.6;
	}
	small {
		display: block;
		margin-top: 4px;
	}
	.primary,
	.export-button {
		background: var(--ink);
		color: var(--surface);
		border-color: var(--ink);
	}
	.notice {
		padding: 14px 18px;
		background: var(--error-bg);
		color: var(--error-text);
		border: 1px solid var(--error-border);
		border-radius: 4px;
		margin-bottom: 20px;
		overflow-wrap: anywhere;
	}
	.success {
		background: var(--selected);
		color: var(--ink);
		border-color: var(--line);
	}
	.start-workspace,
	.desktop-required {
		max-width: 780px;
		background: var(--surface);
		padding: 28px;
		border: 1px solid var(--line);
		border-radius: 6px;
	}
	.start-workspace h2 {
		margin-bottom: 12px;
	}
	.start-fields,
	.reference-fields,
	.metadata-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
	}
	.start-fields {
		margin: 24px 0;
	}
	.workspace-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	label {
		display: block;
		font-size: 13px;
		font-weight: 600;
	}
	input:not([type='checkbox']),
	textarea {
		display: block;
		width: 100%;
		margin-top: 7px;
		padding: 10px 12px;
		min-height: 42px;
		font: inherit;
		font-weight: 400;
		font-size: 16px;
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	textarea {
		resize: vertical;
		min-height: 76px;
	}
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.wide {
		grid-column: 1/-1;
	}
	.workspace-settings {
		padding: 18px 0;
		margin-bottom: 24px;
		border-block: 1px solid var(--line);
	}
	summary {
		cursor: pointer;
		font-weight: 600;
		min-height: 32px;
	}
	summary span {
		font-weight: 400;
		color: var(--muted);
		margin-left: 16px;
	}
	.metadata-fields {
		grid-template-columns: 2fr 1fr 1fr auto;
		margin-top: 20px;
		align-items: start;
	}
	.metadata-fields button {
		margin-top: 27px;
	}
	.workspace-path {
		font-size: 12px;
		color: var(--muted);
		overflow-wrap: anywhere;
		margin-top: 16px;
	}
	.editor-layout {
		display: grid;
		grid-template-columns: 230px minmax(0, 1fr);
		gap: 28px;
		align-items: start;
	}
	.reference-sidebar {
		position: sticky;
		top: 20px;
		max-height: calc(100dvh - 40px);
		overflow: auto;
	}
	.sidebar-heading {
		margin-bottom: 12px;
	}
	.reference-sidebar ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.reference-sidebar li {
		margin-bottom: 4px;
	}
	.reference-sidebar li button {
		display: block;
		text-align: left;
		width: 100%;
		padding: 12px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: var(--ink);
		line-height: 1.4;
	}
	.reference-sidebar li button:hover {
		background: var(--soft);
	}
	.reference-sidebar li button.active {
		background: var(--selected);
		font-weight: 600;
	}
	.reference-sidebar li small {
		font-weight: 400;
	}
	.editor-main {
		min-width: 0;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	.reference-editor {
		min-width: 0;
		padding: 26px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 6px;
	}
	.editor-toolbar {
		margin-bottom: 26px;
	}
	.editor-toolbar > div {
		display: flex;
		gap: 8px;
	}
	.unsaved {
		font-family: 'DM Sans', sans-serif;
		font-size: 11px;
		font-weight: 400;
		color: var(--accent);
		margin-left: 10px;
	}
	.editor-section {
		margin-top: 26px;
		padding-top: 22px;
		border-top: 1px solid var(--line);
	}
	.section-heading {
		margin-bottom: 14px;
	}
	.input-labels {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 10px;
		font-size: 12px;
		color: var(--muted);
	}
	.input-row {
		display: grid;
		grid-template-columns: 120px 1fr 36px;
		gap: 10px;
		align-items: center;
		margin-top: 8px;
	}
	.input-row input {
		margin: 0;
	}
	.input-row input:first-child {
		font-family: monospace;
	}
	.sequence-preview {
		margin-top: 18px;
		padding: 18px;
		background: var(--panel);
		border-radius: 4px;
		overflow-x: auto;
	}
	video {
		display: block;
		width: 100%;
		aspect-ratio: 16/9;
		background: #111;
		max-height: 480px;
		border-radius: 4px;
	}
	.capture-row {
		margin-top: 12px;
	}
	.capture-row span {
		max-width: 40ch;
	}
	.moment-list {
		list-style: none;
		padding: 0;
		margin: 18px 0 0;
	}
	.moment-list li {
		display: grid;
		grid-template-columns: 120px minmax(0, 1fr) 36px;
		align-items: center;
		gap: 14px;
		padding: 12px 0;
		border-top: 1px solid var(--line);
	}
	.moment-list img {
		width: 120px;
		height: auto;
		aspect-ratio: 16/9;
		object-fit: cover;
		border-radius: 3px;
	}
	.moment-list input {
		margin-top: 5px;
	}
	.audio-check {
		margin-top: 14px;
	}
	.review-check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: 400;
	}
	.review-check input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}
	.editor-section > .reference-fields {
		margin-top: 18px;
	}
	.editor-bottom {
		justify-content: flex-start;
		margin-top: 28px;
		flex-wrap: wrap;
	}
	.practice-preview {
		margin-top: 26px;
		padding: 26px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 6px;
	}
	.practice-preview > header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}
	.practice-preview h2 {
		font-family: var(--display);
		font-size: 30px;
		margin-bottom: 18px;
	}
	.practice-preview .sequence-preview {
		margin-bottom: 24px;
	}
	.empty-reference {
		padding: 32px 0;
	}
	.empty-reference button {
		margin-top: 18px;
	}
	.validation {
		margin-top: 24px;
		padding: 22px;
		background: var(--soft);
		border-radius: 4px;
	}
	.validation p {
		font-size: 13px;
	}
	@media (max-width: 900px) {
		.editor-layout {
			grid-template-columns: 180px minmax(0, 1fr);
			gap: 16px;
		}
		.reference-editor {
			padding: 20px;
		}
		.editor-toolbar {
			align-items: flex-start;
			flex-direction: column;
		}
		.metadata-fields {
			grid-template-columns: 1fr 1fr;
		}
		.metadata-fields button {
			margin-top: 27px;
		}
	}
	@media (max-width: 640px) {
		.creator-page {
			padding: 24px 16px 48px;
		}
		.creator-top {
			padding: 12px 16px;
		}
		.creator-brand {
			font-size: 19px;
		}
		.creator-heading {
			align-items: flex-start;
			gap: 14px;
		}
		h1 {
			font-size: 34px;
		}
		.creator-heading p {
			max-width: 30ch;
			font-size: 13px;
		}
		.export-button {
			white-space: nowrap;
		}
		.start-workspace,
		.desktop-required {
			padding: 22px;
		}
		.start-fields,
		.reference-fields,
		.metadata-fields {
			grid-template-columns: 1fr;
		}
		.wide {
			grid-column: auto;
		}
		.metadata-fields button {
			margin-top: 0;
		}
		.editor-layout {
			grid-template-columns: 1fr;
		}
		.reference-sidebar {
			position: static;
			max-height: 220px;
		}
		.reference-sidebar ul {
			display: flex;
			gap: 6px;
			overflow-x: auto;
		}
		.reference-sidebar li {
			flex: 0 0 180px;
		}
		.reference-editor,
		.practice-preview {
			padding: 18px 14px;
		}
		.input-labels,
		.input-row {
			grid-template-columns: 84px minmax(0, 1fr) 32px;
		}
		.input-row {
			gap: 7px;
		}
		.input-labels {
			grid-template-columns: 84px 1fr;
		}
		.input-row input {
			padding: 9px 8px;
		}
		.moment-list li {
			grid-template-columns: 84px minmax(0, 1fr) 32px;
			gap: 10px;
		}
		.moment-list img {
			width: 84px;
		}
		.capture-row {
			align-items: flex-start;
			flex-direction: column;
		}
		.button {
			min-height: 44px;
		}
		.editor-toolbar > div {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
