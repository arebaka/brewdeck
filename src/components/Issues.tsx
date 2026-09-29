import React from 'react';

import { Fix, Issue, StepId } from '../types';
import { Translation, format } from '../i18n';
import { COMPONENTS } from '../data';

interface IssuesProps {
	issues: Issue[];
	applyFix: (fix: Fix) => void;
	setStep?: (step: StepId) => void; // offers to open the step of every issue
	t: Translation;
}

// Names of the components a fix adds or removes
const names = (ids: string[]) => ids.map(id => COMPONENTS.find(comp => comp.id == id)?.name ?? id).join(', ');

export function Issues({
	issues,
	applyFix,
	setStep,
	t
}: IssuesProps) {
	const notice = (issue: Issue, index: number) => (
		<li key={index} className={`notice ${issue.level}`}>
			<span className="text">
				{format(t.issues[issue.code as keyof Translation['issues']], issue.params)}
			</span>
			{issue.fixes?.map((fix, index) => (
				<button
					key={index}
					className="fix"
					onClick={() => applyFix(fix)}>
					{fix.add
						? format(t.issues.add, { component: names(fix.add) })
						: format(t.issues.remove, { component: names(fix.remove ?? []) })}
				</button>
			))}
			{setStep && (
				<button
					className="fix"
					onClick={() => setStep(issue.step)}>
					{t.issues.go}: {t.steps[issue.step]}
				</button>
			)}
		</li>
	);

	const warnings = issues.filter(issue => issue.level != 'info');
	const advices = issues.filter(issue => issue.level == 'info');

	return (<>
		{warnings.length > 0 && (
			<ul className="warnings">
				{warnings.map(notice)}
			</ul>
		)}
		{advices.length > 0 && (
			<ul className="advices">
				{advices.map(notice)}
			</ul>
		)}
	</>);
}
