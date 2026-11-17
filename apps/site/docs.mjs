import {cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Marked, Renderer} from 'marked';
import {zipSync} from 'fflate';
import {exportWorkspace, validateWorkspace} from '@hyper-chamber/authoring';

export const guidePages = [
	{file: 'index', title: 'Create Reference Packs'},
	{file: 'first-pack', title: 'Make Your First Pack'},
	{file: 'manage-packs', title: 'Manage Packs and Updates'},
	{file: 'ai', title: 'Use an AI Agent'},
	{file: 'format', title: 'Format and Tool Reference'},
];
const guideFiles = new Set(guidePages.map(page => `${page.file}.md`));
const publicDownloads = 'https://squid-quarters.github.io/hyper-chamber/create-packs/downloads/';
const escape = value =>
	String(value).replace(
		/[&<>"']/g,
		char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char],
	);

// These documents are source-controlled. Still render raw HTML as text and reject
// active/escaping links so a future documentation edit cannot add executable HTML.
export function guideHref(value) {
	let href = value;
	if (href.startsWith(publicDownloads)) href = `downloads/${href.slice(publicDownloads.length)}`;
	if (/^https:\/\//i.test(href)) {
		const url = new URL(href);
		if (url.username || url.password) throw new Error('Guide links cannot contain credentials.');
		return url.href;
	}
	if (
		Array.from(href).some(
			char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\',
		) ||
		/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href)
	)
		throw new Error(`Unsupported guide link: ${value}`);
	const decoded = decodeURIComponent(href.split(/[?#]/)[0]);
	if (decoded.split('/').includes('..') || decoded.includes('\\'))
		throw new Error(`Guide link leaves its directory: ${value}`);
	const [path, suffix = ''] = href.split(/(?=[?#])/s, 2);
	return `${guideFiles.has(path) ? path.replace(/\.md$/, '.html') : path}${suffix}`;
}
export function renderGuide(markdown) {
	const renderer = new Renderer();
	const headings = [];
	const counts = new Map();
	renderer.html = ({text}) => escape(text);
	renderer.heading = function ({tokens, depth}) {
		const text = this.parser.parseInline(tokens);
		const base =
			tokens
				.map(token => token.raw)
				.join('')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') || 'section';
		const count = (counts.get(base) ?? 0) + 1;
		counts.set(base, count);
		const id = `${base}${count > 1 ? `-${count}` : ''}`;
		headings.push({depth, id, text});
		return `<h${depth} id="${id}">${text}</h${depth}>\n`;
	};
	renderer.link = function ({href, title, tokens}) {
		return `<a href="${escape(guideHref(href))}"${title ? ` title="${escape(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
	};
	renderer.image = ({href, text}) =>
		`<img src="${escape(guideHref(href))}" alt="${escape(text)}" loading="lazy" />`;
	renderer.code = ({text}) =>
		`<pre tabindex="0" role="region" aria-label="Code example"><code>${escape(text)}</code></pre>\n`;
	const table = renderer.table;
	renderer.table = function (token) {
		return `<div class="guide-table" tabindex="0" role="region" aria-label="Tool commands">${table.call(this, token)}</div>`;
	};
	const html = new Marked({renderer, gfm: true}).parse(markdown);
	if (headings.filter(item => item.depth === 1).length !== 1)
		throw new Error('Each creator guide needs exactly one main heading.');
	return {html, headings};
}
const github =
	'<svg class="github-mark" width="18" height="18" fill="currentColor" aria-hidden="true" viewBox="0 0 16 16"><path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"/></svg>';

function guideDocument(page, rendered, index) {
	const previous = guidePages[index - 1];
	const next = guidePages[index + 1];
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="theme-color" content="#202822" />
<title>${escape(page.title)} · Hyper Chamber</title><meta name="description" content="Create, edit and maintain local Hyper Chamber reference packs. Manual editor and AI authoring guides for the 1.1.0 development build." />
<link rel="canonical" href="https://squid-quarters.github.io/hyper-chamber/create-packs/${page.file === 'index' ? '' : `${page.file}.html`}" /><link rel="icon" href="../assets/brand-mark.svg" type="image/svg+xml" /><link rel="stylesheet" href="../style.css" /></head>
<body class="guide-page"><a class="skip-link" href="#main">Skip to Content</a>
<header class="masthead"><div class="masthead-inner"><a class="brand" href="../" aria-label="Hyper Chamber home"><img src="../assets/brand-mark.svg" width="44" height="44" alt="" /><span>Hyper<br /><span>Chamber</span></span></a><nav aria-label="Project navigation"><a href="../#downloads">Downloads</a><a href="./" aria-current="true">Create Packs</a><a href="https://github.com/squid-quarters/hyper-chamber">${github}GitHub</a></nav></div></header>
<div class="guide-layout"><details class="guide-mobile-nav"><summary>Creator Guides <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><nav aria-label="Creator guides">${guidePages.map(item => `<a href="${item.file}.html"${item.file === page.file ? ' aria-current="page"' : ''}>${escape(item.title)}</a>`).join('')}</nav></details><aside class="guide-sidebar"><nav aria-label="Creator guides"><p>Pack Authoring</p>${guidePages.map(item => `<a href="${item.file}.html"${item.file === page.file ? ' aria-current="page"' : ''}>${escape(item.title)}</a>`).join('')}</nav><a class="guide-source" href="https://github.com/squid-quarters/hyper-chamber/blob/develop/docs/packs/${page.file}.md">View Guide on GitHub</a></aside>
<main id="main" class="guide-article">${rendered.html}<nav class="guide-pagination" aria-label="Adjacent guides">${previous ? `<a href="${previous.file}.html"><span>Previous</span>${escape(previous.title)}</a>` : '<span></span>'}${next ? `<a href="${next.file}.html"><span>Next</span>${escape(next.title)}</a>` : '<span></span>'}</nav></main></div>
<footer class="site-footer"><div class="footer-main"><a class="footer-brand" href="../"><img src="../assets/brand-mark.svg" width="28" height="28" alt="" /><span>Hyper Chamber</span></a><p>By Squid Quarters.</p><a class="github-link" href="https://github.com/squid-quarters/hyper-chamber">${github}GitHub</a></div></footer></body></html>\n`;
}
async function archiveFolder(directory, prefix) {
	const files = {};
	async function visit(root, relative = '') {
		for (const entry of await readdir(root, {withFileTypes: true})) {
			if (entry.name.startsWith('.')) continue;
			const path = `${relative}${entry.name}`;
			if (entry.isDirectory()) await visit(join(root, entry.name), `${path}/`);
			else if (entry.isFile())
				files[`${prefix}/${path}`] = new Uint8Array(await readFile(join(root, entry.name)));
			else throw new Error(`Download contains an unsupported entry: ${path}`);
		}
	}
	await visit(directory);
	return zipSync(files, {level: 6});
}
export async function buildGuides(repo, output) {
	const directory = join(output, 'create-packs');
	const downloads = join(directory, 'downloads');
	await mkdir(downloads, {recursive: true});
	for (const [index, page] of guidePages.entries()) {
		const markdown = await readFile(join(repo, 'docs/packs', `${page.file}.md`), 'utf8');
		await writeFile(
			join(directory, `${page.file}.html`),
			guideDocument(page, renderGuide(markdown), index),
		);
	}
	await cp(join(repo, 'docs/packs/sample'), join(directory, 'sample'), {recursive: true});
	await writeFile(
		join(downloads, 'hyper-chamber-packs.zip'),
		await archiveFolder(join(repo, 'skills/hyper-chamber-packs'), 'hyper-chamber-packs'),
	);
	await writeFile(
		join(downloads, 'sample-workspace.zip'),
		await archiveFolder(join(repo, 'docs/packs/sample'), 'sample-workspace'),
	);
	const temporary = await mkdtemp(join(tmpdir(), 'hc-site-sample-'));
	try {
		const workspace = join(temporary, 'workspace');
		await cp(join(repo, 'docs/packs/sample'), workspace, {recursive: true});
		const report = await validateWorkspace(workspace);
		if (!report.valid) throw new Error(`Invalid sample workspace: ${report.errors.join('; ')}`);
		await exportWorkspace(workspace, join(downloads, 'sample.hcpack'));
	} finally {
		await rm(temporary, {recursive: true, force: true});
	}
	return guidePages.map(page => join(directory, `${page.file}.html`));
}
