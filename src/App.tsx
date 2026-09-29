import React, { useState, useEffect, useMemo, useRef } from 'react';

import { GameProfile, ImageTarget, Issue, IssueLevel, StepId, TuningStep, TuningValue, Uploads } from './types';
import { format, translations } from './i18n';
import { COMPONENTS, PRESETS, TUNING, getTuningDefaults, isRequirementMet, isTuningOptionChanged, presetSelection, resolveSelection } from './data';
import { AppState, STEP_IDS, decodeState, encodeState } from './url';
import { validate } from './validation';

import { Topbar, Sidebar, SidebarItem, Step1Hardware, Step2Version, Step3Software, Step4Tuning, StepOverclock, StepAppearance, Step5Build } from './components';

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

	const { lang, hardware, hosVersion, selectedComponentIDs, tuning, overclock, appearance } = state;
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

	const applyFix = (fix: NonNullable<Issue['fix']>) => {
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

	const resetTuning = (step: TuningStep) => {
		const defaults = getTuningDefaults();
		update({ tuning: { ...tuning, ...Object.fromEntries(TUNING.filter(group => group.step == step).map(group => [group.id, defaults[group.id]])) } });
	};

	const setOverclock = (overclock: GameProfile[]) => update({ overclock });

	// `key` is bootlogo, background or icon.<entry>, `image` is a gallery id, `upload` or nothing for the default
	const setImage = (key: string, image?: string, blob?: Blob) => {
		if (blob) {
			setUploads(prev => {
				if (prev[key]) URL.revokeObjectURL(prev[key].url);
				return { ...prev, [key]: { blob, url: URL.createObjectURL(blob) } };
			});
		}
		const [target, entry] = key.split('.') as [ImageTarget, string?];
		update({
			appearance: target == 'icon'
				? { ...appearance, icons: { ...appearance.icons, [entry!]: image } }
				: { ...appearance, [target]: image }
		});
	};

	const stepIssues = (step: StepId) => issues.filter(issue => issue.step == step);
	const worst = (step: StepId) => LEVELS.find(level => stepIssues(step).some(issue => issue.level == level));
	const images = [appearance.bootlogo, appearance.background, ...Object.values(appearance.icons)].filter(Boolean).length;

	const values: Record<StepId, string | number> = {
		hardware: t.hardware[hardware].name,
		firmware: hosVersion,
		software: selectedComponentIDs.length,
		system: countChanges(state, 'system') || '',
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
					{format(t.wizard.step, { n: index + 1 })} {page.title}
				</h2>
				<p className="description">
					{page.description}
				</p>
			</header>

			{step == 'hardware' && (
				<Step1Hardware
					lang={lang}
					hardware={hardware}
					setHardware={hardware => update({ hardware })}
					t={t} />
			)}

			{step == 'firmware' && (
				<Step2Version
					lang={lang}
					version={hosVersion}
					setVersion={hosVersion => update({ hosVersion })}
					issues={stepIssues('firmware')}
					applyFix={applyFix}
					t={t} />
			)}

			{step == 'software' && (
				<Step3Software
					lang={lang}
					selectedComponentIDs={selectedComponentIDs}
					toggleComponent={toggleComponent}
					applyPreset={applyPreset}
					issues={stepIssues('software')}
					applyFix={applyFix}
					t={t} />
			)}

			{(step == 'system' || step == 'modules') && (
				<Step4Tuning
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
				<StepOverclock
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
				<StepAppearance
					lang={lang}
					appearance={appearance}
					uploads={uploads}
					setImage={setImage}
					t={t} />
			)}

			{step == 'build' && (
				<Step5Build
					lang={lang}
					state={state}
					uploads={uploads}
					totalSize={totalSize}
					tuningChanges={countChanges(state, 'system') + countChanges(state, 'modules')}
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
