import React from 'react';

import { Language, Translation } from '../../i18n';
import { HOS_VERSIONS } from '../../data';
import { activate } from '../../utils';

interface VersionProps {
	lang: Language;
	version: string;
	setVersion: (version: string) => void;
	t: Translation;
}

export function Firmware({
	lang,
	version,
	setVersion,
	t
}: VersionProps) {
	return (<>
		<header className="header">
			<h2 className="title">
				{t.step2.title}
			</h2>
			<p className="description">
				{t.step2.description}
			</p>
		</header>

		<ul className="grid grid3">
			{HOS_VERSIONS.map(v => (
				<li
					key={v.version}
					className={`item ${v.status} ${version == v.version ? 'active' : ''}`}
					tabIndex={0}
					onClick={() => setVersion(v.version)}
					onKeyDown={activate}>
					<header className="header">
						<p className="date">
							{v.date.toLocaleDateString(lang)}
						</p>
						<h3 className="name">
							{v.version}
						</h3>
						<p className={`badge ${v.status == 'stable' ? 'ok' : v.status == 'legacy' ? 'warning' : 'danger'}`}>
							{t.step2.status[v.status]}
						</p>
					</header>
				</li>
			))}
		</ul>
	</>);
}
