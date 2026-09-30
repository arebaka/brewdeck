import React from 'react';

import { HardwareRevision } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { HARDWARE } from '../../data';
import { activate, pixelsPerInch } from '../../utils';

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
	const info = HARDWARE.find(hw => hardware == hw.id)!;
	const [width, height] = info.dimensions;

	return (<>
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
							{hw.is_modchip_required ? t.pages.hardware.isModchipRequired : t.pages.hardware.isModchipNotRequired}
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

		{/* The console in its physical size, a console wider than the window scrolls */}
		<footer className="preview">
			<img
				src={`images/${info.image}`}
				alt={info.name}
				title={format(t.pages.hardware.size, { width: width.toLocaleString(lang), height: height.toLocaleString(lang) })}
				className="photo"
				style={{ width: `${width / 25.4 * pixelsPerInch()}px` }} />
		</footer>
	</>);
}
