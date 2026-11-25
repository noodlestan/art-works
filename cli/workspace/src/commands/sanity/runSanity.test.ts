/* eslint-disable no-console */
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

import { runSanity } from './runSanity.js';

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

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sanity command', () => {
	it('WHEN a checkout is missing it reports "not cloned"', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createContext(workspaceDir);

		writeRepoRecordFixture(workspaceDir, 'Foo Bar', 'git@example.com:foo-bar.git');
		writeCheckoutRecordFixture(workspaceDir, 'Foo Bar', 'Foo Bar', 'foo-bar', 'ouch');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(false);
		expect(checkouts[0].scan?.issues()).toEqual(['not cloned']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN all repos are clean it shows repo status', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'green');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);

		writeRepoRecordFixture(workspaceDir, 'Green', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Green', 'Green', 'green');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual([]);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN the repo is dirty it shows the repo with issues', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'dirty');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		writeFileSync(join(repoDir, 'dirty.txt'), 'dirty');

		writeRepoRecordFixture(workspaceDir, 'Dirty', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Dirty', 'Dirty', 'dirty');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual(['uncommitted files']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN it runs without --auto it shows a clean unpushed repo', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'unpushed');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');

		writeRepoRecordFixture(workspaceDir, 'Unpushed', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Unpushed', 'Unpushed', 'unpushed');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual(['1 commit ahead']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN --auto is set it pushes the clean unpushed repo', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'autopush');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);
		await advanceGitRepoByOneCommit(repoDir, 'file2.txt');

		writeRepoRecordFixture(workspaceDir, 'AutoPush', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'AutoPush', 'AutoPush', 'autopush');

		await runSanity(ctx, { auto: true });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual([]);
		const expectedOperations = [expect.objectContaining({ operation: 'push', outcome: 'success' })];
		expect(completedOperations(ctx)).toEqual(expectedOperations);
	});

	it('WHEN --auto is set it does not push a dirty repo', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'dirtynoauto');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		writeFileSync(join(repoDir, 'dirty.txt'), 'dirty');

		writeRepoRecordFixture(workspaceDir, 'DirtyNoAuto', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'DirtyNoAuto', 'DirtyNoAuto', 'dirtynoauto');

		await runSanity(ctx, { auto: true });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual(['uncommitted files', '1 commit ahead']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN HEAD is detached it surfaces detached HEAD', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'detached');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);
		const headSha = await git.revparse(['HEAD']);
		await git.checkout(headSha.trim());

		writeRepoRecordFixture(workspaceDir, 'Detached', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Detached', 'Detached', 'detached');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual(['detached HEAD']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN a merge conflict exists it surfaces merge conflicts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'conflict');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);

		await git.checkoutLocalBranch('feature');
		writeFileSync(join(repoDir, 'file.txt'), 'feature');
		await git.add('.');
		await git.commit('feature change');

		await git.checkout('main');
		writeFileSync(join(repoDir, 'file.txt'), 'main');
		await git.add('.');
		await git.commit('main change');

		try {
			await git.merge(['feature']);
		} catch {
			// empty
		}

		writeRepoRecordFixture(workspaceDir, 'Conflict', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Conflict', 'Conflict', 'conflict');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual([
			'merge conflicts',
			'uncommitted files',
			'1 commit ahead',
		]);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN the report is printed it filters "unknown project" from the workspace output', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'green');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);

		writeRepoRecordFixture(workspaceDir, 'Green', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'Green', 'Green', 'green');

		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

		await runSanity(ctx, { auto: false });

		const output = infoSpy.mock.calls.map(c => c[0]).join('\n');
		const workspaceSection = output.split('Workspace:')[1]?.split('Checkouts:')[0] || '';
		expect(workspaceSection).not.toContain('unknown project');

		vi.restoreAllMocks();
	});

	it('WHEN the repo record is missing it reports "unknown project"', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'orphan');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });

		writeCheckoutRecordFixture(workspaceDir, 'Orphan', 'Orphan', 'orphan');

		await runSanity(ctx, { auto: false });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('exists').exists).toEqual(true);
		expect(checkouts[0].scan?.issues()).toEqual(['unknown project']);
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN a directory is untracked it appears in the Extraneous Report', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'orphan');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');

		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

		await runSanity(ctx, { auto: false });

		const output = infoSpy.mock.calls.map(c => c[0]).join('\n');
		expect(output).toContain('Untracked:');
		expect(output).toContain('orphan');

		vi.restoreAllMocks();
	});

	it('WHEN both reports are printed the workspace report comes before the checkout report', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'test');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });

		writeRepoRecordFixture(workspaceDir, 'Test', 'git@example.com:test.git');
		writeCheckoutRecordFixture(workspaceDir, 'Test', 'Test', 'test');

		const calls: string[] = [];
		vi.spyOn(console, 'info').mockImplementation((msg: string) => {
			if (msg === 'Workspace:' || msg === 'Checkouts:') {
				calls.push(msg);
			}
		});

		await runSanity(ctx, { auto: false });

		expect(calls[0]).toEqual('Workspace:');
		expect(calls[1]).toEqual('Checkouts:');

		vi.restoreAllMocks();
	});

	it('WHEN the workspace root is behind origin it detects the behind state', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');

		await runSanity(ctx, { auto: false });

		expect(ctx.workspace).toBeDefined();
		expect(ctx.workspace?.scan?.state('sync').behind).toEqual(1);
		expect(ctx.workspace?.scan?.issues()).toContain('1 commit behind');
	});

	it('WHEN the workspace root is behind and clean it syncs with --auto', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');

		await runSanity(ctx, { auto: true });

		expect(ctx.workspace).toBeDefined();
		expect(ctx.workspace?.scan?.state('sync').behind).toEqual(0);
		expect(existsSync(join(workspaceDir, 'origin-advance.txt'))).toEqual(true);
		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'success' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);
	});

	it('WHEN the workspace root is dirty it does not pull with --auto', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');
		writeFileSync(join(workspaceDir, 'dirty.txt'), 'dirty');

		await runSanity(ctx, { auto: true });

		expect(ctx.workspace).toBeDefined();
		expect(ctx.workspace?.scan?.issues()).toContain('uncommitted files');
		expect(ctx.workspace?.scan?.issues()).toContain('1 commit behind');
		expect(completedOperations(ctx)).toEqual([]);
	});

	it('WHEN the workspace pull fails it logs the failure and continues', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: workspaceDir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'origin-advance.txt');
		await simpleGit(workspaceDir).fetch('origin', 'main');

		const { dir: checkoutBare } = await makeGitBareRepo(tempDirs);
		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'autopush');
		await makeGitRepoFromBare(tempDirs, checkoutBare, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);
		await advanceGitRepoByOneCommit(repoDir, 'file2.txt');

		writeRepoRecordFixture(workspaceDir, 'AutoPush', 'git@example.com:autopush.git');
		writeCheckoutRecordFixture(workspaceDir, 'AutoPush', 'AutoPush', 'autopush');

		writeFileSync(join(workspaceDir, '.gitignore'), 'checkouts/\n');
		const rootGit = simpleGit(workspaceDir);
		await rootGit.add(['.gitignore', '_records/']);
		await rootGit.commit('workspace records');

		await simpleGit(workspaceDir).remote([
			'set-url',
			'origin',
			join(workspaceDir, 'missing-origin'),
		]);

		await runSanity(ctx, { auto: true });

		const expectedOperations = [
			expect.objectContaining({ operation: 'pull', outcome: 'failure' }),
			expect.objectContaining({ operation: 'push', outcome: 'success' }),
		];
		expect(completedOperations(ctx)).toEqual(expectedOperations);
	});

	it('WHEN refetch is true it detects the behind state for checkouts', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createContext(workspaceDir);

		const repoDir = join(workspaceDir, ctx.config.checkouts.path, 'refetchsanity');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: repoDir });
		await advanceGitRepoByOneCommit(repoDir, 'file.txt');
		const git = simpleGit(repoDir);
		await git.push('origin', 'main', ['--set-upstream']);

		// Advance the remote from a separate clone
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'remote-advance.txt');

		writeRepoRecordFixture(workspaceDir, 'RefetchSanity', bareDir);
		writeCheckoutRecordFixture(workspaceDir, 'RefetchSanity', 'RefetchSanity', 'refetchsanity');

		await runSanity(ctx, { auto: false, refetch: true });

		const checkouts = ctx.store.getAllCheckouts();
		expect(checkouts.length).toEqual(1);
		expect(checkouts[0].scan?.state('sync').behind).toBe(1);
		expect(checkouts[0].scan?.issues()).toContain('1 commit behind');
	});
});
