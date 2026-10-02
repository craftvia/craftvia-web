import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositories = [
	{ name: 'craftvia-core-s-g031', id: 'core-s-g031' },
	{ name: 'craftvia-station-s', id: 'station-s' },
	{ name: 'craftvia-makercard-s', id: 'makercard-s' },
];

function requireSafePath(value, label) {
	if (typeof value !== 'string' || value === '' || value.startsWith('/') || value.includes('..') || value.includes('\\')) {
		throw new Error(`${label} must be a repository-relative POSIX path.`);
	}
	return value;
}

async function loadProduct(repository) {
	const repositoryName = repository.name;
	const localPath = resolve(projectRoot, '..', repositoryName, 'product.json');
	try {
		const text = await readFile(localPath, 'utf8');
		return { repository, product: JSON.parse(text), source: localPath, local: true };
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}

	const remoteUrl = `https://raw.githubusercontent.com/craftvia/${repositoryName}/main/product.json`;
	const response = await fetch(remoteUrl, { headers: { Accept: 'application/json' } });
	if (!response.ok) throw new Error(`Unable to load ${remoteUrl}: HTTP ${response.status}.`);
	return { repository, product: await response.json(), source: remoteUrl, local: false };
}

const loaded = await Promise.all(repositories.map(loadProduct));
const outputPath = resolve(projectRoot, 'src', 'generated', 'products.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(loaded.map(({ product }) => product), null, 2)}\n`, 'utf8');

const imageOutputDirectory = resolve(projectRoot, 'public', 'generated', 'products');
await mkdir(imageOutputDirectory, { recursive: true });

for (const { repository, product, source, local } of loaded) {
	if (product.id !== repository.id) {
		throw new Error(`${source}: product id must be "${repository.id}".`);
	}
	const imagePath = requireSafePath(product.image, `${source}: image`);
	let image;
	if (local) {
		image = await readFile(resolve(projectRoot, '..', repository.name, imagePath));
	} else {
		const sourceRef = requireSafePath(product.sourceRef, `${source}: sourceRef`);
		const remoteImageUrl = `https://raw.githubusercontent.com/craftvia/${repository.name}/${sourceRef}/${imagePath}`;
		const response = await fetch(remoteImageUrl, { headers: { Accept: 'image/webp' } });
		if (!response.ok) throw new Error(`Unable to load ${remoteImageUrl}: HTTP ${response.status}.`);
		image = Buffer.from(await response.arrayBuffer());
	}
	await writeFile(resolve(imageOutputDirectory, `${repository.id}.webp`), image);
	console.log(`Synced ${product.name ?? 'unnamed product'} from ${source}`);
}
