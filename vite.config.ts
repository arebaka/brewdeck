import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		host: '127.0.0.1',
		port: 3000,
		open: true,
		cors: true,
		hmr: true,
	},
	build: {
		sourcemap: true,
		manifest: true,
		minify: 'oxc',
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [{ name: 'vendor', test: /node_modules/ }],
				},
			},
		},
	},
});
