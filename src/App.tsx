import React, { useState, useEffect, useRef } from 'react';

import { HardwareRevision, TuningConfig, TuningValue } from './types';
import { Language, translations } from './i18n';
import { COMPONENTS, countTuningChanges, getTuningDefaults } from './data';

import { Topbar, Sidebar, Step1Hardware, Step2Version, Step3Software, Step4Tuning, Step5Build } from './components';

const STEPS_COUNT = 5;

export default function App() {
	const [lang, setLang] = useState<Language>('en');
	const t = translations[lang];

	const [hardware, setHardware] = useState<HardwareRevision>('oled');
	const [hosVersion, setHosVersion] = useState<string>('19.0.1');

	const [selectedComponentIDs, setSelectedComponentIDs] = useState<string[]>(() =>
		COMPONENTS.filter(comp => comp.is_selected_by_default || comp.is_required).map(comp => comp.id)
	);

	const [tuning, setTuning] = useState<TuningConfig>(getTuningDefaults);
	const tuningChanges = countTuningChanges(tuning);

	const [activeStep, setActiveStep] = useState<number>(1);
	const contentRef = useRef<HTMLElement>(null);

	const [conflicts, setConflicts] = useState<string[]>([]);
	const [replaceAdvices, setReplaceAdvices] = useState<string[]>([]);

	useEffect(() => {
		const activeConflicts: string[] = [];
		const activeReplaces: string[] = [];

		if (selectedComponentIDs.includes('missioncontrol') && selectedComponentIDs.includes('ldn_mitm')) {
			activeConflicts.push(t.warnings.missionControlLDNMITM);
		}

		if (selectedComponentIDs.includes('dbi')) {
			if (selectedComponentIDs.includes('goldleaf') || selectedComponentIDs.includes('tinfoil')) {
				activeReplaces.push(t.warnings.dbiReplacesExtra);
			}
		}

		if (selectedComponentIDs.includes('sys_clk') && !selectedComponentIDs.includes('saltynx')) {
			activeReplaces.push(t.warnings.sysclkSaltynx);
		}

		setConflicts(activeConflicts);
		setReplaceAdvices(activeReplaces);
	}, [selectedComponentIDs, lang, t.warnings.dbiReplacesExtra, t.warnings.missionControlLDNMITM, t.warnings.sysclkSaltynx]);

	// Every step starts from the top
	useEffect(() => {
		contentRef.current?.scrollTo(0, 0);
	}, [activeStep]);

	// Escape and Enter act as B and A of the footer. A focused control keeps Enter for itself
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return;

			if (event.key == 'Escape') {
				setActiveStep(step => Math.max(step - 1, 1));
			} else if (event.key == 'Enter' && event.target == document.body) {
				setActiveStep(step => Math.min(step + 1, STEPS_COUNT));
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Size calculator
	const totalSize = COMPONENTS
		.filter(comp => selectedComponentIDs.includes(comp.id))
		.reduce((sum, current) => sum + current.size_kb * 1000, 0);

	// Handler for toggle components
	const toggleComponent = (id: string) => {
		const comp = COMPONENTS.find(c => c.id === id);
		if (!comp || comp.is_required) return; // Ignore mandatory entries

		if (selectedComponentIDs.includes(id)) {
			setSelectedComponentIDs(prev => prev.filter(item => item !== id));
		} else {
			setSelectedComponentIDs(prev => [...prev, id]);
		}
	};

	// Select/deselect all non-mandatory components
	const handleSelectAll = (select: boolean) => {
		if (select) {
			const allIds = COMPONENTS.map(c => c.id);
			setSelectedComponentIDs(allIds);
		} else {
			const requiredIds = COMPONENTS.filter(c => c.is_required).map(c => c.id);
			setSelectedComponentIDs(requiredIds);
		}
	};

	const setTuningOption = (group: string, option: string, value: TuningValue) => {
		setTuning(prev => ({ ...prev, [group]: { ...prev[group], [option]: value } }));
	};

	return (<>
		<Topbar
			lang={lang}
			setLang={setLang}
			t={t} />

		<Sidebar
			activeStep={activeStep}
			setActiveStep={setActiveStep}
			hardware={hardware}
			hosVersion={hosVersion}
			selectedComponentIDs={selectedComponentIDs}
			tuningChanges={tuningChanges}
			totalSize={totalSize}
			t={t} />

		<main ref={contentRef} className="content">
			{activeStep == 1 && (
				<Step1Hardware
					lang={lang}
					hardware={hardware}
					setHardware={setHardware}
					t={t} />)}

			{activeStep == 2 && (
				<Step2Version
					lang={lang}
					version={hosVersion}
					setVersion={setHosVersion}
					t={t} />
			)}

			{activeStep == 3 && (
				<Step3Software
					lang={lang}
					selectedComponentIDs={selectedComponentIDs}
					toggleComponent={toggleComponent}
					handleSelectAll={handleSelectAll}
					conflicts={conflicts}
					replacesAdvice={replaceAdvices}
					totalSize={totalSize}
					t={t} />
			)}

			{activeStep == 4 && (
				<Step4Tuning
					lang={lang}
					tuning={tuning}
					selectedComponentIDs={selectedComponentIDs}
					setTuningOption={setTuningOption}
					resetTuning={() => setTuning(getTuningDefaults())}
					t={t} />
			)}

			{activeStep == 5 && (
				<Step5Build
					lang={lang}
					hardware={hardware}
					hosVersion={hosVersion}
					selectedComponentIDs={selectedComponentIDs}
					tuning={tuning}
					tuningChanges={tuningChanges}
					totalSize={totalSize}
					t={t} />
			)}
		</main>

		<footer className="controls">
			{activeStep > 1 && (
				<button
					type="button"
					className="hint"
					onClick={() => setActiveStep(activeStep - 1)}>
					<span className="glyph">B</span>
					{t.wizard.back}
				</button>
			)}
			{activeStep < STEPS_COUNT ? (
				<button
					type="button"
					className="hint"
					onClick={() => setActiveStep(activeStep + 1)}>
					<span className="glyph">A</span>
					{t.wizard.next}
				</button>
			) : (
				<button
					type="button"
					className="hint"
					onClick={() => setActiveStep(1)}>
					<span className="glyph">X</span>
					{t.wizard.rebuild}
				</button>
			)}
		</footer>
	</>);
}
