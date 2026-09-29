import React, { useMemo } from 'react';

import { Issue } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { CATEGORIES, COMPONENTS, PRESETS, matchingPreset } from '../../data';
import { activate, formatSize } from '../../utils';
import { Issues } from '../Issues';

interface SoftwareProps {
	lang: Language;
	selectedComponentIDs: string[];
	toggleComponent: (id: string) => void;
	applyPreset: (id: string) => void;
	issues: Issue[];
	applyFix: (fix: NonNullable<Issue['fix']>) => void;
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
							{components.map(component => {
								const text = t.software[component.id];
								const parent = COMPONENTS.find(comp => comp.id == component.sources.bundled);
								// What ships with a required component cannot be switched off either
								const isRequired = component.is_required || !!parent?.is_required;

								return (
									<li
										key={component.id}
										className={`component
											${isRequired ? 'required' : ''}
											${parent ? 'bundled' : ''}
											${selectedComponentIDs.includes(component.id) ? 'active' : ''}`}
										tabIndex={0}
										onClick={() => toggleComponent(component.id)}
										onKeyDown={activate}>
										<div className="logo-box">
											{component.logo ? (
												<img src={"logos/" + component.logo} alt="" className="logo" loading="lazy" />
											) : (
												<span className="logo monogram" aria-hidden="true">
													{component.name[0]}
												</span>
											)}
											{isRequired && (
												<p className="badge required">
													{t.pages.software.requiredBadge}
												</p>
											)}
											{component.deprecated && (
												<p className="badge warning">
													{t.pages.software.deprecatedBadge}
												</p>
											)}
										</div>
										<div className="info">
											<header className="header">
												<h4 className="name">
													{component.name}
												</h4>
												<p className="version">
													{component.version}
												</p>
											</header>
											<p className="source">
												{component.author} · {parent
													? format(t.pages.software.bundledBadge, { component: parent.name })
													: t.pages.software.sources[component.source]}
												{component.size > 0 && ` · ${formatSize(component.size)}`}
											</p>
											<p className="description">
												{text?.description}
											</p>
											<p className="details">
												{text?.details}
											</p>
											{text?.note && (
												<p className="note">
													{text.note}
												</p>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</section>
				);
			})}
		</ul>
	</>);
}
