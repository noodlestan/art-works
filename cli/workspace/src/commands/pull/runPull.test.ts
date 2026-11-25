import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWorkspaceCheckoutFixture } from '../../test/helpers/checkout/makeWorkspaceCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { writeCheckoutRecordFixture } from '../../test/helpers/records/writeCheckoutRecordFixture.js';
import { writeRepoRecordFixture } from '../../test/helpers/records/writeRepoRecordFixture.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runPull } from './runPull.js';

const tempDirs: string[] = [];

function createContext(...args: Parameters<typeof createWorkspaceContextMock>) {
	const ctx = createWorkspaceContextMock(...args);
	vi.mocked(ctx.operations.all).mockReturnValue([]);
	return ctx;
}

async function setupBehindCheckout(workspaceDir: string, location: string) {
	const { dir: bareDir } = await makeGitBareRepo(tempDirs);
	const repoDir = join(workspaceDir, 'checkouts', location);
	await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
	await advanceBareRepoByOneCommit(tempDirs, bareDir, `${location}-origin.txt`);
	writeRepoRecordFixture(workspaceDir, location, bareDir);
	writeCheckoutRecordFixture(workspaceDir, location, location, location);
	return repoDir;
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

describe('runPull', () => {
	it('WHEN no target is selected, it logs a command failure', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);

		// Exercise
		await runPull(ctx, {});

		// Assertions
		const expectedFailureOp = expect.objectContaining({ operation: 'command', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
	});

	it('WHEN a checkout pattern is selected, it pulls only matching checkouts', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const alphaDir = await setupBehindCheckout(workspaceDir, 'alpha');
		const betaDir = await setupBehindCheckout(workspaceDir, 'beta');

		// Exercise
		await runPull(ctx, { checkouts: ['alpha'] });

		// Assertions
		expect(existsSync(join(alphaDir, 'alpha-origin.txt'))).toBe(true);
		expect(existsSync(join(betaDir, 'beta-origin.txt'))).toBe(false);
	});

	it('WHEN the workspace option is selected, it pulls the workspace checkout', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'workspace-origin.txt');
		const workspace = makeWorkspaceCheckoutFixture(workspaceDir);
		const ctx = createContext(workspaceDir, workspace);

		// Exercise
		await runPull(ctx, { workspace: true });

		// Assertions
		expect(existsSync(join(workspaceDir, 'workspace-origin.txt'))).toBe(true);
	});
});
