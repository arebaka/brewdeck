import React, { useMemo, useState } from 'react';

import { HardwareRevision, TuningConfig } from '../../types';
import { Language, Translation } from '../../i18n';
import { HARDWARE } from '../../data';
import { build, zipFiles } from '../../build';
import { activate, downloadFile, formatSize } from '../../utils';

interface BuildProps {
	lang: Language;
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuning: TuningConfig;
	tuningChanges: number;
	totalSize: number;
	t: Translation;
}

export function Build({
	lang,
	hardware,
	hosVersion,
	selectedComponentIDs,
	tuning,
	tuningChanges,
	totalSize,
	t
}: BuildProps) {
	const result = useMemo(
		() => build({ hardware, hosVersion, selectedComponentIDs, tuning, lang, t }),
		[hardware, hosVersion, selectedComponentIDs, tuning, lang, t]
	);
	const previews = [...result.files, ...result.configs];
	const [previewPath, setPreviewPath] = useState(previews[0].path);
	const preview = previews.find(file => file.path == previewPath) ?? previews[0];

	const downloadAll = async () =>
		downloadFile(`nx-builder-${hardware}-${hosVersion}.zip`, await zipFiles(result.files));

	return (<>
		<header className="header">
			<h2 className="title">
				{t.step5.title}
			</h2>
			<p className="description">
				{t.step5.description}
			</p>
		</header>

		<ul className="rows summary">
			{[
				{ key: t.step5.summary.hardware, value: HARDWARE.find(hw => hw.id == hardware)?.name },
				{ key: t.step5.summary.firmware, value: hosVersion },
				{ key: t.step5.summary.components, value: selectedComponentIDs.length },
				{ key: t.step5.summary.size, value: formatSize(totalSize) },
				{ key: t.step5.summary.tuning, value: tuningChanges }
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

		{result.manual.length > 0 && (
			<section className="warnings">
				<p className="heading">
					{t.step5.manual}
				</p>
				<p className="warning">
					{t.step5.manualDescription}: {result.manual.map(comp => comp.name).join(', ')}
				</p>
			</section>
		)}

		<section className="files">
			<h3 className="title">
				{t.step5.installer}
			</h3>
			<ul className="rows">
				{result.files.map(file => (
					<li
						key={file.path}
						className="row interactive"
						tabIndex={0}
						onClick={() => downloadFile(file.path, file.content)}
						onKeyDown={activate}>
						<header className="line">
							<h4 className="name">
								{file.path}
							</h4>
							<p className="value on">
								{t.step5.download}
							</p>
						</header>
						<p className="description">
							{t.step5.files[file.path]} · {formatSize(new TextEncoder().encode(file.content).length)}
						</p>
					</li>
				))}
			</ul>
			<button
				className="primary"
				onClick={downloadAll}>
				{t.step5.downloadAll}
			</button>
		</section>

		<section className="usage">
			<h3 className="title">
				{t.step5.usage}
			</h3>
			<p className="caption">
				{t.step5.files['install.sh']}
			</p>
			<pre className="code">bash install.sh /path/to/sd</pre>
			<p className="caption">
				{t.step5.files['install.ps1']}
			</p>
			<pre className="code">powershell -ExecutionPolicy Bypass -File install.ps1 -SdRoot E:\</pre>
			<p className="caption">
				{t.step5.usageNote}
			</p>
		</section>

		<section className="generated">
			<h3 className="title">
				{t.step5.preview}
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
			<pre className="code">{preview.content}</pre>
		</section>
	</>);
}
