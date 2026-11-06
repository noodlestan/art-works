import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeConfigMock } from '../../../test/helpers/context/makeConfigMock.js';
import {
	writeNamespaceMockRecord,
	writePackageMockRecord,
	writeProjectMockRecord,
} from '../../../test/helpers/records/writeProjectMockRecord.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';
import { loadNamespaceRecords } from '../namespace/loadNamespaceRecords.js';
import { loadPackageRecords } from '../package/loadPackageRecords.js';
import { loadProjectRecords } from '../project/loadProjectRecords.js';

import { consolidateProjectGraph } from './consolidateProjectGraph.js';
import { loadProjectGraph } from './loadProjectGraph.js';

const tempDirs: string[] = [];

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('loadProjectRecords', () => {
	it('WHEN the project file is valid it parses the record', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeProjectMockRecord(tempDir, 'Artificial', {
			remote: 'git@example.com:artificial.git',
			path: 'artisans',
			namespaces: ['Art Domains', 'Art Tools'],
		});
		const config = makeConfigMock(tempDir);

		const records = await loadProjectRecords(config, tempDir);

		expect(records).toHaveLength(1);
		expect(records[0]?.kind).toBe('project');
		expect(records[0]?.name).toBe('Artificial');
		expect(records[0]?.path).toBe('artisans');
		expect(records[0]?.namespaceNames).toEqual(['Art Domains', 'Art Tools']);
	});

	it('WHEN the file is invalid it returns an empty array', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		const file = join(tempDir, '_records/bad.art');
		writeFileSync(file, 'no project heading here');
		const config = makeConfigMock(tempDir);

		const records = await loadProjectRecords(config, tempDir);

		expect(records).toEqual([]);
	});

	it('WHEN records exist in _records/ it discovers project records', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeProjectMockRecord(tempDir, 'Project A', { path: '.' });
		writeProjectMockRecord(tempDir, 'Project B', { path: 'b' });
		const config = makeConfigMock(tempDir);

		const records = await loadProjectRecords(config, tempDir);
		expect(records).toHaveLength(2);
		expect(records.map(r => r.name).sort()).toEqual(['Project A', 'Project B']);
	});

	it('WHEN the checkout path is missing it returns an empty array', async () => {
		const config = makeConfigMock('/nonexistent/checkout');
		const records = await loadProjectRecords(config, '/nonexistent/checkout');
		expect(records).toEqual([]);
	});

	it('WHEN the directory contains invalid records it filters them out', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeProjectMockRecord(tempDir, 'Good', { path: '.' });

		const badFile = join(tempDir, '_records/bad.art');
		writeFileSync(badFile, 'no heading');

		const config = makeConfigMock(tempDir);
		const records = await loadProjectRecords(config, tempDir);
		expect(records).toHaveLength(1);
		expect(records[0].name).toBe('Good');
	});
});

describe('loadNamespaceRecords', () => {
	it('WHEN the namespace file is valid it parses the record', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeNamespaceMockRecord(tempDir, 'Art Domains', {
			path: 'artisans',
			packages: ['Art Mantras', 'Art Tools'],
		});
		const config = makeConfigMock(tempDir);

		const records = await loadNamespaceRecords(config, tempDir);

		expect(records).toHaveLength(1);
		expect(records[0]?.kind).toBe('namespace');
		expect(records[0]?.name).toBe('Art Domains');
		expect(records[0]?.path).toBe('artisans');
		expect(records[0]?.packageNames).toEqual(['Art Mantras', 'Art Tools']);
	});

	it('WHEN the file is invalid it returns an empty array', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		const file = join(tempDir, '_records/bad.art');
		writeFileSync(file, 'no namespace heading here');
		const config = makeConfigMock(tempDir);

		const records = await loadNamespaceRecords(config, tempDir);

		expect(records).toEqual([]);
	});

	it('WHEN records exist in _records/ it discovers namespace records', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeNamespaceMockRecord(tempDir, 'NS A', { path: 'a' });
		writeNamespaceMockRecord(tempDir, 'NS B', { path: 'b' });
		const config = makeConfigMock(tempDir);

		const records = await loadNamespaceRecords(config, tempDir);
		expect(records).toHaveLength(2);
		expect(records.map(r => r.name).sort()).toEqual(['NS A', 'NS B']);
	});

	it('WHEN the checkout path is missing it returns an empty array', async () => {
		const config = makeConfigMock('/nonexistent/checkout');
		const records = await loadNamespaceRecords(config, '/nonexistent/checkout');
		expect(records).toEqual([]);
	});

	it('WHEN the directory contains invalid records it filters them out', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeNamespaceMockRecord(tempDir, 'Good', { path: '.' });

		const badFile = join(tempDir, '_records/bad.art');
		writeFileSync(badFile, 'no heading');

		const config = makeConfigMock(tempDir);
		const records = await loadNamespaceRecords(config, tempDir);
		expect(records).toHaveLength(1);
		expect(records[0].name).toBe('Good');
	});
});

