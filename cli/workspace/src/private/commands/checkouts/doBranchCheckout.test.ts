import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doBranchCheckout } from './doBranchCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('doBranchCheckout', () => {
	it('WHEN given a branch name, it creates the branch, returns the checkout, and logs both states', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'my-repo');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		const checkout = makeCheckoutFixture({
			path: repoDir,
			repo: { name: 'MyRepo', remote: 'git@example.com:my-repo.git' },
		});
		const git = simpleGit(repoDir);

		const updatedCheckout = await doBranchCheckout(ctx, checkout, 'feat/x');

		const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
		expect(branch.trim()).toBe('feat/x');
		expect(updatedCheckout).not.toBeNull();
		expect(updatedCheckout?.record.branch).toBe('feat/x');
		const expectedPendingOp = expect.objectContaining({ outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedSuccessOp);
	});

	it('WHEN branch creation fails, it returns null and logs pending and failure', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = makeCheckoutFixture({ path: '/nonexistent' });

		const result = await doBranchCheckout(ctx, checkout, 'feat/x');

		expect(result).toBeNull();
		const expectedPendingOp = expect.objectContaining({ outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedFailureOp);
	});
});
