import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import '@fontsource/biz-udpgothic/latin-400.css';
import '@fontsource/biz-udpgothic/latin-700.css';
import '@fontsource/noto-sans/cyrillic-400.css';
import '@fontsource/noto-sans/cyrillic-700.css';
import '@fontsource/biz-udgothic/latin-400.css';

import '@arelive/reset.css/reset.min.css';
import './styles/main.scss';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
