import { KeyboardEvent } from 'react';

// Enter and Space activate clickable tiles and rows, as A does on the console
export function activate(event: KeyboardEvent<HTMLElement>): void {
	if (event.key == 'Enter' || event.key == ' ') {
		event.preventDefault();
		event.currentTarget.click();
	}
}

// Size in decimal units, as downloads are measured
export function formatSize(bytes: number, decimals: number = 2): string {
	const k = 1000;
	if (bytes < k) {
		return bytes + ' B';
	}

	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function downloadFile(name: string, content: Blob | string): void {
	const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' });
	const uri = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = uri;
	link.download = name;
	link.click();

	// Firefox cancels the download if the URI is revoked synchronously
	setTimeout(() => URL.revokeObjectURL(uri));
}
