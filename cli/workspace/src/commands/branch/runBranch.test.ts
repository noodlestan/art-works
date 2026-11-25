import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceGitRepoByOneCommit } from '../../test/helpers/git/advanceGitRepoByOneCommit.js';
import { makeGitRepo } from '../../test/helpers/git/makeGitRepo.js';
import { writeCheckoutRecordFixture } from '../../test/helpers/records/writeCheckoutRecordFixture.js';
import { writeRepoRecordFixture } from '../../test/helpers/records/writeRepoRecordFixture.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runBranch } from './runBranch.js';

const tempDirs: string[] = [];

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('branch command', () => {
	it('WHEN neither -c nor --all is provided it prints usage and runs nothing', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);

		writeRepoRecordFixture(workspaceDir, 'Art', '');
		writeCheckoutRecordFixture(workspaceDir, 'Art', 'Art', 'art');

		await runBranch(ctx, { branch: 'feat/x' });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const commandOps = ops.filter(op => op.operation === 'command' && op.outcome === 'failure');

		expect(commandOps).toHaveLength(1);
		expect((commandOps[0].data as string[])[0]).toBe('branch');
		expect(commandOps[0].outcome).toBe('failure');
		expect(commandOps[0].text()).toBe('No targets.');
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Usage: Use '));
	});

	it('WHEN a single checkout is specified it creates and checks out a new branch', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'one');
		await makeGitRepo(tempDirs, { dir: repoDir });

		writeRepoRecordFixture(workspaceDir, 'One', 'git@example.com:one.git');
		writeCheckoutRecordFixture(workspaceDir, 'One', 'One', 'one');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['one'] });

		const checkout = ctx.store.getCheckoutOfRepo('One');
		expect(checkout).toBeDefined();
		expect(checkout?.record.branch).toBe('feat/x');

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(1);
		expect(finishedOps[0].operation).toBe('branch');
		expect(finishedOps[0].outcome).toBe('success');
		expect(finishedOps[0].text()).toBe('created feat/x');
	});

	it('WHEN no checkouts are specified it branches all checkouts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'alpha') });
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'beta') });

		writeRepoRecordFixture(workspaceDir, 'Alpha', 'git@example.com:alpha.git');
		writeRepoRecordFixture(workspaceDir, 'Beta', 'git@example.com:beta.git');
		writeCheckoutRecordFixture(workspaceDir, 'Alpha', 'Alpha', 'alpha');
		writeCheckoutRecordFixture(workspaceDir, 'Beta', 'Beta', 'beta');

		await runBranch(ctx, { branch: 'feat/x', all: true });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(2);
		expect(finishedOps.every(o => o.operation === 'branch' && o.outcome === 'success')).toBe(true);
		expect(ctx.store.getCheckoutOfRepo('Alpha')?.record.branch).toBe('feat/x');
		expect(ctx.store.getCheckoutOfRepo('Beta')?.record.branch).toBe('feat/x');
	});

	it('WHEN the pattern matches no checkouts it warns and skips', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, {
			dir: join(workspaceDir, ctx.config.checkouts.path, 'checkouts/one'),
		});

		writeRepoRecordFixture(workspaceDir, 'One', 'git@example.com:one.git');
		writeCheckoutRecordFixture(workspaceDir, 'One', 'One', 'one');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['Nope'] });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(0);
		expect(console.warn).toHaveBeenCalledWith('no checkout matches pattern: "Nope"');
	});

	it('WHEN a checkout is not cloned it logs a failure and continues', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, {
			dir: join(workspaceDir, ctx.config.checkouts.path, 'checkouts/good'),
		});

		writeRepoRecordFixture(workspaceDir, 'Good', 'git@example.com:good.git');
		writeRepoRecordFixture(workspaceDir, 'Missing', 'git@example.com:missing.git');
		writeCheckoutRecordFixture(workspaceDir, 'Good', 'Good', 'good');
		writeCheckoutRecordFixture(workspaceDir, 'Missing', 'Missing', 'missing');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['Missing', 'Good'] });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps.length).toEqual(2);
		const failure = finishedOps.find(o => o.outcome === 'failure');
		expect(failure).toBeDefined();
		expect(failure?.operation).toBe('branch');
		expect(failure?.text()).toContain('not cloned');
		expect(ctx.store.getCheckoutOfRepo('Good')?.record.branch).toBe('main');
	});

	it('WHEN a checkout has no matching repository it still branches it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'conv') });

		writeCheckoutRecordFixture(workspaceDir, 'Conv', 'Conv', 'conv');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['conv'] });

		const checkout = ctx.store.getCheckoutForLocation('conv');
		expect(checkout).toBeDefined();
		expect(checkout?.repo).toBeUndefined();
		expect(checkout?.record.branch).toBe('feat/x');
		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(1);
		expect(finishedOps[0].outcome).toBe('success');
		expect(finishedOps[0].text()).toBe('created feat/x');
	});

	it('WHEN the branch already exists it switches to it', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'one');
		const { git } = await makeGitRepo(tempDirs, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		await git.checkoutLocalBranch('feat/x');
		await git.checkoutLocalBranch('feat/y');

		writeRepoRecordFixture(workspaceDir, 'One', 'git@example.com:one.git');
		writeCheckoutRecordFixture(workspaceDir, 'One', 'One', 'one');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['one'] });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(1);
		expect(finishedOps[0].outcome).toBe('success');
		expect(finishedOps[0].text()).toBe('switched to feat/x');
		expect(ctx.store.getCheckoutOfRepo('One')?.record.branch).toBe('feat/x');
	});

	it('WHEN the pattern is a wildcard it branches the matching checkouts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'alpha') });
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'beta') });

		writeRepoRecordFixture(workspaceDir, 'Alpha', 'git@example.com:alpha.git');
		writeRepoRecordFixture(workspaceDir, 'Beta', 'git@example.com:beta.git');
		writeCheckoutRecordFixture(workspaceDir, 'Alpha', 'Alpha', 'alpha');
		writeCheckoutRecordFixture(workspaceDir, 'Beta', 'Beta', 'beta');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['a*'] });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(1);
		expect(finishedOps[0].operation).toBe('branch');
		expect(finishedOps[0].outcome).toBe('success');
		expect(ctx.store.getCheckoutOfRepo('Alpha')?.record.branch).toBe('feat/x');
		expect(ctx.store.getCheckoutOfRepo('Beta')?.record.branch).toBe('main');
	});

	it('WHEN the pattern matches no checkouts it warns and skips', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		await makeGitRepo(tempDirs, { dir: join(workspaceDir, ctx.config.checkouts.path, 'alpha') });

		writeRepoRecordFixture(workspaceDir, 'Alpha', 'git@example.com:alpha.git');
		writeCheckoutRecordFixture(workspaceDir, 'Alpha', 'Alpha', 'alpha');

		await runBranch(ctx, { branch: 'feat/x', checkouts: ['nonexistent'] });

		const ops = vi.mocked(ctx.operations.log).mock.calls.map(c => c[0]);
		const finishedOps = ops.filter(op => op.outcome !== 'pending');
		expect(finishedOps).toHaveLength(0);
		expect(console.warn).toHaveBeenCalledWith('no checkout matches pattern: "nonexistent"');
	});
});
