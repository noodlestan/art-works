import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { simpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { advanceGitRepoByOneCommit } from '../../test/helpers/git/advanceGitRepoByOneCommit.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { writeCheckoutRecordFixture } from '../../test/helpers/records/writeCheckoutRecordFixture.js';
import { writeRepoRecordFixture } from '../../test/helpers/records/writeRepoRecordFixture.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runSync } from './runSync.js';

const tempDirs: string[] = [];

function createContext(...args: Parameters<typeof createWorkspaceContextMock>) {
	const ctx = createWorkspaceContextMock(...args);
	vi.mocked(ctx.operations.all).mockReturnValue([]);
	return ctx;
}

function completedOperations(ctx: ReturnType<typeof createContext>) {
	return vi
		.mocked(ctx.operations.log)
		.mock.calls.map(([operation]) => operation)
		.filter(operation => operation.outcome !== 'pending');
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

describe('sync command', () => {
	it('WHEN --all targets a clean checkout, sync pulls and pushes it successfully', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'syncme');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir);
		await advanceBareRepoByOneCommit(tempDirs, bareDir);
		await simpleGit(repoDir).fetch('origin', 'main');

		writeRepoRecordFixture(workspaceDir, 'SyncMe', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'SyncMe', 'SyncMe', 'syncme');

		await runSync(ctx, { all: true });

		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'success' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);

		const checkout = ctx.store.getCheckoutOfRepo('SyncMe');
		expect(checkout?.scan?.state('sync').delta).toBe(0);
		expect(checkout?.scan?.issues()).toEqual([]);

		const verifyDir = makeTempDir(tempDirs);
		await simpleGit(verifyDir).clone(bareDir, verifyDir);
		expect(existsSync(join(verifyDir, 'ahead.txt'))).toBe(true);
		expect(existsSync(join(verifyDir, 'origin.txt'))).toBe(true);
	});

	it('WHEN a checkout is behind origin despite a stale tracking ref, sync updates it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'behindsync');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir);

		writeRepoRecordFixture(workspaceDir, 'BehindSync', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'BehindSync', 'BehindSync', 'behindsync');

		await runSync(ctx, { all: true });

		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'success' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);

		const checkout = ctx.store.getCheckoutOfRepo('BehindSync');
		expect(checkout?.scan?.state('sync').behind).toBe(0);
		expect(checkout?.scan?.issues()).toEqual([]);

		expect(existsSync(join(repoDir, 'origin.txt'))).toBe(true);
	});

	it('WHEN --all targets a checkout with uncommitted changes, sync skips it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'dirtysync');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir);
		await simpleGit(repoDir).fetch('origin', 'main');
		writeFileSync(join(repoDir, 'dirty.txt'), 'dirty');

		writeRepoRecordFixture(workspaceDir, 'DirtySync', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'DirtySync', 'DirtySync', 'dirtysync');

		await runSync(ctx, { all: true });

		const checkout = ctx.store.getCheckoutOfRepo('DirtySync');
		expect(checkout?.scan?.issues()).toEqual(['uncommitted files', '1 commit behind']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN --all targets a checkout that is not cloned, sync skips it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);

		writeRepoRecordFixture(workspaceDir, 'Missing', 'git@example.com:missing.git');
		writeCheckoutRecordFixture(workspaceDir, 'Missing', 'Missing', 'missing');

		await runSync(ctx, { all: true });

		const checkout = ctx.store.getCheckoutOfRepo('Missing');
		expect(checkout?.scan?.state('exists').exists).toBe(false);
		expect(checkout?.scan?.issues()).toEqual(['not cloned']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN --all targets an up-to-date checkout, sync still pulls and pushes it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'current');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });

		writeRepoRecordFixture(workspaceDir, 'Current', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Current', 'Current', 'current');

		await runSync(ctx, { all: true });

		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'success' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);

		const checkout = ctx.store.getCheckoutOfRepo('Current');
		expect(checkout?.scan?.state('sync').delta).toBe(0);
		expect(checkout?.scan?.issues()).toEqual([]);
	});

	it('WHEN the workspace option is absent, sync leaves the workspace root unchanged', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');
		await advanceGitRepoByOneCommit(workspaceDir);

		await runSync(ctx, { all: true });

		expect(existsSync(join(workspaceDir, 'origin-advance.txt'))).toBe(false);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN the workspace option is set, sync pulls and pushes the workspace root', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');
		await advanceGitRepoByOneCommit(workspaceDir);

		await runSync(ctx, { all: true, workspace: true });

		expect(ctx.workspace).toBeDefined();
		expect(ctx.workspace?.scan?.state('sync').delta).toBe(0);
		expect(existsSync(join(workspaceDir, 'origin-advance.txt'))).toBe(true);

		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'success' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);
	});

	it('WHEN pulling the workspace fails, sync skips the push', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'badremote');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);
		await advanceGitRepoByOneCommit(repoDir, 'file2.txt');

		// Point remote to a non-existent path so push will fail
		await simpleGit(repoDir).remote(['set-url', 'origin', join(workspaceDir, 'missing-origin')]);

		writeRepoRecordFixture(workspaceDir, 'BadRemote', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'BadRemote', 'BadRemote', 'badremote');

		await runSync(ctx, { all: true });

		// Pull is attempted and fails; push is skipped.
		const expectedOperations = [expect.objectContaining({ operation: 'pull', outcome: 'failure' })];
		expect(completedOperations(ctx)).toEqual(expectedOperations);
	});
});
