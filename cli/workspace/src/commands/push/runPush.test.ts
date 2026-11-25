import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWorkspaceCheckoutFixture } from '../../test/helpers/checkout/makeWorkspaceCheckoutFixture.js';
import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceGitRepoByOneCommit } from '../../test/helpers/git/advanceGitRepoByOneCommit.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { writeCheckoutRecordFixture } from '../../test/helpers/records/writeCheckoutRecordFixture.js';
import { writeRepoRecordFixture } from '../../test/helpers/records/writeRepoRecordFixture.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runPush } from './runPush.js';

const tempDirs: string[] = [];

function createContext(...args: Parameters<typeof createWorkspaceContextMock>) {
	const ctx = createWorkspaceContextMock(...args);
	vi.mocked(ctx.operations.all).mockReturnValue([]);
	return ctx;
}

async function setupAheadCheckout(workspaceDir: string, location: string) {
	const { dir: bareDir } = await makeGitBareRepo(tempDirs);
	const repoDir = join(workspaceDir, 'checkouts', location);
	await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
	await advanceGitRepoByOneCommit(repoDir, `${location}-ahead.txt`);
	writeRepoRecordFixture(workspaceDir, location, bareDir);
	writeCheckoutRecordFixture(workspaceDir, location, location, location);
	return { bareDir, repoDir };
}

async function checkoutHasFile(bareDir: string, fileName: string) {
	const verifyDir = makeTempDir(tempDirs);
	await simpleGit(verifyDir).clone(bareDir, verifyDir);
	return existsSync(join(verifyDir, fileName));
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

describe('runPush', () => {
	it('WHEN no target is selected, it logs a command failure', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);

		// Exercise
		await runPush(ctx, {});

		// Assertions
		const expectedFailureOp = expect.objectContaining({ operation: 'command', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
	});

	it('WHEN a checkout pattern is selected, it pushes only matching checkouts', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const alpha = await setupAheadCheckout(workspaceDir, 'alpha');
		const beta = await setupAheadCheckout(workspaceDir, 'beta');

		// Exercise
		await runPush(ctx, { checkouts: ['alpha'] });

		// Assertions
		expect(await checkoutHasFile(alpha.bareDir, 'alpha-ahead.txt')).toBe(true);
		expect(await checkoutHasFile(beta.bareDir, 'beta-ahead.txt')).toBe(false);
	});

	it('WHEN the workspace option is selected, it pushes the workspace checkout', async () => {
		// Setup
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceGitRepoByOneCommit(workspaceDir, 'workspace-ahead.txt');
		const workspace = makeWorkspaceCheckoutFixture(workspaceDir);
		const ctx = createContext(workspaceDir, workspace);

		// Exercise
		await runPush(ctx, { workspace: true });

		// Assertions
		expect(await checkoutHasFile(bareDir, 'workspace-ahead.txt')).toBe(true);
	});
});
