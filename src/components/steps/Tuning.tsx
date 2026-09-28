import React from 'react';

import { TuningConfig, TuningGroup, TuningOption, TuningValue } from '../../types';
import { Language, Translation } from '../../i18n';
import { COMPONENTS, TUNING, isTuningOptionActive } from '../../data';
import { activate } from '../../utils';

interface TuningProps {
	lang: Language;
	tuning: TuningConfig;
	selectedComponentIDs: string[];
	setTuningOption: (group: string, option: string, value: TuningValue) => void;
	resetTuning: () => void;
	t: Translation;
}

export function Tuning({
	lang,
	tuning,
	selectedComponentIDs,
	setTuningOption,
	resetTuning,
	t
}: TuningProps) {
	return (<>
		<header className="header">
			<h2 className="title">
				{t.step4.title}
			</h2>
			<p className="description">
				{t.step4.description}
			</p>
		</header>

		<section className="batch">
			<button
				className="control"
				onClick={resetTuning}>
				{t.step4.reset}
			</button>
		</section>

		{TUNING.map(group => {
			const isAvailable = !group.requires || selectedComponentIDs.includes(group.requires);

			return (
				<section key={group.id} className={`tuning ${isAvailable ? '' : 'disabled'}`}>
					<header className="header">
						<h3 className="title">
							{t.tuning[group.id].title}
						</h3>
						{!isAvailable && (
							<p className="badge">
								{t.step4.requires} {COMPONENTS.find(comp => comp.id == group.requires)?.name}
							</p>
						)}
						<p className="file">
							{group.file}
						</p>
					</header>
					<p className="description">
						{t.tuning[group.id].description}
					</p>
					<ul className="rows">
						{group.options.map(option => (
							<Option
								key={option.id}
								group={group}
								option={option}
								tuning={tuning}
								isEnabled={isAvailable && isTuningOptionActive(group, option, tuning)}
								setValue={value => setTuningOption(group.id, option.id, value)}
								t={t} />
						))}
					</ul>
				</section>
			);
		})}
	</>);
}

interface OptionProps {
	group: TuningGroup;
	option: TuningOption;
	tuning: TuningConfig;
	isEnabled: boolean;
	setValue: (value: TuningValue) => void;
	t: Translation;
}

function Option({
	group,
	option,
	tuning,
	isEnabled,
	setValue,
	t
}: OptionProps) {
	const text = t.tuning[group.id].options[option.id];
	const value = tuning[group.id][option.id];
	const label = (value: string | number) => text.values?.[value] ?? String(value);
	const set = (value: TuningValue) => isEnabled && setValue(value);

	if (option.type == 'toggle') {
		return (
			<li
				className={`row ${isEnabled ? 'interactive' : 'disabled'}`}
				tabIndex={isEnabled ? 0 : undefined}
				onClick={() => set(!value)}
				onKeyDown={activate}>
				<header className="line">
					<h4 className="name">
						{text.title}
					</h4>
					<p className={`value ${value ? 'on' : ''}`}>
						{value ? t.step4.on : t.step4.off}
					</p>
				</header>
				<p className="description">
					{text.description}
				</p>
			</li>
		);
	}

	return (
		<li className={`row ${isEnabled ? '' : 'disabled'}`}>
			<header className="line">
				<h4 className="name">
					{text.title}
				</h4>
				{option.type == 'hue' && (
					<p className="value">
						<span className="swatch" style={{ background: `hsl(${value}, 100%, 50%)` }}></span>
						{String(value)}
					</p>
				)}
				{(option.type == 'range' || option.type == 'color') && (
					<p className="value">
						{String(value)}
					</p>
				)}
			</header>
			<p className="description">
				{text.description}
			</p>

			{option.type == 'select' && (
				<ul className="choices">
					{option.values.map(v => (
						<li
							key={v}
							className={`choice ${value == v ? 'active' : ''}`}
							tabIndex={isEnabled ? 0 : undefined}
							onClick={() => set(v)}
							onKeyDown={activate}>
							{label(v)}
						</li>
					))}
				</ul>
			)}

			{option.type == 'multiselect' && (
				<ul className="choices">
					{option.values.map(v => {
						const selected = value as string[];
						const isSelected = selected.includes(v);

						return (
							<li
								key={v}
								className={`choice ${isSelected ? 'active' : ''}`}
								tabIndex={isEnabled ? 0 : undefined}
								onClick={() => set(option.values.filter(item => item == v ? !isSelected : selected.includes(item)))}
								onKeyDown={activate}>
								{label(v)}
							</li>
						);
					})}
				</ul>
			)}

			{option.type == 'range' && (
				<input
					type="range"
					className="range"
					style={{ '--fill': `${((value as number) - option.min) / (option.max - option.min) * 100}%` } as React.CSSProperties}
					min={option.min}
					max={option.max}
					step={option.step}
					value={value as number}
					disabled={!isEnabled}
					onChange={event => set(Number(event.target.value))} />
			)}

			{option.type == 'hue' && (
				<input
					type="range"
					className="range hue"
					min={0}
					max={359}
					value={value as number}
					disabled={!isEnabled}
					onChange={event => set(Number(event.target.value))} />
			)}

			{option.type == 'color' && (
				<input
					type="color"
					className="color"
					value={value as string}
					disabled={!isEnabled}
					onChange={event => set(event.target.value)} />
			)}
		</li>
	);
}
