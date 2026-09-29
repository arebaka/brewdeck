import React from 'react';

import { Issue } from '../../types';
import { Language, Translation } from '../../i18n';
import { HOS_VERSIONS, isHOSSupported } from '../../data';
import { activate } from '../../utils';
import { Issues } from '../Issues';

interface VersionProps {
	lang: Language;
	version: string;
	setVersion: (version: string) => void;
	issues: Issue[];
	applyFix: (fix: NonNullable<Issue['fix']>) => void;
	t: Translation;
}

export function Firmware({
	lang,
	version,
	setVersion,
	issues,
	applyFix,
	t
}: VersionProps) {
	return (<>
		<Issues
			issues={issues}
			applyFix={applyFix}
			t={t} />

		<ul className="grid grid3">
			{HOS_VERSIONS.map(v => (
				<li
					key={v.version}
					className={`item ${v.status} ${version == v.version ? 'active' : ''}`}
					tabIndex={0}
					onClick={() => setVersion(v.version)}
					onKeyDown={activate}>
					<header className="header">
						<h3 className="name">
							{v.version}
						</h3>
						<p className="date">
							{v.date.toLocaleDateString(lang)}
						</p>
						<p className={`badge ${v.status == 'stable' ? 'ok' : v.status == 'legacy' ? 'warning' : 'danger'}`}>
							{t.pages.firmware.status[v.status]}
						</p>
					</header>
					{!isHOSSupported(v.version) && (
						<p className="note">
							{t.pages.firmware.unsupported}
						</p>
					)}
				</li>
			))}
		</ul>
	</>);
}
