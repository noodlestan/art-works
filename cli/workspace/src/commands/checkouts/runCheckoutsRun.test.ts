import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readCheckout } from '../../private/present/private/readCheckout.js';
import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { writeCheckoutRecordFixture } from '../../test/helpers/records/writeCheckoutRecordFixture.js';
import { writeRepoRecordFixture } from '../../test/helpers/records/writeRepoRecordFixture.js';
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
	it('WHEN neither -c nor --all is provided, it prints usage and runs nothing', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		writeRepoRecordFixture(workspaceDir, 'Art', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Art', 'Art', 'art');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt' });

		const expectedPendingOp = expect.objectContaining({ operation: 'command', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'command', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
		expect(existsSync(join(repoDir, 'marker.txt'))).toBe(false);
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Usage: Use '));
	});

	it('WHEN --all is provided, it runs the command in every checkout', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });
		writeRepoRecordFixture(workspaceDir, 'Art', artBare);
		writeCheckoutRecordFixture(workspaceDir, 'Art', 'Art', 'art');
		writeRepoRecordFixture(workspaceDir, 'Purrception', purrBare);
		writeCheckoutRecordFixture(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', all: true });

		const successfulRuns = vi
			.mocked(ctx.operations.log)
			.mock.calls.filter(
				([operation]) => operation.operation === 'run' && operation.outcome === 'success',
			);
		expect(existsSync(join(artDir, 'marker.txt'))).toBe(true);
		expect(existsSync(join(purrDir, 'marker.txt'))).toBe(true);
		expect(successfulRuns).toHaveLength(2);
	});

	it('WHEN a pattern is provided, it runs only in matching checkouts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });
		writeRepoRecordFixture(workspaceDir, 'Art', artBare);
		writeCheckoutRecordFixture(workspaceDir, 'Art', 'Art', 'art');
		writeRepoRecordFixture(workspaceDir, 'Purrception', purrBare);
		writeCheckoutRecordFixture(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', checkouts: ['art*'] });

		const successfulRun = vi
			.mocked(ctx.operations.log)
			.mock.calls.find(
				([operation]) => operation.operation === 'run' && operation.outcome === 'success',
			)?.[0];
		expect(existsSync(join(artDir, 'marker.txt'))).toBe(true);
		expect(existsSync(join(purrDir, 'marker.txt'))).toBe(false);
		expect(successfulRun).toBeDefined();
		expect(readCheckout(successfulRun?.data)?.record.name).toBe('Art');
	});

	it('WHEN the command exits non-zero, it logs a failure for each checkout', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const { dir: artBare } = await makeGitBareRepo(tempDirs);
		const { dir: purrBare } = await makeGitBareRepo(tempDirs);
		const artDir = join(workspaceDir, ctx.config.checkouts.path, 'art');
		const purrDir = join(workspaceDir, ctx.config.checkouts.path, 'purr');
		await makeGitRepoFromBare(tempDirs, artBare, { dir: artDir });
		await makeGitRepoFromBare(tempDirs, purrBare, { dir: purrDir });
		writeRepoRecordFixture(workspaceDir, 'Art', artBare);
		writeCheckoutRecordFixture(workspaceDir, 'Art', 'Art', 'art');
		writeRepoRecordFixture(workspaceDir, 'Purrception', purrBare);
		writeCheckoutRecordFixture(workspaceDir, 'Purrception', 'Purrception', 'purr');

		await runCheckoutsRun(ctx, { command: 'sh -c "exit 1"', all: true });

		const failedRuns = vi
			.mocked(ctx.operations.log)
			.mock.calls.filter(
				([operation]) => operation.operation === 'run' && operation.outcome === 'failure',
			);
		const firstFailure = failedRuns[0]?.[0];
		expect(failedRuns).toHaveLength(2);
		expect(firstFailure?.text()).toContain('Exit code: 1');
	});

	it('WHEN no checkout matches the pattern, it warns and executes nothing', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', checkouts: ['nonexistent'] });

		const runCalls = vi
			.mocked(ctx.operations.log)
			.mock.calls.filter(([operation]) => operation.operation === 'run');
		expect(runCalls).toHaveLength(0);
		expect(console.warn).toHaveBeenCalledWith('no checkout matches pattern: "nonexistent"');
	});

	it('WHEN a checkout is recorded but not cloned, it logs a failure operation', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		writeRepoRecordFixture(workspaceDir, 'Missing', 'git@example.com:missing.git');
		writeCheckoutRecordFixture(workspaceDir, 'Missing', 'Missing', 'missing');

		await runCheckoutsRun(ctx, { command: 'touch marker.txt', all: true });

		const failure = vi
			.mocked(ctx.operations.log)
			.mock.calls.find(
				([operation]) => operation.operation === 'run' && operation.outcome === 'failure',
			)?.[0];
		expect(failure).toBeDefined();
		expect(failure?.text()).toContain('checkout not cloned');
	});
});
