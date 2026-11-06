import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCommandContextMock } from '../../../test/helpers/context/makeCommandContextMock.js';
import { writeRepoMockRecord } from '../../../test/helpers/records/writeRepoMockRecord.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { loadRepositoryRecords } from './loadRepositoryRecords.js';

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

describe('loadRepositoryRecords', () => {
	it('WHEN a record file is read it parses name, remote, purpose, description and consumers', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeRepoMockRecord(tempDir, 'Artificial', `git@github.com:noodlestan/artificial.git`);
		const ctx = makeCommandContextMock(tempDir);

		const records = await loadRepositoryRecords(ctx);

		expect(records).toHaveLength(1);
		const record = records[0];
		expect(record?.name).toBe('Artificial');
		expect(record?.remote).toBe('git@github.com:noodlestan/artificial.git');
		expect(record?.purpose).toBe('test');
		expect(record?.description).toBe(undefined);
	});

	it('WHEN the record file is missing it returns an empty array', async () => {
		const ctx = makeCommandContextMock('/nonexistent/checkout');

		const records = await loadRepositoryRecords(ctx);

		expect(records).toEqual([]);
	});

	it('WHEN the kind heading is absent it returns an empty array', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		writeFileSync(
			join(tempDir, '_records/noheading.art'),
			'# Module\n\n**Purpose:** test\n\n**Remote:** `git@example.com:test.git`\n',
		);
		const ctx = makeCommandContextMock(tempDir);

		const records = await loadRepositoryRecords(ctx);

		expect(records).toEqual([]);
	});

	it('WHEN the remote is missing it warns and uses defaults', async () => {
		const tempDir = makeTempDir(tempDirs);
		mkdirSync(join(tempDir, '_records'), { recursive: true });
		writeFileSync(
			join(tempDir, '_records/norepo.art'),
			'# Module\n\n## Repository: NoRemote\n\n**Purpose:** test\n',
		);
		const ctx = makeCommandContextMock(tempDir);
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const records = await loadRepositoryRecords(ctx);

		expect(records).toHaveLength(1);
		expect(records[0]?.name).toBe('NoRemote');
		expect(records[0]?.remote).toBe('');
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing remote'));
	});
});
