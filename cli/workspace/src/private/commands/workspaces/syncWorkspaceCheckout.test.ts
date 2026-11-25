import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { makeWorkspaceCheckoutFixture } from '../../../test/helpers/checkout/makeWorkspaceCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { advanceGitRepoByOneCommit } from '../../../test/helpers/git/advanceGitRepoByOneCommit.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { syncWorkspaceCheckout } from './syncWorkspaceCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('syncWorkspaceCheckout', () => {
	it('WHEN the workspace is synced it pulls then pushes and re-scans with refetch', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });

		// Push an extra commit from a second clone so workspace is behind.
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'remote-commit.txt');

		// Also make workspace ahead with a local commit.
		await advanceGitRepoByOneCommit(workspaceDir, 'local-commit.txt');

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['behind']) }),
		);

		await syncWorkspaceCheckout(ctx);

		expect(ctx.workspace).toBeDefined();
		expect(ctx.workspace?.scan?.state('sync').behind).toBe(0);
		expect(ctx.workspace?.scan?.state('sync').ahead).toBe(0);
		expect(existsSync(join(workspaceDir, 'remote-commit.txt'))).toBe(true);

		const expectedPullPendingOp = expect.objectContaining({
			operation: 'pull',
			outcome: 'pending',
		});
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPullPendingOp);
		const expectedPullSuccessOp = expect.objectContaining({
			operation: 'pull',
			outcome: 'success',
		});
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPullSuccessOp);
		const expectedPushPendingOp = expect.objectContaining({
			operation: 'push',
			outcome: 'pending',
		});
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPushPendingOp);
		const expectedPushSuccessOp = expect.objectContaining({
			operation: 'push',
			outcome: 'success',
		});
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPushSuccessOp);
	});

	it('WHEN the workspace cannot pull it skips the pull', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceGitRepoByOneCommit(workspaceDir, 'ahead.txt');

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['ahead']) }),
		);

		await syncWorkspaceCheckout(ctx);

		// Only push operation
		const expectedPushOp = expect.objectContaining({ operation: 'push', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPushOp);
	});

	it('WHEN there is no workspace in context it throws', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);

		await expect(syncWorkspaceCheckout(ctx)).rejects.toThrow('No workspace in context.');
		expect(ctx.operations.log).not.toHaveBeenCalled();
	});
});
