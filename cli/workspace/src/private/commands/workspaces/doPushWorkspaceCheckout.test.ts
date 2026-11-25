import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { makeWorkspaceCheckoutFixture } from '../../../test/helpers/checkout/makeWorkspaceCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceGitRepoByOneCommit } from '../../../test/helpers/git/advanceGitRepoByOneCommit.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doPushWorkspaceCheckout } from './doPushWorkspaceCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('doPushWorkspaceCheckout', () => {
	it('WHEN the workspace root is clean and ahead it pushes it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceGitRepoByOneCommit(workspaceDir);

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['ahead']) }),
		);

		const updated = await doPushWorkspaceCheckout(ctx);

		expect(updated).toBeDefined();
		expect(updated?.scan?.state('sync').ahead).toEqual(0);

		const verifyDir = makeTempDir(tempDirs);
		await simpleGit(verifyDir).clone(bareDir, verifyDir);
		expect(existsSync(join(verifyDir, 'ahead.txt'))).toEqual(true);

		const expectedPendingOp = expect.objectContaining({ operation: 'push', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'push', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the workspace root is up to date it pushes it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });

		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, {
				scan: makeCheckoutScanFixture([]),
			}),
		);

		await doPushWorkspaceCheckout(ctx);

		const expectedPendingOp = expect.objectContaining({ operation: 'push', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'push', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the workspace is dirty it skips the push', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, {
				scan: makeCheckoutScanFixture(['ahead', 'uncommitted']),
			}),
		);

		await doPushWorkspaceCheckout(ctx);

		expect(ctx.operations.log).not.toHaveBeenCalled();
	});

	it('WHEN there is no workspace checkout it throws', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);

		await expect(doPushWorkspaceCheckout(ctx)).rejects.toThrow('No workspace in context.');
		expect(ctx.operations.log).not.toHaveBeenCalled();
	});

	it('WHEN the push fails it logs the failure and continues', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceGitRepoByOneCommit(workspaceDir);

		await simpleGit(workspaceDir).remote([
			'set-url',
			'origin',
			join(workspaceDir, 'missing-origin'),
		]);
		const ctx = createWorkspaceContextMock(
			workspaceDir,
			makeWorkspaceCheckoutFixture(workspaceDir, { scan: makeCheckoutScanFixture(['ahead']) }),
		);

		await expect(doPushWorkspaceCheckout(ctx)).resolves.toBeNull();

		const expectedPendingOp = expect.objectContaining({ operation: 'push', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'push', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
	});
});
