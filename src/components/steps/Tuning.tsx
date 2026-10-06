import React, { useEffect, useState } from 'react';

import { Fix, Issue, TuningConfig, TuningGroup, TuningOption, TuningStep, TuningValue } from '@/types';
import { Language, Translation } from '@i18n';
import { isTuningOptionActive, tuningGroups } from '@/data';
import { Platform } from '@/platforms';
import { activate } from '@/utils';
import { Issues } from '../Issues';
import { Buttons, isButtons } from '../Buttons';

type SetTuningOption = (group: string, option: string, value: TuningValue) => void;

interface TuningProps {
	lang: Language;
	platform: Platform;
	step: 'system' | 'security' | 'modules';
	tuning: TuningConfig;
	selectedComponentIDs: string[];
	setTuningOption: SetTuningOption;
	resetTuning: (step: TuningStep) => void;
	issues: Issue[];
	applyFix: (fix: Fix) => void;
	t: Translation;
}

export function Tuning({
	lang,
	platform,
	step,
	tuning,
	selectedComponentIDs,
	setTuningOption,
	resetTuning,
	issues,
	applyFix,
	t
}: TuningProps) {
	const groups = tuningGroups(platform.catalog.tuning, step, selectedComponentIDs);

	return (<>
		<section className="batch">
			<button
				className="control"
				onClick={() => resetTuning(step)}>
				{t.pages.system.reset}
			</button>
		</section>

		<Issues
			issues={issues}
			platform={platform}
			applyFix={applyFix}
			t={t} />

		{groups.map(group => (
			<TuningSection
				key={group.id}
				platform={platform}
				group={group}
				tuning={tuning}
				setTuningOption={setTuningOption}
				t={t} />
		))}

		{groups.length == 0 && (
			<p className="empty">
				{t.pages.modules.empty}
			</p>
		)}
	</>);
}

interface TuningSectionProps {
	platform: Platform;
	group: TuningGroup;
	tuning: TuningConfig;
	setTuningOption: SetTuningOption;
	t: Translation;
}

// One configuration file with its options
export function TuningSection({
	platform,
	group,
	tuning,
	setTuningOption,
	t
}: TuningSectionProps) {
	const text = t.tuning[platform.id][group.id];

	return (
		<section className="tuning">
			<header className="header">
				<h3 className="title">
					{text?.title ?? group.id}
				</h3>
				<p className="file">
					{group.file}
				</p>
			</header>
			<p className="description">
				{text?.description}
			</p>
			<ul className="rows">
				{group.options.map(option => (
					<Option
						key={option.id}
						platform={platform}
						group={group}
						option={option}
						tuning={tuning}
						isEnabled={isTuningOptionActive(group, option, tuning)}
						setValue={value => setTuningOption(group.id, option.id, value)}
						t={t} />
				))}
			</ul>
		</section>
	);
}

interface OptionProps {
	platform: Platform;
	group: TuningGroup;
	option: TuningOption;
	tuning: TuningConfig;
	isEnabled: boolean;
	setValue: (value: TuningValue) => void;
	t: Translation;
}

// An option as a row of the settings list: a toggle switches by a click, other types carry their control
function Option({
	platform,
	group,
	option,
	tuning,
	isEnabled,
	setValue,
	t
}: OptionProps) {
	// An option added to the data before its texts shows its key instead of breaking the page
	const text = t.tuning[platform.id][group.id]?.options[option.id] ?? { title: option.id, description: '' };
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
						{value ? t.pages.system.on : t.pages.system.off}
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
				{option.type == 'number' && (
					<NumberField
						value={value as number}
						min={option.min}
						max={option.max}
						disabled={!isEnabled}
						setValue={set} />
				)}
				{option.type == 'text' && (
					<input
						type={option.secret ? 'password' : 'text'}
						className="field"
						maxLength={option.maxLength}
						value={value as string}
						disabled={!isEnabled}
						autoComplete="off"
						spellCheck={false}
						onChange={event => set(event.target.value)} />
				)}
			</header>
			<p className="description">
				{text.description}
			</p>

			{option.type == 'select' && isButtons(option.values) && (
				<Buttons
					values={option.values.map(String)}
					selected={[String(value)]}
					isEnabled={isEnabled}
					toggle={set}
					t={t} />
			)}

			{option.type == 'multiselect' && isButtons(option.values) && (
				<Buttons
					values={option.values}
					selected={value as string[]}
					isEnabled={isEnabled}
					toggle={button => {
						const selected = value as string[];
						set(option.values.filter(item => item == button ? !selected.includes(button) : selected.includes(item)));
					}}
					t={t} />
			)}

			{option.type == 'select' && !isButtons(option.values) && (
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

			{option.type == 'multiselect' && !isButtons(option.values) && (
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

interface NumberFieldProps {
	value: number;
	min: number;
	max: number;
	disabled: boolean;
	setValue: (value: number) => void;
}

// The draft may leave the range while typing, only whole numbers within it reach the state
function NumberField({
	value,
	min,
	max,
	disabled,
	setValue
}: NumberFieldProps) {
	const [draft, setDraft] = useState(String(value));
	useEffect(() => setDraft(String(value)), [value]);

	return (
		<input
			type="number"
			className="field number"
			min={min}
			max={max}
			step={1}
			value={draft}
			disabled={disabled}
			onChange={event => {
				const number = Number(event.target.value);
				setDraft(event.target.value);
				if (event.target.value != '' && Number.isInteger(number) && number >= min && number <= max) {
					setValue(number);
				}
			}}
			onBlur={() => setDraft(String(value))} />
	);
}
