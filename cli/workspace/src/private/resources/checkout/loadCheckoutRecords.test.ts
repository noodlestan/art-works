import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCommandContextMock } from '../../../test/helpers/context/makeCommandContextMock.js';
import { writeCheckoutMockRecord } from '../../../test/helpers/records/writeCheckoutMockRecord.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { loadCheckoutRecords } from './loadCheckoutRecords.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('loadCheckouts', () => {
	it('WHEN checkouts are loaded the repos are resolved by name', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);

		const repoA = { name: 'A', remote: 'git@example.com:a.git' };
		const repoB = { name: 'B', remote: 'git@example.com:b.git' };
		const repos = [repoA, repoB];
		writeCheckoutMockRecord(tempDir, 'A', 'A', 'a', 'dev');
		writeCheckoutMockRecord(tempDir, 'B', 'B', 'b', 'main');

		const checkouts = await loadCheckoutRecords(ctx, repos);

		expect(checkouts).toHaveLength(2);
		expect(checkouts[0].repo?.name).toBe('A');
		expect(checkouts[0].checkout.location).toBe('a');
		expect(checkouts[0].checkout.branch).toBe('dev');
		expect(checkouts[0].recordHandle).toBeDefined();
		expect(checkouts[1].repo?.name).toBe('B');
		expect(checkouts[1].recordHandle).toBeDefined();
	});

	it('WHEN a checkout references an unknown repo it is included as extraneous', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);

		const repoA = { name: 'A', remote: 'git@example.com:a.git' };
		const repoB = { name: 'B', remote: 'git@example.com:b.git' };
		const repos = [repoA, repoB];
		writeCheckoutMockRecord(tempDir, 'A', 'A', 'a');
		writeCheckoutMockRecord(tempDir, 'Unknown', 'Unknown', 'unknown');

		const checkouts = await loadCheckoutRecords(ctx, repos);

		expect(checkouts).toHaveLength(2);
		const unknown = checkouts[1];
		expect(unknown).toBeDefined();
		expect(unknown?.repo?.remote).toBeUndefined();
		expect(unknown?.checkout.name).toBe('Unknown');
		expect(unknown?.checkout.location).toBe('unknown');
		expect(unknown?.checkout.branch).toBe('main');
		expect(unknown?.recordHandle).toBeDefined();
	});

	it('WHEN a checkout record has an empty name it is skipped', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);

		const dir = join(tempDir, '_records');
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, 'unnamed.art'), '# Module\n\n## Checkout: \n');

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const checkouts = await loadCheckoutRecords(ctx, []);

		expect(checkouts).toEqual([]);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('skipped'));
	});

	it('WHEN the checkouts dir is empty it returns an empty list', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);

		mkdirSync(join(tempDir, '_records'), { recursive: true });

		const checkouts = await loadCheckoutRecords(ctx, []);

		expect(checkouts).toEqual([]);
	});

	it('WHEN records are loaded the record handle is returned', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);

		writeCheckoutMockRecord(tempDir, 'Foo', 'Foo', 'foo');

		const checkouts = await loadCheckoutRecords(ctx, []);

		expect(checkouts).toHaveLength(1);
		expect(checkouts[0].recordHandle).toBeDefined();
	});
});
