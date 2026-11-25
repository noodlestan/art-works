import { afterEach, describe, expect, it } from 'vitest';

import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { syncCheckouts } from './syncCheckouts.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('syncCheckouts', () => {
	it('WHEN the store has no checkouts, it does not log operations', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);

		await syncCheckouts(ctx);

		expect(ctx.operations.log).not.toHaveBeenCalled();
	});
});
