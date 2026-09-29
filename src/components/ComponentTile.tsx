import React from 'react';

import { ComponentInfo } from '../types';
import { Translation, format } from '../i18n';
import { COMPONENTS } from '../data';
import { activate, formatSize } from '../utils';

interface ComponentTileProps {
	component: ComponentInfo;
	isSelected: boolean;
	toggle: (id: string) => void;
	t: Translation;
}

// A component of the catalog with its logo, source and texts, selected by a click
export function ComponentTile({
	component,
	isSelected,
	toggle,
	t
}: ComponentTileProps) {
	const text = t.software[component.id];
	const parent = COMPONENTS.find(comp => comp.id == component.sources.bundled);
	// What ships with a required component cannot be switched off either
	const isRequired = component.is_required || !!parent?.is_required;

	return (
		<li
			className={`component
				${isRequired ? 'required' : ''}
				${parent ? 'bundled' : ''}
				${isSelected ? 'active' : ''}`}
			tabIndex={0}
			onClick={() => toggle(component.id)}
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
				{component.risky && (
					<p className="badge warning">
						{t.pages.software.riskyBadge}
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
}
