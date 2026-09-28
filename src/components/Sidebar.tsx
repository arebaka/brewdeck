import React from 'react';

import { HardwareRevision } from '../types';
import { Translation } from '../i18n';
import { formatSize } from '../utils';

interface SidebarProps {
	activeStep: number;
	setActiveStep: (step: number) => void;
	hardware: HardwareRevision;
	hosVersion: string;
	selectedComponentIDs: string[];
	tuningChanges: number;
	totalSize: number;
	t: Translation;
}

export function Sidebar({
	activeStep,
	setActiveStep,
	hardware,
	hosVersion,
	selectedComponentIDs,
	tuningChanges,
	totalSize,
	t
}: SidebarProps) {
	return (
		<aside className="sidebar">
			<ul className="steps">
				{[
					{ step: 1, label: t.steps.hardware, value: t.hardware[hardware].name },
					{ step: 2, label: t.steps.version, value: hosVersion },
					{ step: 3, label: t.steps.components, value: selectedComponentIDs.length },
					{ step: 4, label: t.steps.tuning, value: tuningChanges || '' },
					{ step: 5, label: t.steps.build, value: '' }
				].map(item => {
					const isActive = activeStep == item.step;
					const isDone = item.step < activeStep;

					return (
						<li key={item.step}>
							<button
								className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
								onClick={() => setActiveStep(item.step)}>
								<span className="label">
									{item.label}
								</span>
								<span className="value">
									{item.value}
								</span>
							</button>
						</li>
					);
				})}
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
