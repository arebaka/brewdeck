import React, { useEffect, useRef } from 'react';

import { IssueLevel, StepId } from '../types';
import { Translation } from '../i18n';
import { formatSize } from '../utils';

export interface SidebarItem {
	step: StepId;
	value: string | number;
	alert?: IssueLevel;
}

interface SidebarProps {
	items: SidebarItem[];
	activeStep: StepId;
	setActiveStep: (step: StepId) => void;
	totalSize: number;
	t: Translation;
}

export function Sidebar({
	items,
	activeStep,
	setActiveStep,
	totalSize,
	t
}: SidebarProps) {
	const activeIndex = items.findIndex(item => item.step == activeStep);
	const activeRef = useRef<HTMLButtonElement>(null);

	// On phones the steps turn into a strip scrolled sideways, the active one stays in sight
	useEffect(() => {
		activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}, [activeStep]);

	return (
		<aside className="sidebar">
			<ul className="steps">
				{items.map((item, index) => (
					<li key={item.step}>
						<button
							ref={item.step == activeStep ? activeRef : undefined}
							className={`step ${item.step == activeStep ? 'active' : ''} ${index < activeIndex ? 'done' : ''}`}
							onClick={() => setActiveStep(item.step)}>
							<span className="label">
								{t.steps[item.step]}
							</span>
							{item.alert && item.alert != 'info' && (
								<span className={`alert ${item.alert}`}></span>
							)}
							<span className="value">
								{item.value}
							</span>
						</button>
					</li>
				))}
			</ul>

			<footer className="metrics">
				<ul>
					<li className="metric">
						<span className="key">
							{t.metrics.size}
						</span>
						<span className="value">
							{formatSize(totalSize)}
						</span>
					</li>
				</ul>
			</footer>
		</aside>
	);
}
