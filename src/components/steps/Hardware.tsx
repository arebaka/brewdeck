import React from 'react';

import { HardwareRevision } from '../../types';
import { Language, Translation } from '../../i18n';
import { HARDWARE } from '../../data';
import { activate } from '../../utils';

interface HardwareProps {
	lang: Language;
	hardware: HardwareRevision;
	setHardware: (hw: HardwareRevision) => void;
	t: Translation;
}

export function Hardware({
	lang,
	hardware,
	setHardware,
	t
}: HardwareProps) {
	let image = HARDWARE.find(hw => hardware == hw.id)?.image;

	return (<>
		<header className="header">
			<h2 className="title">
				{t.step1.title}
			</h2>
			<p className="description">
				{t.step1.description}
			</p>
		</header>

		<ul className="grid grid2">
			{HARDWARE.map(hw => (
				<li
					key={hw.id}
					className={`item ${hardware == hw.id ? 'active' : ''}`}
					tabIndex={0}
					onClick={() => setHardware(hw.id)}
					onKeyDown={activate}>
					<header className="header">
						<h3 className="name">
							{hw.name}
						</h3>
						<p className={`badge ${hw.is_modchip_required ? 'danger' : 'ok'}`}>
							{hw.is_modchip_required ? t.step1.isModchipRequired : t.step1.isModchipNotRequired}
						</p>
					</header>
					<p className="description">
						{t.hardware[hw.id].description}
					</p>
					<p className="note">
						{t.hardware[hw.id].note}
					</p>
				</li>
			))}
		</ul>

		<footer className="preview-box">
			<img src={`images/${image}`} alt="" className="preview" />
		</footer>
	</>);
}
