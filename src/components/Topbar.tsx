import React from 'react';

import { Language, Translation, translations } from '../i18n';

interface TopbarProps {
	lang: Language;
	setLang: (lang: Language) => void;
	t: Translation;
}

export function Topbar({
	lang,
	setLang,
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
				{t.subtitle}
			</p>
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