describe('loadPackageRecords', () => {
	it('WHEN the package file is valid it parses the record', async () => {
		const tempDir = makeTempDir(tempDirs);
		writePackageMockRecord(tempDir, 'Art Mantras', {
			canonicalName: '@artisans/art-mantras',
			path: 'apps/art-mantras',
		});
		const config = makeConfigMock(tempDir);

		const records = await loadPackageRecords(config, tempDir);

		expect(records).toHaveLength(1);
		expect(records[0]?.kind).toBe('package');
		expect(records[0]?.name).toBe('Art Mantras');
		expect(records[0]?.canonicalName).toBe('@artisans/art-mantras');
		expect(records[0]?.path).toBe('apps/art-mantras');
	});

	it('WHEN the file is invalid it returns an empty array', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		const file = join(tempDir, '_records/bad.art');
		writeFileSync(file, 'no package heading here');
		const config = makeConfigMock(tempDir);

		const records = await loadPackageRecords(config, tempDir);

		expect(records).toEqual([]);
	});

	it('WHEN a file also holds dependency records it keeps only the package record', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		writeFileSync(
			join(tempDir, '_records/package.art'),
			'# Module\n\n## Package Dependency: Commander\n\n**Canonical Name:** `commander`\n\n## Package: Tool Box\n\n**Canonical Name:** `@test/tool-box`\n\n**Path:** `tools/box`\n',
		);
		const config = makeConfigMock(tempDir);

		const records = await loadPackageRecords(config, tempDir);

		expect(records).toHaveLength(1);
		expect(records[0]?.name).toBe('Tool Box');
		expect(records[0]?.canonicalName).toBe('@test/tool-box');
		expect(records[0]?.path).toBe('tools/box');
	});

	it('WHEN records exist in _records/ it discovers package records', async () => {
		const tempDir = makeTempDir(tempDirs);
		writePackageMockRecord(tempDir, 'Pkg A', { path: 'a' });
		writePackageMockRecord(tempDir, 'Pkg B', { path: 'b' });
		const config = makeConfigMock(tempDir);

		const records = await loadPackageRecords(config, tempDir);
		expect(records).toHaveLength(2);
		expect(records.map(r => r.name).sort()).toEqual(['Pkg A', 'Pkg B']);
	});

	it('WHEN the checkout path is missing it returns an empty array', async () => {
		const config = makeConfigMock('/nonexistent/checkout');
		const records = await loadPackageRecords(config, '/nonexistent/checkout');
		expect(records).toEqual([]);
	});

	it('WHEN the directory contains invalid records it filters them out', async () => {
		const tempDir = makeTempDir(tempDirs);
		writePackageMockRecord(tempDir, 'Good', { path: '.' });

		const badFile = join(tempDir, '_records/bad.art');
		writeFileSync(badFile, 'no heading');

		const config = makeConfigMock(tempDir);
		const records = await loadPackageRecords(config, tempDir);
		expect(records).toHaveLength(1);
		expect(records[0].name).toBe('Good');
	});
});

