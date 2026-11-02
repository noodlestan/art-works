import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';
import { makeCommandContextMock } from '../../test/helpers/context/makeCommandContextMock.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { writeCheckoutMockRecord } from '../../test/helpers/records/writeCheckoutMockRecord.js';
import { writeRepoMockRecord } from '../../test/helpers/records/writeRepoMockRecord.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { cloneSpecific } from './cloneSpecific.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('cloneSpecific', () => {
	it('WHEN the repo is unknown it logs a failure containing unknown repo', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const logSpy = vi.spyOn(ctx.log, 'log');

		await cloneSpecific(ctx, [], 'nope');

		expect(logSpy).toHaveBeenCalledTimes(1);
		const op = logSpy.mock.calls[0][0];
		expect(op.message()).toContain('unknown repo "nope"');
	});

	it('WHEN the repo is missing it clones it and creates the checkout record', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		writeRepoMockRecord(workspaceDir, 'One', bareDir);

		const repos = await loadRepositoryRecords(ctx);
		await cloneSpecific(ctx, repos, 'One');

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'one');
		expect(() => simpleGit(repoDir).status()).not.toThrow();

		const recordFile = join(workspaceDir, '_records/one-checkout.art');
		expect(existsSync(recordFile)).toBe(true);
		const content = readFileSync(recordFile, 'utf-8');
		expect(content).toContain('## Checkout: One');
		expect(content).toContain('**Location:** one');
	});

	it('WHEN the repo exists at another location it creates a second checkout', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		writeRepoMockRecord(workspaceDir, 'Foo', bareDir);
		writeCheckoutMockRecord(workspaceDir, 'Foo', 'Foo', 'foo');

		const repos = await loadRepositoryRecords(ctx);
		hydrateStoreFromRecords(ctx.config, ctx.store, await loadCheckoutRecords(ctx, repos));
		await cloneSpecific(ctx, repos, 'Foo', 'bar');

		const ops = ctx.log.all();
		const cloneOps = ops.filter(op => op.operation === 'clone');
		expect(cloneOps.some(op => op.outcome === 'success')).toBe(true);

		const recordFile = join(workspaceDir, '_records/foo-@-bar-checkout.art');
		expect(existsSync(recordFile)).toBe(true);
		const content = readFileSync(recordFile, 'utf-8');
		expect(content).toContain('## Checkout: Foo @ bar');
		expect(content).toContain('**Location:** foo-bar');
	});

	it('WHEN a custom location is given it uses the correct name and path', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		writeRepoMockRecord(workspaceDir, 'Foo', bareDir);

		const repos = await loadRepositoryRecords(ctx);
		await cloneSpecific(ctx, repos, 'Foo', 'bar');

		const checkouts = ctx.store.getAllCheckouts();
		const checkout = checkouts.find(c => c.record.location === 'foo-bar');
		expect(checkout).toBeDefined();
		expect(checkout?.record.name).toBe('Foo @ bar');
		expect(checkout?.record.location).toBe('foo-bar');
		expect(checkout?.path).toBe(join(workspaceDir, ctx.config.checkouts.path, 'foo-bar'));
	});

	it('WHEN no location is given it uses the repo name as name and path', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		writeRepoMockRecord(workspaceDir, 'Foo', bareDir);

		const repos = await loadRepositoryRecords(ctx);
		await cloneSpecific(ctx, repos, 'Foo');

		const checkouts = ctx.store.getAllCheckouts();
		const checkout = checkouts.find(c => c.record.location === 'foo');
		expect(checkout).toBeDefined();
		expect(checkout?.record.name).toBe('Foo');
		expect(checkout?.record.location).toBe('foo');
		expect(checkout?.path).toBe(join(workspaceDir, ctx.config.checkouts.path, 'foo'));
	});

	it('WHEN the location is already used it logs a failure', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		writeRepoMockRecord(workspaceDir, 'One', 'git@example.com:one.git');
		writeRepoMockRecord(workspaceDir, 'Two', 'git@example.com:two.git');
		writeCheckoutMockRecord(workspaceDir, 'Two', 'Two', 'one custom');

		const repos = await loadRepositoryRecords(ctx);
		hydrateStoreFromRecords(ctx.config, ctx.store, await loadCheckoutRecords(ctx, repos));
		await cloneSpecific(ctx, repos, 'One', 'custom');

		const ops = ctx.log.all();
		expect(ops).toHaveLength(1);
		expect(ops[0].outcome).toBe('failure');
		expect(ops[0].message()).toContain("location one-custom is already used by checkout 'Two'.");
	});

	it('WHEN the target directory exists on disk it logs a failure', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		writeRepoMockRecord(workspaceDir, 'One', 'git@example.com:one.git');

		const targetDir = join(workspaceDir, ctx.config.checkouts.path, 'one');
		mkdirSync(targetDir, { recursive: true });

		const repos = await loadRepositoryRecords(ctx);
		await cloneSpecific(ctx, repos, 'One');

		const ops = ctx.log.all();
		expect(ops).toHaveLength(1);
		expect(ops[0].outcome).toBe('failure');
		expect(ops[0].message()).toContain('directory already exists at');
	});
});
