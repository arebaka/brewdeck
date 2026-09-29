import React, { useState } from 'react';

import { AppearanceConfig, ImageTarget, LaunchEntry, Uploads } from '../../types';
import { Language, Translation, format } from '../../i18n';
import { GALLERY } from '../../data';
import { activate } from '../../utils';

interface AppearanceProps {
	lang: Language;
	appearance: AppearanceConfig;
	entries: LaunchEntry[]; // entries of the Launch menu, each can have a boot logo and an icon
	uploads: Uploads;
	setImage: (key: string, image?: string, blob?: Blob) => void;
	t: Translation;
}

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
	entries,
	uploads,
	setImage,
	t
}: AppearanceProps) {
	// Key of the last upload the browser could not decode
	const [failed, setFailed] = useState<string>();
	// Entries the boot logo and the icon are picked for, an entry that left the menu gives the choice back
	const [logoEntry, setLogoEntry] = useState<string>();
	const [iconEntry, setIconEntry] = useState<string>();
	const logoFor = entries.find(entry => entry.id == logoEntry)?.id;
	const iconFor = entries.find(entry => entry.id == iconEntry)?.id ?? entries[0]?.id;

	const upload = async (key: string, file: File) => {
		try {
			(await createImageBitmap(file)).close();
			setFailed(undefined);
			setImage(key, 'upload', file);
		} catch {
			setFailed(key);
		}
	};

	const gallery = (target: ImageTarget, key: string, value?: string, none = t.pages.appearance.none) => (
		<Gallery
			key={key}
			target={target}
			value={value}
			none={none}
			uploaded={uploads[key]?.url}
			isFailed={failed == key}
			select={image => setImage(key, image)}
			upload={file => upload(key, file)}
			t={t} />
	);

	// Entries to pick from, the ones with a picture of their own are marked
	const chips = (items: { id?: string; name: string }[], active: string | undefined, images: Record<string, string>, select: (id?: string) => void) => (
		<ul className="choices">
			{items.map(item => (
				<li
					key={item.id ?? 'common'}
					className={`choice ${item.id == active ? 'active' : ''} ${item.id && images[item.id] ? 'set' : ''}`}
					tabIndex={0}
					onClick={() => select(item.id)}
					onKeyDown={activate}>
					{item.name}
				</li>
			))}
		</ul>
	);

	return (<>
		<section className="appearance">
			<header className="header">
				<h3 className="title">
					{t.pages.appearance.targets.bootlogo.title}
				</h3>
			</header>
			<p className="description">
				{t.pages.appearance.targets.bootlogo.description}
			</p>
			{entries.length > 0 && chips([{ name: t.pages.appearance.common }, ...entries], logoFor, appearance.logos, setLogoEntry)}
			{logoFor
				? gallery('bootlogo', `logo.${logoFor}`, appearance.logos[logoFor], t.pages.appearance.common)
				: gallery('bootlogo', 'bootlogo', appearance.bootlogo)}
		</section>

		<section className="appearance">
			<header className="header">
				<h3 className="title">
					{t.pages.appearance.targets.background.title}
				</h3>
			</header>
			<p className="description">
				{t.pages.appearance.targets.background.description}
			</p>
			{gallery('background', 'background', appearance.background)}
		</section>

		{iconFor && <section className="appearance">
			<header className="header">
				<h3 className="title">
					{t.pages.appearance.targets.icon.title}
				</h3>
			</header>
			<p className="description">
				{t.pages.appearance.targets.icon.description}
			</p>
			{chips(entries, iconFor, appearance.icons, setIconEntry)}
			{gallery('icon', `icon.${iconFor}`, appearance.icons[iconFor])}
		</section>}

		<p className="note">
			{t.pages.appearance.more}
		</p>
	</>);
}

interface GalleryProps {
	target: ImageTarget;
	value?: string;
	none: string; // caption of the tile without a picture
	uploaded?: string; // object URL of the upload
	isFailed: boolean;
	select: (image?: string) => void;
	upload: (file: File) => void;
	t: Translation;
}

// Pictures for one target: the default, the gallery, the upload and a tile to upload one
function Gallery({
	target,
	value,
	none,
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
			{picture(undefined, none)}
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
