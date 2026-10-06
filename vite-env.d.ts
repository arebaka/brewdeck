/// <reference types="vite/client" />
/// <reference types="@modyfi/vite-plugin-yaml/modules" />

// Tables are rows of cells by the names of their columns, every cell is a string
declare module '*.tsv' {
	const content: Array<Record<string, string>>;
	export default content;
}
