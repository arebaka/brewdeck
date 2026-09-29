import React, { useMemo } from 'react';

import { Fix, Issue } from '../../types';
import { Language, Translation } from '../../i18n';
import { CATEGORIES, COMPONENTS, PRESETS, matchingPreset } from '../../data';
import { activate } from '../../utils';
import { Issues } from '../Issues';
import { ComponentTile } from '../ComponentTile';

interface SoftwareProps {
	lang: Language;
	selectedComponentIDs: string[];
	toggleComponent: (id: string) => void;
	applyPreset: (id: string) => void;
	issues: Issue[];
	applyFix: (fix: Fix) => void;
	t: Translation;
}

export function Software({
	lang,
	selectedComponentIDs,
	toggleComponent,
	applyPreset,
	issues,
	applyFix,
	t
}: SoftwareProps) {
	// A selection edited by hand matches no preset and shows up as a custom one
	const preset = useMemo(() => matchingPreset(selectedComponentIDs), [selectedComponentIDs]);

	return (<>
		<section className="batch">
			<ul className="choices">
				{PRESETS.map(item => (
					<li
						key={item.id}
						className={`choice ${preset?.id == item.id ? 'active' : ''}`}
						tabIndex={0}
						onClick={() => applyPreset(item.id)}
						onKeyDown={activate}>
						{t.pages.software.presets[item.id]}
					</li>
				))}
				{!preset && (
					<li className="choice active custom">
						{t.pages.software.custom}
					</li>
				)}
			</ul>
		</section>

		<Issues
			issues={issues}
			applyFix={applyFix}
			t={t} />

		<ul className="list">
			{CATEGORIES.map(category => {
				const components = COMPONENTS.filter(comp => comp.category == category);

				return (
					<section key={category} className="components">
						<h3 className="title">
							{t.pages.software.categories[category]}
						</h3>
						<ul className={`grid ${components.length % 2 == 0 ? 'grid2' : 'grid3'}`}>
							{components.map(component => (
								<ComponentTile
									key={component.id}
									component={component}
									isSelected={selectedComponentIDs.includes(component.id)}
									toggle={toggleComponent}
									t={t} />
							))}
						</ul>
					</section>
				);
			})}
		</ul>
	</>);
}