describe('consolidateProjectGraph', () => {
	it('WHEN consolidating it links projects to namespaces', () => {
		const projects = [
			{ kind: 'project' as const, name: 'Artificial', path: '.', namespaceNames: ['Art Domains'] },
		];
		const namespaces = [
			{ kind: 'namespace' as const, name: 'Art Domains', path: 'artisans', packageNames: [] },
		];

		const graph = consolidateProjectGraph(projects, namespaces, []);

		expect(graph.namespaces.get('Art Domains')).toBeDefined();
		expect(graph.namespaces.get('Art Domains')?.name).toBe('Art Domains');
		expect(graph.warnings).toEqual([]);
	});

	it('WHEN consolidating it links namespaces to packages', () => {
		const projects = [
			{ kind: 'project' as const, name: 'Artificial', path: '.', namespaceNames: ['Art Domains'] },
		];
		const namespaces = [
			{
				kind: 'namespace' as const,
				name: 'Art Domains',
				path: 'artisans',
				packageNames: ['Art Mantras'],
			},
		];
		const packages = [
			{
				kind: 'package' as const,
				name: 'Art Mantras',
				canonicalName: '@artisans/art-mantras',
				path: 'apps/art-mantras',
			},
		];

		const graph = consolidateProjectGraph(projects, namespaces, packages);

		expect(graph.packages.get('Art Mantras')).toBeDefined();
		expect(graph.packages.get('Art Mantras')?.canonicalName).toBe('@artisans/art-mantras');
		expect(graph.warnings).toEqual([]);
	});

	it('WHEN a project references a missing namespace it warns', () => {
		const projects = [
			{ kind: 'project' as const, name: 'Artificial', path: '.', namespaceNames: ['Missing'] },
		];

		const graph = consolidateProjectGraph(projects, [], []);

		expect(graph.warnings).toContain('unknown namespace: Missing');
	});

	it('WHEN a namespace references a missing package it warns', () => {
		const projects = [
			{ kind: 'project' as const, name: 'Artificial', path: '.', namespaceNames: ['Art Domains'] },
		];
		const namespaces = [
			{
				kind: 'namespace' as const,
				name: 'Art Domains',
				path: 'artisans',
				packageNames: ['Missing'],
			},
		];

		const graph = consolidateProjectGraph(projects, namespaces, []);

		expect(graph.warnings).toContain('unknown package: Missing');
	});
});

describe('loadProjectGraph', () => {
	it('WHEN all record kinds exist it loads a complete project graph', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeProjectMockRecord(tempDir, 'Artificial', {
			path: '.',
			namespaces: ['Art Domains'],
		});
		writeNamespaceMockRecord(tempDir, 'Art Domains', {
			path: 'artisans',
			packages: ['Art Mantras'],
		});
		writePackageMockRecord(tempDir, 'Art Mantras', {
			canonicalName: '@artisans/art-mantras',
			path: 'apps/art-mantras',
		});
		const config = makeConfigMock(tempDir);

		const graph = await loadProjectGraph(config, tempDir);

		expect(graph.projects).toHaveLength(1);
		expect(graph.projects[0].name).toBe('Artificial');
		expect(graph.namespaces.get('Art Domains')).toBeDefined();
		expect(graph.packages.get('Art Mantras')).toBeDefined();
		expect(graph.warnings).toEqual([]);
	});

	it('WHEN _records/ contains decoy .art files it ignores them', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeProjectMockRecord(tempDir, 'Real', { path: '.' });

		writeFileSync(
			join(tempDir, '_records/not-a-record.art'),
			'# Module\n\n## Repository: Ignored\n',
		);
		writeFileSync(
			join(tempDir, '_records/checkout-decoy.art'),
			'# Module\n\n## Checkout: Ignored\n',
		);
		writeFileSync(join(tempDir, '_records/bad-project.art'), 'no heading');

		const config = makeConfigMock(tempDir);
		const graph = await loadProjectGraph(config, tempDir);

		expect(graph.projects).toHaveLength(1);
		expect(graph.projects[0].name).toBe('Real');
		expect(graph.warnings).toEqual([]);
	});

	it('WHEN the _records/ directory is missing it returns an empty graph', async () => {
		const config = makeConfigMock('/nonexistent/checkout');
		const graph = await loadProjectGraph(config, '/nonexistent/checkout');

		expect(graph.projects).toEqual([]);
		expect(graph.namespaces.size).toBe(0);
		expect(graph.packages.size).toBe(0);
		expect(graph.warnings).toEqual([]);
	});

	it('WHEN records live in nested _records/ dirs it picks them up', async () => {
		const tempDir = makeTempDir(tempDirs);
		const nestedDir = join(tempDir, 'libs/parser');
		mkdirSync(join(nestedDir, '_records'), { recursive: true });

		writeFileSync(
			join(nestedDir, '_records/package.art'),
			'# Module\n\n## Package: Parser\n\n**Canonical Name:** `@art/parser`\n\n**Path:** `.`\n',
		);
		const config = makeConfigMock(tempDir);

		const records = await loadPackageRecords(config, tempDir);
		expect(records).toHaveLength(1);
		expect(records[0].name).toBe('Parser');
	});
});
