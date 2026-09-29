import React, { useState } from 'react';

import { AppearanceConfig, IconEntry, ImageTarget, Uploads } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { GALLERY } from '../../data';
import { activate } from '../../utils';

interface AppearanceProps {
	lang: Language;
	appearance: AppearanceConfig;
	uploads: Uploads;
	setImage: (key: string, image?: string, blob?: Blob) => void;
	t: Translation;
}

const ICON_ENTRIES: IconEntry[] = ['emummc', 'sysmmc', 'stock'];

// Hekate centers the boot logo without scaling it up and fills the rest of the screen with its top-left pixel
function previewBootlogo(event: React.SyntheticEvent<HTMLImageElement>) {
	const image = event.currentTarget;
	const scale = Math.min(1, 1280 / image.naturalWidth, 720 / image.naturalHeight);
	image.style.width = `${image.naturalWidth * scale / 1280 * 100}%`;

	const context = document.createElement('canvas').getContext('2d')!;
	context.fillStyle = '#000';
	context.fillRect(0, 0, 1, 1);
	context.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
	const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
	image.parentElement!.style.background = `rgb(${red} ${green} ${blue})`;
}

export function Appearance({
	lang,
	appearance,
	uploads,
	setImage,
	t
}: AppearanceProps) {
	// Key of the last upload the browser could not decode
	const [failed, setFailed] = useState<string>();

	const upload = async (key: string, file: File) => {
		try {
			(await createImageBitmap(file)).close();
			setFailed(undefined);
			setImage(key, 'upload', file);
		} catch {
			setFailed(key);
		}
	};

	const gallery = (target: ImageTarget, key: string, value?: string) => (
		<Gallery
			target={target}
			value={value}
			uploaded={uploads[key]?.url}
			isFailed={failed == key}
			select={image => setImage(key, image)}
			upload={file => upload(key, file)}
			t={t} />
	);

	return (<>
		{(['bootlogo', 'background'] as const).map(target => (
			<section key={target} className="appearance">
				<header className="header">
					<h3 className="title">
						{t.pages.appearance.targets[target].title}
					</h3>
				</header>
				<p className="description">
					{t.pages.appearance.targets[target].description}
				</p>
				{gallery(target, target, appearance[target])}
			</section>
		))}

		<section className="appearance">
			<header className="header">
				<h3 className="title">
					{t.pages.appearance.targets.icon.title}
				</h3>
			</header>
			<p className="description">
				{t.pages.appearance.targets.icon.description}
			</p>
			{ICON_ENTRIES.map(entry => (
				<div key={entry} className="entry">
					<h4 className="name">
						{t.pages.appearance.icons[entry]}
					</h4>
					{gallery('icon', `icon.${entry}`, appearance.icons[entry])}
				</div>
			))}
		</section>

		<p className="note">
			{t.pages.appearance.more}
		</p>
	</>);
}

interface GalleryProps {
	target: ImageTarget;
	value?: string;
	uploaded?: string; // object URL of the upload
	isFailed: boolean;
	select: (image?: string) => void;
	upload: (file: File) => void;
	t: Translation;
}

function Gallery({
	target,
	value,
	uploaded,
	isFailed,
	select,
	upload,
	t
}: GalleryProps) {
	const picture = (id: string | undefined, content: React.ReactNode, title?: string) => (
		<li
			key={id ?? 'none'}
			className={`picture ${value == id ? 'active' : ''}`}
			title={title}
			tabIndex={0}
			onClick={() => select(id)}
			onKeyDown={activate}>
			<span className="frame">
				{content}
			</span>
		</li>
	);

	const image = (src: string, alt: string) => (
		<img
			src={src}
			alt={alt}
			loading="lazy"
			onLoad={target == 'bootlogo' ? previewBootlogo : undefined} />
	);

	return (
		<ul className={`gallery ${target}`}>
			{picture(undefined, t.pages.appearance.none)}
			{GALLERY
				.filter(item => item.target == target)
				.map(item => picture(
					item.id,
					image(item.file, item.id),
					format(t.pages.appearance.credit, { author: item.author, license: item.license })
				))}
			{uploaded && picture('upload', image(uploaded, t.pages.appearance.uploaded), t.pages.appearance.uploaded)}
			<li>
				<label
					className={`picture upload ${isFailed ? 'failed' : ''}`}
					tabIndex={0}
					onKeyDown={activate}>
					<input
						type="file"
						accept="image/*"
						hidden
						onChange={event => {
							const file = event.target.files?.[0];
							event.target.value = '';
							if (file) upload(file);
						}} />
					<span className="frame">
						{isFailed ? t.pages.appearance.invalid : t.pages.appearance.upload}
					</span>
				</label>
			</li>
		</ul>
	);
}
