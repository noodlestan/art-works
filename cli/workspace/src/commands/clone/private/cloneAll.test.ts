import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadRepositoryRecords } from '../../../private/resources/repository/loadRepositoryRecords.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { writeRepoRecordFixture } from '../../../test/helpers/records/writeRepoRecordFixture.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { cloneAll } from './cloneAll.js';

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

describe('cloneAll', () => {
	it('WHEN the repository list is empty, it creates no checkouts', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);

		await cloneAll(ctx, []);

		expect(ctx.store.getAllCheckouts()).toHaveLength(0);
	});

	it('WHEN a repository has an existing destination directory, it adds its checkout without cloning', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const checkoutDir = join(tempDir, ctx.config.checkouts.path, 'one');
		mkdirSync(checkoutDir, { recursive: true });
		writeRepoRecordFixture(tempDir, 'One', 'git@example.com:one.git');
		const repositories = await loadRepositoryRecords(ctx);

		await cloneAll(ctx, repositories);

		const checkout = ctx.store.getCheckoutOfRepo('One');
		const cloneCalls = vi
			.mocked(ctx.operations.log)
			.mock.calls.filter(([operation]) => operation.operation === 'clone');
		expect(checkout).toBeDefined();
		expect(checkout?.record.location).toBe('one');
		expect(cloneCalls).toHaveLength(0);
	});
});
