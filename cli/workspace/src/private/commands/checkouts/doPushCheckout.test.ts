import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeGitRepo } from '../../../test/helpers/git/makeGitRepo.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doPushCheckout } from './doPushCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('doPushCheckout', () => {
	it('WHEN the checkout has no remote pushing logs a failure operation', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'my-repo');
		await makeGitRepo(tempDirs, { commit: true, dir: repoDir });

		const checkout = makeCheckoutFixture({
			path: repoDir,
			repo: { name: 'MyRepo', remote: 'git@example.com:my-repo.git' },
		});
		checkout.scan = makeCheckoutScanFixture(['no-remote']);

		await doPushCheckout(ctx, checkout);

		const expectedPendingOp = expect.objectContaining({ operation: 'push', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'push', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedFailureOp);
	});
});
