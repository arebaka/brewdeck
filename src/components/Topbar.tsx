import React, { useEffect, useState } from 'react';

import { Language, Translation, translations } from '../i18n';

interface TopbarProps {
	lang: Language;
	setLang: (lang: Language) => void;
	subtitle: string; // what is built for the current platform
	t: Translation;
}

export function Topbar({
	lang,
	setLang,
	subtitle,
	t
}: TopbarProps) {
	return (
		<header className="topbar">
			<span className="logo" aria-hidden="true">
				<span></span>
				<span></span>
			</span>
			<h1 className="title">
				{t.title}
			</h1>
			<p className="subtitle">
				{subtitle}
			</p>
			<Clock lang={lang} />
			<nav className="lang-switch">
				{(Object.keys(translations) as Language[]).map(option => (
					<button
						key={option}
						className={`lang-option ${lang == option ? 'active' : ''}`}
						onClick={() => setLang(option)}>
						{translations[option].language}
					</button>
				))}
			</nav>
		</header>
	);
}

// Date and time in the corner, as the XMB shows them, for the themes that show the clock
function Clock({ lang }: { lang: Language }) {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 10_000);
		return () => clearInterval(timer);
	}, []);

	return (
		<time className="clock" dateTime={now.toISOString()}>
			{now.toLocaleString(lang, { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
		</time>
	);
}
