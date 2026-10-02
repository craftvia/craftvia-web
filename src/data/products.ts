import generatedProducts from '../generated/products.json';

export type ProductRole = 'core' | 'station' | 'carrier' | 'makercard';
export type DesignStatus = 'concept' | 'draft' | 'frozen' | 'superseded';
export type VerificationStatus = 'unverified' | 'partially-verified' | 'verified' | 'rejected';
export type HardwareStatus = 'planned' | 'boards-ordered' | 'assembled' | 'testing' | 'released';

export interface ProductMetadata {
	schemaVersion: 1;
	id: string;
	name: string;
	role: ProductRole;
	productVersion: string;
	pcbRevision: string;
	designStatus: DesignStatus;
	verificationStatus: VerificationStatus;
	hardwareStatus: HardwareStatus;
	summary: { en: string; ja: string };
	repository: string;
	sourceRef: string;
	image: string;
	documents: {
		specification: { en: string; ja: string };
		verificationPlan: { en: string; ja: string };
		releaseNotes: string;
	};
}

const repositories = [
	{ name: 'craftvia-core-s-g031', id: 'core-s-g031' },
	{ name: 'craftvia-station-s', id: 'station-s' },
	{ name: 'craftvia-makercard-s', id: 'makercard-s' },
] as const;

const roles = new Set<ProductRole>(['core', 'station', 'carrier', 'makercard']);
const designStatuses = new Set<DesignStatus>(['concept', 'draft', 'frozen', 'superseded']);
const verificationStatuses = new Set<VerificationStatus>(['unverified', 'partially-verified', 'verified', 'rejected']);
const hardwareStatuses = new Set<HardwareStatus>(['planned', 'boards-ordered', 'assembled', 'testing', 'released']);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string, source: string): string {
	const value = record[key];
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${source}: "${key}" must be a non-empty string.`);
	}
	return value;
}

function requireLocalizedText(value: unknown, key: string, source: string): { en: string; ja: string } {
	if (!isRecord(value)) throw new Error(`${source}: "${key}" must contain English and Japanese text.`);
	return {
		en: requireString(value, 'en', `${source}.${key}`),
		ja: requireString(value, 'ja', `${source}.${key}`),
	};
}

function requireRelativePath(value: string, key: string, source: string): string {
	if (value.startsWith('/') || value.includes('..') || value.includes('\\')) {
		throw new Error(`${source}: "${key}" must be a repository-relative POSIX path.`);
	}
	return value;
}

function validateProduct(value: unknown, repositoryName: string, expectedId: string, source: string): ProductMetadata {
	if (!isRecord(value)) throw new Error(`${source}: product metadata must be a JSON object.`);
	if (value.schemaVersion !== 1) throw new Error(`${source}: unsupported schemaVersion.`);

	const role = requireString(value, 'role', source) as ProductRole;
	const designStatus = requireString(value, 'designStatus', source) as DesignStatus;
	const verificationStatus = requireString(value, 'verificationStatus', source) as VerificationStatus;
	const hardwareStatus = requireString(value, 'hardwareStatus', source) as HardwareStatus;
	if (!roles.has(role)) throw new Error(`${source}: unknown role "${role}".`);
	if (!designStatuses.has(designStatus)) throw new Error(`${source}: unknown designStatus "${designStatus}".`);
	if (!verificationStatuses.has(verificationStatus)) throw new Error(`${source}: unknown verificationStatus "${verificationStatus}".`);
	if (!hardwareStatuses.has(hardwareStatus)) throw new Error(`${source}: unknown hardwareStatus "${hardwareStatus}".`);

	const repository = requireString(value, 'repository', source);
	const expectedRepository = `https://github.com/craftvia/${repositoryName}`;
	if (repository !== expectedRepository) {
		throw new Error(`${source}: repository must be "${expectedRepository}".`);
	}
	const id = requireString(value, 'id', source);
	if (id !== expectedId) throw new Error(`${source}: id must be "${expectedId}".`);

	const documentsValue = value.documents;
	if (!isRecord(documentsValue)) throw new Error(`${source}: "documents" must be an object.`);
	const specification = requireLocalizedText(documentsValue.specification, 'specification', `${source}.documents`);
	const verificationPlan = requireLocalizedText(documentsValue.verificationPlan, 'verificationPlan', `${source}.documents`);

	return {
		schemaVersion: 1,
		id,
		name: requireString(value, 'name', source),
		role,
		productVersion: requireString(value, 'productVersion', source),
		pcbRevision: requireString(value, 'pcbRevision', source),
		designStatus,
		verificationStatus,
		hardwareStatus,
		summary: requireLocalizedText(value.summary, 'summary', source),
		repository,
		sourceRef: requireString(value, 'sourceRef', source),
		image: requireRelativePath(requireString(value, 'image', source), 'image', source),
		documents: {
			specification: {
				en: requireRelativePath(specification.en, 'specification.en', source),
				ja: requireRelativePath(specification.ja, 'specification.ja', source),
			},
			verificationPlan: {
				en: requireRelativePath(verificationPlan.en, 'verificationPlan.en', source),
				ja: requireRelativePath(verificationPlan.ja, 'verificationPlan.ja', source),
			},
			releaseNotes: requireRelativePath(
				requireString(documentsValue, 'releaseNotes', `${source}.documents`),
				'releaseNotes',
				source,
			),
		},
	};
}

export function loadProducts(): ProductMetadata[] {
	if (!Array.isArray(generatedProducts) || generatedProducts.length !== repositories.length) {
		throw new Error('Generated product metadata is incomplete. Run "npm run sync-products".');
	}
	return repositories.map((repository, index) =>
		validateProduct(generatedProducts[index], repository.name, repository.id, `generated products[${index}]`),
	);
}
