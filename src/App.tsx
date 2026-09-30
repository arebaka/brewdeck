import React, { useState, useEffect, useMemo, useRef } from 'react';

import { STEP_IDS, Fix, GameProfile, IssueLevel, LaunchConfig, StepId, TuningStep, TuningValue, Uploads } from './types';
import { format, translations } from './i18n';
import { COMPONENTS, PRESETS, TUNING, getTuningDefaults, isRequirementMet, isTuningOptionChanged, launchEntries, presetSelection, resolveSelection } from './data';
import { AppState } from './state';
import { decodeState, encodeState } from './url';
import { validate } from './validation';

import { Topbar, Sidebar, SidebarItem, Hardware, Firmware, Software, Launch, Tuning, Overclock, Appearance, Build } from './components';

// Modules and overclock only appear when a selected component has something to set
function visibleSteps(selectedComponentIDs: string[]): StepId[] {
	return STEP_IDS.filter(step => {
		if (step == 'modules') {
			return TUNING.some(group => group.step == 'modules' && group.requires && isRequirementMet(group.requires, selectedComponentIDs));
		}
		if (step == 'overclock') {
			return selectedComponentIDs.includes('sys_clk');
		}
		return true;
	});
}

// Options changed on a step, counting only groups whose components are selected
function countChanges(state: AppState, step: TuningStep): number {
	return TUNING
		.filter(group => group.step == step && (!group.requires || isRequirementMet(group.requires, state.selectedComponentIDs)))
		.reduce((count, group) => count + group.options.filter(option => isTuningOptionChanged(group, option, state.tuning)).length, 0);
}

const LEVELS: IssueLevel[] = ['error', 'warning', 'info'];

