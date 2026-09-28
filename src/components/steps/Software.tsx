import React from 'react';

import { ComponentCategory } from '../../types';
import { Language, Translation } from '../../i18n';
import { COMPONENTS } from '../../data';
import { activate } from '../../utils';

interface SoftwareProps {
	lang: Language;
	selectedComponentIDs: string[];
	toggleComponent: (id: string) => void;
	handleSelectAll: (select: boolean) => void;
	conflicts: string[];
	replacesAdvice: string[];
	totalSize: number;
	t: Translation;
}

export function Software({
	lang,
	selectedComponentIDs,
	toggleComponent,
	handleSelectAll,
	conflicts,
	replacesAdvice,
	totalSize,
	t
}: SoftwareProps) {
	return (<>
		<header className="header">
			<h2 className="title">
				{t.step3.title}
			</h2>
			<p className="description">
				{t.step3.description}
			</p>
		</header>

		<section className="batch">
			<button
				className="control"
				onClick={() => handleSelectAll(true)}>
				{t.step3.selectAll}
			</button>
			<button
				className="control"
				onClick={() => handleSelectAll(false)}>
				{t.step3.deselectAll}
			</button>
		</section>

		{conflicts.length > 0 && (
			<section className="warnings">
				{conflicts.map((conflict, index) => (
					<p key={index} className="warning">
						{conflict}
					</p>
				))}
			</section>
		)}
		{replacesAdvice.length > 0 && (
			<section className="advices">
				{replacesAdvice.map((advice, index) => (
					<p key={index} className="advice">
						{advice}
					</p>
				))}
			</section>
		)}

		<ul className="list">
			{(['base', 'payloads', 'sysmodules', 'homebrew', 'overlays'] as ComponentCategory[]).map(category => {
				const components = COMPONENTS.filter(comp => comp.category == category);

				return (
					<section key={category} className="components">
						<h3 className="title">
							{t.step3.categories[category]}
						</h3>
						<ul className={`grid ${components.length % 2 == 0 ? 'grid2' : 'grid3'}`}>
							{components.map(component => (
								<li
									key={component.id}
									className={`component
										${component.is_required ? 'required' : ''}
										${selectedComponentIDs.includes(component.id) ? 'active' : ''}`}
									tabIndex={0}
									onClick={() => toggleComponent(component.id)}
									onKeyDown={activate}>
									{(component.logo || component.is_required) && <div className="logo-box">
										{component.logo && (
											<img src={"logos/" + component.logo} alt="" className="logo" />
										)}
										{component.is_required && (
											<p className="badge required">
												{t.step3.requiredBadge}
											</p>
										)}
									</div>}
									<div className="info">
										<header className="header">
											<h4 className="name">
												{component.name}
											</h4>
											<p className="version">
												{component.version}
											</p>
										</header>
										<p className="description">
											{component.id in t.software && t.software[component.id].description}
										</p>
										<p className="details">
											{component.id in t.software && t.software[component.id].details}
										</p>
									</div>
								</li>
							))}
						</ul>
					</section>
				)
			})}
		</ul>
	</>);
}
