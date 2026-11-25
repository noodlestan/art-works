import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { cloneIfMissing } from './cloneIfMissing.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('cloneIfMissing', () => {
	it('WHEN the checkout directory exists, it returns the scanned checkout without cloning', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutPath = join(workspaceDir, 'checkouts', 'existing');
		mkdirSync(checkoutPath, { recursive: true });
		const checkout = makeCheckoutFixture({ path: checkoutPath });

		const result = await cloneIfMissing(ctx, checkout);

		expect(result?.path).toBe(checkoutPath);
		expect(result?.scan?.state('exists').exists).toBe(true);
		expect(
			vi
				.mocked(ctx.operations.log)
				.mock.calls.some(([operation]) => operation.operation === 'clone'),
		).toBe(false);
	});

	it('WHEN the checkout is missing and has no repository, it returns null', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = makeCheckoutFixture({ path: join(workspaceDir, 'checkouts', 'orphan') });

		const result = await cloneIfMissing(ctx, checkout);

		expect(result).toBeNull();
		expect(ctx.operations.log).not.toHaveBeenCalled();
	});
});
