import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readCheckout } from '../../private/present/private/readCheckout.js';
import { makeCommandContextMock } from '../../test/helpers/context/makeCommandContextMock.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { writeCheckoutMockRecord } from '../../test/helpers/records/writeCheckoutMockRecord.js';
import { writeRepoMockRecord } from '../../test/helpers/records/writeRepoMockRecord.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runCheckoutsRun } from './runCheckoutsRun.js';

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

describe('checkouts run command', () => {
	it('WHEN neither -c nor --all is provided it prints usage and runs nothing', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });

		writeRepoMockRecord(workspaceDir, 'Art', bareDir);
		writeCheckoutMockRecord(workspaceDir, 'Art', 'Art', 'art');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt' });

		expect(existsSync(join(repoDir, 'marker.txt'))).toBe(false);
		const ops = ctx.log.all().filter(op => op.operation === 'command');
		expect(ops).toHaveLength(1);
		expect((ops[0].data as string[])[0]).toBe('checkouts run');
		expect(ops[0].outcome).toBe('failure');
		expect(ops[0].text()).toBe('No targets.');
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Usage: Use '));
	});

	it('WHEN --all is provided it runs the command in every checkout', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });

		writeRepoMockRecord(workspaceDir, 'Art', artBare);
		writeCheckoutMockRecord(workspaceDir, 'Art', 'Art', 'art');
		writeRepoMockRecord(workspaceDir, 'Purrception', purrBare);
		writeCheckoutMockRecord(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', all: true });

		expect(existsSync(join(artDir, 'marker.txt'))).toBe(true);
		expect(existsSync(join(purrDir, 'marker.txt'))).toBe(true);

		const runOps = ctx.log.all().filter(op => op.operation === 'run');
		expect(runOps).toHaveLength(2);
		expect(runOps.map(op => op.outcome)).toEqual(['success', 'success']);
	});

	it('WHEN a pattern is provided it runs only in matching checkouts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });

		writeRepoMockRecord(workspaceDir, 'Art', artBare);
		writeCheckoutMockRecord(workspaceDir, 'Art', 'Art', 'art');
		writeRepoMockRecord(workspaceDir, 'Purrception', purrBare);
		writeCheckoutMockRecord(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', checkouts: ['art*'] });

		expect(existsSync(join(artDir, 'marker.txt'))).toBe(true);
		expect(existsSync(join(purrDir, 'marker.txt'))).toBe(false);

		const runOps = ctx.log.all().filter(op => op.operation === 'run');
		expect(runOps).toHaveLength(1);
		expect(readCheckout(runOps[0].data)?.record.name).toBe('Art');
		expect(runOps[0].outcome).toBe('success');
	});

	it('WHEN the command exits non-zero it logs a failure operation per checkout', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });

		writeRepoMockRecord(workspaceDir, 'Art', artBare);
		writeCheckoutMockRecord(workspaceDir, 'Art', 'Art', 'art');
		writeRepoMockRecord(workspaceDir, 'Purrception', purrBare);
		writeCheckoutMockRecord(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'sh -c "exit 1"', all: true });

		const runOps = ctx.log.all().filter(op => op.operation === 'run');
		expect(runOps).toHaveLength(2);
		expect(runOps.map(op => op.outcome)).toEqual(['failure', 'failure']);
		expect(String(runOps[0].text())).toContain('Exit code: 1');
	});

	it('WHEN no checkout matches the pattern it warns and executes nothing', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', checkouts: ['nonexistent'] });

		expect(ctx.log.all().filter(op => op.operation === 'run')).toHaveLength(0);
	});

	it('WHEN a checkout is recorded but not cloned it logs a failure operation', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);

		writeRepoMockRecord(workspaceDir, 'Missing', 'git@example.com:missing.git');
		writeCheckoutMockRecord(workspaceDir, 'Missing', 'Missing', 'missing');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', all: true });

		const runOps = ctx.log.all().filter(op => op.operation === 'run');
		expect(runOps).toHaveLength(1);
		expect(runOps[0].outcome).toBe('failure');
		expect(String(runOps[0].text())).toContain('checkout not cloned');
	});
});
