import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';

import { doPullCheckout } from './doPullCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('doPullCheckout', () => {
	it('WHEN the checkout is behind, it pulls and logs pending and success', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'behind');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir);
		const git = simpleGit(repoDir);
		await git.fetch('origin', 'main');
		const checkout = makeCheckoutFixture({
			path: repoDir,
			repo: { name: 'Behind', remote: 'git@example.com:behind.git' },
		});
		const scanned = await scanCheckoutState(ctx, checkout);

		const result = await doPullCheckout(ctx, scanned);

		expect(scanned.scan?.state('sync').behind).toBe(1);
		expect(result).not.toBeNull();
		expect(result?.scan?.state('sync').behind).toBe(0);
		expect(existsSync(join(repoDir, 'origin.txt'))).toBe(true);
		const expectedPendingOp = expect.objectContaining({ operation: 'pull', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'pull', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the pull fails, it returns null and logs pending and failure', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'nopull');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		const git = simpleGit(repoDir);
		await git.remote(['set-url', 'origin', join(workspaceDir, 'missing-origin')]);
		const checkout = makeCheckoutFixture({
			path: repoDir,
			repo: { name: 'NoPull', remote: 'git@example.com:nopull.git' },
			scan: makeCheckoutScanFixture(['behind']),
		});

		const result = await doPullCheckout(ctx, checkout);

		expect(result).toBeNull();
		const expectedPendingOp = expect.objectContaining({ operation: 'pull', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'pull', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedFailureOp);
	});
});
