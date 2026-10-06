import React, { useEffect, useMemo, useState } from 'react';

import { BuildState, Fix, Issue, StepId, Uploads } from '@/types';
import { Language, Translation, format } from '@i18n';
import { HARDWARE } from '@data';
import { Platform } from '@/platforms';
import { encodeImage } from '@/images';
import { highlight, renderMarkdown } from '@/markup';
import { activate, downloadFile, formatSize } from '@/utils';
import { Issues } from '../Issues';

interface BuildProps {
	lang: Language;
	platform: Platform;
	build: BuildState;
	uploads: Uploads;
	totalSize: number;
	tuningChanges: number;
	issues: Issue[];
	applyFix: (fix: Fix) => void;
	setStep: (step: StepId) => void;
	t: Translation;
}

interface Encoded {
	key: string;
	images?: Record<string, string>;
	error?: string;
}

// Windows PowerShell reads scripts without a byte order mark in the ANSI code page
const withBOM = (path: string, content: string) => path.endsWith('.ps1') ? `\uFEFF${content}` : content;

export function Build({
	lang,
	platform,
	build,
	uploads,
	totalSize,
	tuningChanges,
	issues,
	applyFix,
	setStep,
	t
}: BuildProps) {
	const { hardware, firmware, selectedComponentIDs } = build;
	const request = { ...build, lang, t };
	const result = useMemo(() => platform.build(request), [platform, build, lang, t]);

	// Images are converted in the background and embedded into the installers once ready
	const sources = result.assets.map(asset => ({
		path: asset.path,
		target: asset.target,
		source: asset.image == 'upload' ? uploads[asset.key].url : asset.file!
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
	const files = useMemo(() => images && platform.build({ ...request, images }).files, [result, images]);
	const previews = useMemo(() => {
		const placeholders = Object.fromEntries(result.assets.map(asset => [
			asset.path,
			`# ${images ? format(t.pages.build.imageData, { size: formatSize(images[asset.path].length) }) : '…'}`
		]));
		const { files, configs } = platform.build({ ...request, images: placeholders });
		return [...files.filter(file => file.path != 'README.md'), ...configs];
	}, [result, images]);

	const readme = result.files.find(file => file.path == 'README.md')!;
	const readmeHTML = useMemo(() => renderMarkdown(readme.content), [readme.content]);

	const [previewPath, setPreviewPath] = useState(previews[0].path);
	const preview = previews.find(file => file.path == previewPath) ?? previews[0];
	const previewHTML = useMemo(() => highlight(preview.content, preview.path), [preview]);

	// Manual components are listed with their links below
	const notices = issues.filter(issue => issue.code != 'manual');
	const summary = { ...t.pages.build.summary, ...t.platforms[platform.id].summary };

	return (<>
		<ul className="rows summary">
			{[
				{ key: summary.hardware, value: HARDWARE.find(hw => hw.id == hardware)?.name },
				{ key: summary.firmware, value: firmware },
				{ key: summary.components, value: selectedComponentIDs.length },
				{ key: summary.size, value: formatSize(totalSize) },
				{ key: summary.tuning, value: tuningChanges }
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
					platform={platform}
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