export default function App() {
	const [state, setState] = useState<AppState>(() => decodeState(location.search));
	const [uploads, setUploads] = useState<Uploads>({});
	const update = (patch: Partial<AppState>) => setState(prev => ({ ...prev, ...patch }));

	const { lang, hardware, hosVersion, selectedComponentIDs, launch, tuning, overclock, appearance } = state;
	const t = translations[lang];

	const steps = visibleSteps(selectedComponentIDs);
	const step = steps.includes(state.step) ? state.step : steps[0];
	const index = steps.indexOf(step);
	const setStep = (step: StepId) => update({ step });

	const issues = useMemo(() => validate(state, t), [state, t]);
	const contentRef = useRef<HTMLElement>(null);

	// Every option lands in the address, so a link reproduces the build
	useEffect(() => {
		const query = encodeState({ ...state, step });
		history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
	}, [state, step]);

	// Hyphenation, quotes and the choice of fonts follow the language of the page
	useEffect(() => {
		document.documentElement.lang = lang;
	}, [lang]);

	// Every step starts from the top
	useEffect(() => {
		contentRef.current?.scrollTo(0, 0);
	}, [step]);

	// Escape and Enter act as B and A of the footer. A focused control keeps Enter for itself, fields keep both
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return;
			if (event.target instanceof Element && event.target.matches('input, select, textarea')) return;

			if (event.key == 'Escape' && index > 0) {
				setStep(steps[index - 1]);
			} else if (event.key == 'Enter' && event.target == document.body && index < steps.length - 1) {
				setStep(steps[index + 1]);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [steps.join(), index]);

	// Size calculator
	const totalSize = COMPONENTS
		.filter(comp => selectedComponentIDs.includes(comp.id))
		.reduce((sum, current) => sum + current.size, 0);

	// Adding a component brings its dependencies, removing it leaves them for the user to decide
	const toggleComponent = (id: string) => {
		const comp = COMPONENTS.find(c => c.id === id);
		if (!comp || comp.is_required || comp.sources.bundled) return; // Ignore mandatory and bundled entries

		update({
			selectedComponentIDs: selectedComponentIDs.includes(id)
				? resolveSelection(selectedComponentIDs.filter(item => item !== id), false)
				: resolveSelection([...selectedComponentIDs, id])
		});
	};

	const applyPreset = (id: string) => {
		update({ selectedComponentIDs: presetSelection(PRESETS.find(preset => preset.id == id)!) });
	};

	// A fix adds or removes components, only an added one brings its dependencies
	const applyFix = (fix: Fix) => {
		update({
			selectedComponentIDs: resolveSelection(
				[...selectedComponentIDs.filter(id => !fix.remove?.includes(id)), ...(fix.add ?? [])],
				!!fix.add
			)
		});
	};

	const setTuningOption = (group: string, option: string, value: TuningValue) => {
		setState(prev => ({ ...prev, tuning: { ...prev.tuning, [group]: { ...prev.tuning[group], [option]: value } } }));
	};

	// Every option of the step returns to its default
	const resetTuning = (step: TuningStep) => {
		const defaults = getTuningDefaults();
		update({ tuning: { ...tuning, ...Object.fromEntries(TUNING.filter(group => group.step == step).map(group => [group.id, defaults[group.id]])) } });
	};

	const setLaunch = (launch: LaunchConfig) => update({ launch });
	const setOverclock = (overclock: GameProfile[]) => update({ overclock });

	// `key` is bootlogo, background, logo.<entry> or icon.<entry>, `image` is a gallery id, `upload` or nothing for the default
	const setImage = (key: string, image?: string, blob?: Blob) => {
		if (blob) {
			setUploads(prev => {
				if (prev[key]) URL.revokeObjectURL(prev[key].url);
				return { ...prev, [key]: { blob, url: URL.createObjectURL(blob) } };
			});
		}
		const [target, entry] = key.split('.') as ['bootlogo' | 'background' | 'logo' | 'icon', string?];
		if (target == 'logo' || target == 'icon') {
			const images = { ...appearance[`${target}s`] };
			if (image) images[entry!] = image;
			else delete images[entry!];
			update({ appearance: { ...appearance, [`${target}s`]: images } });
		} else {
			update({ appearance: { ...appearance, [target]: image } });
		}
	};

	const stepIssues = (step: StepId) => issues.filter(issue => issue.step == step);
	// The most serious issue of a step marks it in the sidebar
	const worst = (step: StepId) => LEVELS.find(level => stepIssues(step).some(issue => issue.level == level));
	const images = [appearance.bootlogo, appearance.background, ...Object.values(appearance.logos), ...Object.values(appearance.icons)].filter(Boolean).length;

	const values: Record<StepId, string | number> = {
		hardware: t.hardware[hardware].name,
		firmware: hosVersion,
		software: selectedComponentIDs.length,
		launch: launchEntries(launch, selectedComponentIDs).length,
		system: countChanges(state, 'system') || '',
		security: countChanges(state, 'security') || '',
		modules: countChanges(state, 'modules') || '',
		overclock: overclock.length || '',
		appearance: images || '',
		build: ''
	};
	const sidebar: SidebarItem[] = steps.map(step => ({ step, value: values[step], alert: worst(step) }));

	const page = t.pages[step];

	return (<>
		<Topbar
			lang={lang}
			setLang={lang => update({ lang })}
			t={t} />

		<Sidebar
			items={sidebar}
			activeStep={step}
			setActiveStep={setStep}
			totalSize={totalSize}
			t={t} />

		<main ref={contentRef} className="content">
			<header className="header">
				<h2 className="title">
					{page.title}
				</h2>
				<p className="description">
					{page.description}
				</p>
			</header>

			{step == 'hardware' && (
				<Hardware
					lang={lang}
					hardware={hardware}
					setHardware={hardware => update({ hardware })}
					t={t} />
			)}

			{step == 'firmware' && (
				<Firmware
					lang={lang}
					version={hosVersion}
					setVersion={hosVersion => update({ hosVersion })}
					issues={stepIssues('firmware')}
					applyFix={applyFix}
					t={t} />
			)}

			{step == 'software' && (
				<Software
					lang={lang}
					selectedComponentIDs={selectedComponentIDs}
					toggleComponent={toggleComponent}
					applyPreset={applyPreset}
					issues={stepIssues('software')}
					applyFix={applyFix}
					t={t} />
			)}

			{step == 'launch' && (
				<Launch
					lang={lang}
					launch={launch}
					setLaunch={setLaunch}
					selectedComponentIDs={selectedComponentIDs}
					toggleComponent={toggleComponent}
					tuning={tuning}
					setTuningOption={setTuningOption}
					issues={stepIssues('launch')}
					applyFix={applyFix}
					t={t} />
			)}

			{(step == 'system' || step == 'security' || step == 'modules') && (
				<Tuning
					key={step}
					lang={lang}
					step={step}
					tuning={tuning}
					selectedComponentIDs={selectedComponentIDs}
					setTuningOption={setTuningOption}
					resetTuning={resetTuning}
					issues={stepIssues(step)}
					applyFix={applyFix}
					t={t} />
			)}

			{step == 'overclock' && (
				<Overclock
					lang={lang}
					hardware={hardware}
					overclock={overclock}
					setOverclock={setOverclock}
					tuning={tuning}
					selectedComponentIDs={selectedComponentIDs}
					setTuningOption={setTuningOption}
					resetTuning={resetTuning}
					issues={stepIssues('overclock')}
					applyFix={applyFix}
					t={t} />
			)}

			{step == 'appearance' && (
				<Appearance
					lang={lang}
					hardware={hardware}
					appearance={appearance}
					entries={launchEntries(launch, selectedComponentIDs)}
					themebg={String(tuning.nyx.themebg)}
					uploads={uploads}
					setImage={setImage}
					t={t} />
			)}

			{step == 'build' && (
				<Build
					lang={lang}
					state={state}
					uploads={uploads}
					totalSize={totalSize}
					tuningChanges={(['launch', 'system', 'security', 'modules'] as TuningStep[]).reduce((sum, step) => sum + countChanges(state, step), 0)}
					issues={issues}
					applyFix={applyFix}
					setStep={setStep}
					t={t} />
			)}
		</main>

		<footer className="controls">
			{index > 0 && (
				<button
					type="button"
					className="hint"
					onClick={() => setStep(steps[index - 1])}>
					<span className="glyph">B</span>
					{t.wizard.back}
				</button>
			)}
			{index < steps.length - 1 ? (
				<button
					type="button"
					className="hint"
					onClick={() => setStep(steps[index + 1])}>
					<span className="glyph">A</span>
					{t.wizard.next}
				</button>
			) : (
				<button
					type="button"
					className="hint"
					onClick={() => setStep(steps[0])}>
					<span className="glyph">X</span>
					{t.wizard.rebuild}
				</button>
			)}
		</footer>
	</>);
}
