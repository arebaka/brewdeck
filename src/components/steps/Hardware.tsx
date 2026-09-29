import React from 'react';

import { HardwareRevision } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { HARDWARE } from '../../data';
import { activate } from '../../utils';

interface HardwareProps {
	lang: Language;
	hardware: HardwareRevision;
	setHardware: (hw: HardwareRevision) => void;
	t: Translation;
}

// Width in inches of Apple panels by their default scaled width in points
const APPLE_PANELS: Record<number, number> = {
	1440: 11.28, // MacBook Air 13" M1, MacBook Pro 13"
	1470: 11.43, // MacBook Air 13.6"
	1512: 11.91, // MacBook Pro 14"
	1536: 13.59, // MacBook Pro 16" 2019
	1710: 12.86, // MacBook Air 15"
	1728: 13.61, // MacBook Pro 16"
	2240: 20.55, // iMac 24"
	2560: 23.49, // iMac 27", Studio Display and other 27" displays
	3008: 27.6 // Pro Display XDR
};

// Browsers draw a CSS inch as 96 pixels on any screen and keep its physical size to themselves.
// Systems scale their pixels to a density of their own, so it is estimated from the platform:
// phones and tablets keep about 160 and 132 per inch, Retina Macs follow the width of their panel, other systems stay near 96
function pixelsPerInch(): number {
	const agent = navigator.userAgent;
	if (/iPad/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)) return 132;
	if (/Android|iPhone|Mobile/.test(agent)) return 160;
	if (/Macintosh/.test(agent) && devicePixelRatio >= 2) {
		// Points of the screen do not change with the browser zoom, CSS pixels do
		const zoom = devicePixelRatio / 2;
		const points = Math.round(screen.width * zoom);
		return (APPLE_PANELS[points] ? points / APPLE_PANELS[points] : 110) / zoom;
	}
	return 96;
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
