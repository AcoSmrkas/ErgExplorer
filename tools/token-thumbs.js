// Makes the token icon thumbnails in app/images/tokens/thumbs: <tokenId>.webp at 64px for lists, which
// show icons at 18px, and <tokenId>-176.webp for the token page, which shows them at 88px. The originals
// are up to 3 MB. A token without one falls back to its full icon, so run this again after icons are
// added or changed, commit the result, and deploy.
//
// sharp stays out of package.json, because the deploy installs those on the VPS and only this needs it:
//   npm install --prefix /tmp/token-thumbs sharp
//   NODE_PATH=/tmp/token-thumbs/node_modules node tools/token-thumbs.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_API = 'https://api2.ergexplorer.com/tokens/getTokenIcons';
const ICONS_FILE = path.join(__dirname, '../app/scripts/common/token-icons.js');
const OUT_DIR = path.join(__dirname, '../app/images/tokens/thumbs');
const SIZES = [{size: 64, suffix: ''}, {size: 176, suffix: '-176'}];
const MAX_DOWNLOAD = 16 * 1024 * 1024;
const PARALLEL = 8;

// Same order as getIcon() in token-icons.js: the database wins over the hardcoded list
async function getIconUrls() {
	const icons = new Map();
	const hardcoded = /^tokenIcons\['([0-9a-f]{64})'\]\s*=\s*'([^']+)'/gm;

	for (const match of fs.readFileSync(ICONS_FILE, 'utf8').matchAll(hardcoded)) {
		icons.set(match[1], match[2]);
	}

	const response = await fetch(ICONS_API);
	if (!response.ok) {
		throw new Error(ICONS_API + ' answered ' + response.status);
	}

	for (const item of (await response.json()).items) {
		if (/^[0-9a-f]{64}$/.test(item.id) && item.iconurl) {
			icons.set(item.id, item.iconurl);
		}
	}

	return icons;
}

async function download(url) {
	if (!/^https?:\/\//.test(url)) {
		throw new Error('not a web address');
	}

	const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
	if (!response.ok) {
		throw new Error('answered ' + response.status);
	}

	const data = Buffer.from(await response.arrayBuffer());
	if (data.length > MAX_DOWNLOAD) {
		throw new Error('over ' + MAX_DOWNLOAD + ' bytes');
	}

	return data;
}

// An SVG is drawn at its own size, so a 24px one has to be drawn larger to stay sharp
async function open(data, size) {
	const {format, width, height} = await sharp(data).metadata();

	if (format != 'svg') {
		return sharp(data);
	}

	return sharp(data, {density: Math.min(2400, 72 * size / Math.max(width, height))});
}

async function makeThumbs(tokenId, url) {
	const data = await download(url);
	let bytes = 0;

	for (const {size, suffix} of SIZES) {
		const image = await open(data, size);
		const file = path.join(OUT_DIR, tokenId + suffix + '.webp');

		await image
			.resize(size, size, {fit: 'inside', withoutEnlargement: true})
			.webp({quality: 82, effort: 6})
			.toFile(file);

		bytes += fs.statSync(file).size;
	}

	return bytes;
}

async function main() {
	fs.mkdirSync(OUT_DIR, {recursive: true});

	const icons = await getIconUrls();
	const queue = [...icons];
	const failed = [];
	let made = 0;
	let bytes = 0;

	await Promise.all(Array.from({length: PARALLEL}, async () => {
		while (queue.length > 0) {
			const [tokenId, url] = queue.shift();

			try {
				const size = await makeThumbs(tokenId, url);

				bytes += size;
				made++;
			} catch (e) {
				failed.push(tokenId + '  ' + url + '  ' + e.message);
			}
		}
	}));

	console.log(made + ' of ' + icons.size + ' thumbnails, ' + Math.round(bytes / 1024) + ' KB');

	if (failed.length > 0) {
		console.log('\nThese keep their full icon:\n' + failed.join('\n'));
	}
}

main();
