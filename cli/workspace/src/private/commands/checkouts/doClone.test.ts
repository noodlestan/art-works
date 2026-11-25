import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeGitBareRepo } from '../../../test/helpers/git/makeGitBareRepo.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doClone } from './doClone.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('doClone', () => {
	it('WHEN the clone succeeds it clones the checkout and returns the updated state', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);

		const checkout = makeCheckoutFixture({
			path: join(workspaceDir, ctx.config.checkouts.path, 'my-repo'),
			repo: { name: 'MyRepo', remote: bareDir },
		});

		const result = await doClone(ctx, checkout);

		expect(result).not.toBeNull();
		expect(result?.scan?.state('exists').exists).toBe(true);
		const expectedPendingOp = expect.objectContaining({ operation: 'clone', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'clone', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedSuccessOp);
	});

	it('WHEN the clone fails it logs the failure and returns null', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = makeCheckoutFixture({
			path: join(workspaceDir, ctx.config.checkouts.path, 'my-repo'),
			repo: { name: 'MyRepo', remote: join(workspaceDir, 'nonexistent-repo.git') },
		});

		const result = await doClone(ctx, checkout);

		expect(result).toBeNull();
		const expectedPendingOp = expect.objectContaining({ operation: 'clone', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'clone', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
	});

	it('WHEN the checkout has no repo it returns null', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = makeCheckoutFixture();

		const result = await doClone(ctx, checkout);

		expect(result).toBeNull();
		expect(ctx.operations.log).not.toHaveBeenCalled();
	});
});
