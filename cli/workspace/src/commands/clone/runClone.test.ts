import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupCloneWorkspace } from '../../../test/helpers/setupCloneWorkspace.js';
import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runClone } from './runClone.js';

const tempDirs: string[] = [];

function createContext(...args: Parameters<typeof createWorkspaceContextMock>) {
	const ctx = createWorkspaceContextMock(...args);
	vi.mocked(ctx.operations.all).mockReturnValue([]);
	return ctx;
}

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('runClone', () => {
	it('WHEN all repositories are selected, it clones each configured checkout', async () => {
		// Setup
		const { root, locations } = await setupCloneWorkspace(tempDirs);
		const ctx = createContext(root);

		// Exercise
		const result = await runClone(ctx, { all: true });

		// Assertions
		const expectedCommandOp = expect.objectContaining({ operation: 'command', outcome: 'pending' });
		expect(result).toBe(ctx);
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedCommandOp);
		expect(existsSync(join(root, 'checkouts', locations[0]))).toBe(true);
		expect(existsSync(join(root, 'checkouts', locations[1]))).toBe(true);
	});

	it('WHEN one repository is selected, it leaves other repository checkouts untouched', async () => {
		// Setup
		const { root, locations } = await setupCloneWorkspace(tempDirs);
		const ctx = createContext(root);

		// Exercise
		await runClone(ctx, { repoName: 'Alpha' });

		// Assertions
		expect(existsSync(join(root, 'checkouts', locations[0]))).toBe(true);
		expect(existsSync(join(root, 'checkouts', locations[1]))).toBe(false);
	});

	it('WHEN no target is selected, it reports status without cloning repositories', async () => {
		// Setup
		const { root, locations } = await setupCloneWorkspace(tempDirs);
		const ctx = createContext(root);

		// Exercise
		await runClone(ctx, {});

		// Assertions
		expect(existsSync(join(root, 'checkouts', locations[0]))).toBe(false);
		expect(existsSync(join(root, 'checkouts', locations[1]))).toBe(false);
	});
});
