import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { makeWorkspaceCheckoutFixture } from '../../../test/helpers/checkout/makeWorkspaceCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doPullWorkspaceCheckout } from './doPullWorkspaceCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('doPullWorkspaceCheckout', () => {
	it('WHEN the workspace is clean and behind it pulls the workspace root', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['behind']) }),
		);

		const updated = await doPullWorkspaceCheckout(ctx);

		expect(updated).toBeDefined();
		expect(updated?.scan?.state('sync').behind).toEqual(0);
		expect(updated?.scan?.issues()).not.toContain('1 commit behind');
		expect(existsSync(join(workspaceDir, 'origin-advance.txt'))).toEqual(true);
		const expectedPendingOp = expect.objectContaining({ operation: 'pull', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'pull', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the workspace is up to date it pulls the workspace root', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, {
				scan: makeCheckoutScanFixture([]),
			}),
		);

		await doPullWorkspaceCheckout(ctx);

		const expectedPendingOp = expect.objectContaining({ operation: 'pull', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'pull', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the workspace is dirty it skips the pull', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, {
				scan: makeCheckoutScanFixture(['behind', 'uncommitted']),
			}),
		);

		await doPullWorkspaceCheckout(ctx);

		expect(ctx.operations.log).not.toHaveBeenCalled();
	});

	it('WHEN there is no workspace checkout it throws', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);

		await expect(doPullWorkspaceCheckout(ctx)).rejects.toThrow('No workspace in context.');
		expect(ctx.operations.log).not.toHaveBeenCalled();
	});

	it('WHEN the pull fails it logs failure and continues', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');

		await simpleGit(workspaceDir).remote([
			'set-url',
			'origin',
			join(workspaceDir, 'missing-origin'),
		]);
		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['behind']) }),
		);

		await expect(doPullWorkspaceCheckout(ctx)).resolves.toBeNull();

		const expectedPendingOp = expect.objectContaining({ operation: 'pull', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'pull', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
	});
});
