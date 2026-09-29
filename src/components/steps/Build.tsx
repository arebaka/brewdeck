import React, { useEffect, useMemo, useState } from 'react';

import { Issue, StepId, Uploads } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { GALLERY, HARDWARE } from '../../data';
import { build } from '../../build';
import { encodeImage } from '../../images';
import { highlight, renderMarkdown } from '../../markup';
import { AppState } from '../../url';
import { activate, downloadFile, formatSize } from '../../utils';
import { Issues } from '../Issues';

interface BuildProps {
	lang: Language;
	state: AppState;
	uploads: Uploads;
	totalSize: number;
	tuningChanges: number;
	issues: Issue[];
	applyFix: (fix: NonNullable<Issue['fix']>) => void;
	setStep: (step: StepId) => void;
	t: Translation;
}

interface Encoded {
	key: string;
	images?: Record<string, string>;
	error?: string;
}

// Windows PowerShell reads scripts without a byte order mark in the ANSI code page
const withBOM = (path: string, content: string) => path.endsWith('.ps1') ? `﻿${content}` : content;

export function Build({
	lang,
	state,
	uploads,
	totalSize,
	tuningChanges,
	issues,
	applyFix,
	setStep,
	t
}: BuildProps) {
	const { hardware, hosVersion, selectedComponentIDs, tuning, overclock, appearance } = state;
	const request = { hardware, hosVersion, selectedComponentIDs, tuning, overclock, appearance, lang, t };
	const result = useMemo(() => build(request), [hardware, hosVersion, selectedComponentIDs, tuning, overclock, appearance, lang, t]);

	// Images are converted in the background and embedded into the installers once ready
	const sources = result.assets.map(asset => ({
		path: asset.path,
		target: asset.target,
		source: asset.image == 'upload'
			? uploads[asset.key].url
			: GALLERY.find(item => item.target == asset.target && item.id == asset.image)!.file
	}));
	const sourcesKey = JSON.stringify(sources);
	const [encoded, setEncoded] = useState<Encoded>();

	useEffect(() => {
		let isCurrent = true;
		Promise.all(sources.map(async ({ path, target, source }) => [path, await encodeImage(source, target)]))
			.then(images => isCurrent && setEncoded({ key: sourcesKey, images: Object.fromEntries(images) }))
			.catch(error => isCurrent && setEncoded({ key: sourcesKey, error: String(error) }));
		return () => {
			isCurrent = false;
		};
	}, [sourcesKey]);

	const images = encoded?.key == sourcesKey ? encoded.images : undefined;
	const error = encoded?.key == sourcesKey ? encoded.error : undefined;

	// Installers to download carry the images, their preview only tells the size of every image
	const files = useMemo(() => images && build({ ...request, images }).files, [result, images]);
	const previews = useMemo(() => {
		const placeholders = Object.fromEntries(result.assets.map(asset => [
			asset.path,
			`# ${images ? format(t.pages.build.imageData, { size: formatSize(images[asset.path].length) }) : '…'}`
		]));
		const { files, configs } = build({ ...request, images: placeholders });
		return [...files.filter(file => file.path != 'README.md'), ...configs];
	}, [result, images]);

	const readme = result.files.find(file => file.path == 'README.md')!;
	const readmeHTML = useMemo(() => renderMarkdown(readme.content), [readme.content]);

	const [previewPath, setPreviewPath] = useState(previews[0].path);
	const preview = previews.find(file => file.path == previewPath) ?? previews[0];
	const previewHTML = useMemo(() => highlight(preview.content, preview.path), [preview]);

	// Manual components are listed with their links below
	const notices = issues.filter(issue => issue.code != 'manual');

	return (<>
		<ul className="rows summary">
			{[
				{ key: t.pages.build.summary.hardware, value: HARDWARE.find(hw => hw.id == hardware)?.name },
				{ key: t.pages.build.summary.firmware, value: hosVersion },
				{ key: t.pages.build.summary.components, value: selectedComponentIDs.length },
				{ key: t.pages.build.summary.size, value: formatSize(totalSize) },
				{ key: t.pages.build.summary.tuning, value: tuningChanges }
			].map(metric => (
				<li key={metric.key} className="row">
					<div className="line">
						<span className="name">
							{metric.key}
						</span>
						<span className="value">
							{metric.value}
						</span>
					</div>
				</li>
			))}
		</ul>

		{notices.length > 0 && (
			<section className="checks">
				<h3 className="title">
					{t.pages.build.issues}
				</h3>
				<Issues
					issues={notices}
					applyFix={applyFix}
					setStep={setStep}
					t={t} />
			</section>
		)}

		<section className="files">
			<h3 className="title">
				{t.pages.build.installer}
			</h3>
			<ul className="rows">
				{(files ?? result.files).map(file => (
					<li
						key={file.path}
						className={`row ${files ? 'interactive' : 'disabled'}`}
						tabIndex={files ? 0 : undefined}
						onClick={() => files && downloadFile(file.path, withBOM(file.path, file.content))}
						onKeyDown={activate}>
						<header className="line">
							<h4 className="name">
								{file.path}
							</h4>
							<p className="value on">
								{t.pages.build.download}
							</p>
						</header>
						<p className="description">
							{t.pages.build.files[file.path]} · {files ? formatSize(new TextEncoder().encode(file.content).length) : '…'}
						</p>
					</li>
				))}
			</ul>
			{error && (
				<p className="caption error">
					{t.pages.build.failed}: {error}
				</p>
			)}
		</section>

		{result.manual.length > 0 && (
			<section className="files">
				<h3 className="title">
					{t.pages.build.manual}
				</h3>
				<p className="caption">
					{t.pages.build.manualDescription}
				</p>
				<ul className="rows">
					{result.manual.map(comp => (
						<li key={comp.id} className="row">
							<div className="line">
								<span className="name">
									{comp.name}
								</span>
								<a
									className="value on"
									href={comp.sources.manual}
									target="_blank"
									rel="noreferrer">
									{comp.sources.manual}
								</a>
							</div>
						</li>
					))}
				</ul>
			</section>
		)}

		<section className="instructions">
			<h3 className="title">
				{t.pages.build.readme}
			</h3>
			<article
				className="readme"
				dangerouslySetInnerHTML={{ __html: readmeHTML }} />
		</section>

		<section className="generated">
			<h3 className="title">
				{t.pages.build.preview}
			</h3>
			<ul className="choices">
				{previews.map(file => (
					<li
						key={file.path}
						className={`choice ${preview.path == file.path ? 'active' : ''}`}
						tabIndex={0}
						onClick={() => setPreviewPath(file.path)}
						onKeyDown={activate}>
						{file.path}
					</li>
				))}
			</ul>
			<pre className="code">
				<code dangerouslySetInnerHTML={{ __html: previewHTML }} />
			</pre>
		</section>
	</>);
}
