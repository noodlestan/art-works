import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { cloneStatus } from './cloneStatus.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('cloneStatus', () => {
	it('WHEN the store is empty, clone status prints an empty checkout report', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);

		await cloneStatus(ctx);

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('Checkouts:');
	});

	it('WHEN the store has a checkout, it prints the checkout report', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);
		const checkout = makeCheckoutFixture({
			path: join(tempDir, ctx.config.checkouts.path, 'one'),
			repo: { name: 'One', remote: 'git@example.com:one.git' },
		});
		ctx.store.addCheckout(checkout);

		await cloneStatus(ctx);

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('Checkouts:');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(expect.stringContaining('One'));
	});
});
