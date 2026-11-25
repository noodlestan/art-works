import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { scanExtraneousCheckouts } from './scanExtraneousCheckouts.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('scanExtraneousCheckouts', () => {
	it('WHEN the checkouts dir is empty it returns no extraneous entries', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);
		mkdirSync(join(tempDir, ctx.config.checkouts.path), { recursive: true });
		const store = ctx.store;

		const extraneous = await scanExtraneousCheckouts(ctx, store);

		expect(extraneous).toHaveLength(0);
	});

	it('WHEN a checkout is known it is not flagged as extraneous', async () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(tempDir);
		const checkoutsPath = join(tempDir, ctx.config.checkouts.path);
		mkdirSync(checkoutsPath, { recursive: true });
		const store = ctx.store;

		// Create a known checkout directory
		const knownLocation = 'known-repo';
		const knownDir = join(checkoutsPath, knownLocation);
		mkdirSync(knownDir, { recursive: true });

		// Add a checkout with that location to the store
		const checkout = {
			record: { name: 'Known Repo', location: knownLocation, branch: 'main', repository: 'known' },
			path: knownDir,
			exists: true,
			scan: undefined,
		};
		store.addCheckout(checkout);

		const extraneous = await scanExtraneousCheckouts(ctx, store);

		expect(extraneous).toHaveLength(0);
	});
});
