import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';
import { advanceBareRepoByOneCommit } from '../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepo } from '../../test/helpers/git/makeGitRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';
import type { RepositoryRecord } from '../resources/types.js';
import { createCheckout } from '../store/createCheckout.js';

import { scanCheckoutState } from './scanCheckoutState.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('scanCheckoutState', () => {
	it('WHEN the dir is missing it returns an exists state and a not-cloned issue', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = createCheckout(ctx.config, 'nope');

		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.state('exists')).toEqual({ type: 'exists', exists: false });
		expect(result.scan?.issues()).toContain('not cloned');
		expect(result.scan?.can('clone')).toBe(true);
		expect(result.scan?.should('clone')).toBe(true);
	});

	it('WHEN the record branch is empty no wrong-branch issue is produced', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'extraneous');
		await makeGitRepo(tempDirs, { dir: checkoutDir });

		const checkout = createCheckout(ctx.config, 'extraneous', undefined, '');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.issues()).toContain('unknown project');
		expect(result.scan?.issues()).not.toContain('wrong branch');
	});

	it('WHEN the record branch matches the actual branch no wrong-branch issue is produced', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'myrepo');
		await makeGitRepo(tempDirs, { dir: checkoutDir });

		const checkout = createCheckout(ctx.config, 'myrepo', undefined, 'main');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.issues()).not.toContain('wrong branch');
	});

	it('WHEN the record branch mismatches the actual branch it produces a wrong-branch issue', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'myrepo');
		await makeGitRepo(tempDirs, { dir: checkoutDir });

		const checkout = createCheckout(ctx.config, 'myrepo', undefined, 'develop');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.issues()).toContain('wrong branch');
	});

	it('WHEN the record remote matches the actual remote no wrong-remote issue is produced', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'myrepo');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: checkoutDir });

		const repo: RepositoryRecord = {
			name: 'MyRepo',
			remote: bareDir,
		};
		const checkout = createCheckout(ctx.config, 'myrepo', repo, 'main');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.issues()).not.toContain('wrong remote');
	});

	it('WHEN the record remote mismatches the actual remote it produces a wrong-remote issue', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'myrepo');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: checkoutDir });

		const repo: RepositoryRecord = {
			name: 'MyRepo',
			remote: 'git@github.com:noodlestan/foo.git',
		};
		const checkout = createCheckout(ctx.config, 'myrepo', repo, 'main');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.issues()).toContain('wrong remote');
	});

	it('WHEN the tracking ref is stale a cheap scan reports no behind and a refetch reports behind', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'refetch');
		await makeGitRepoFromBare(tempDirs, bareDir, { dir: checkoutDir });

		// Push an additional commit from a second clone so the working repo's tracking ref is stale.
		await advanceBareRepoByOneCommit(tempDirs, bareDir, 'remote-commit.txt');

		const repo: RepositoryRecord = {
			name: 'RefetchRepo',
			remote: bareDir,
		};
		const checkout = createCheckout(ctx.config, 'refetch', repo, 'main');

		// Cheap scan (refetch false) — local tracking ref is stale, so behind = 0.
		const cheap = await scanCheckoutState(ctx, checkout);
		expect(cheap.scan?.state('sync').behind).toBe(0);

		// Refetch scan (refetch true) — fetches from origin, so behind = 1.
		const refreshed = await scanCheckoutState(ctx, checkout, true);
		expect(refreshed.scan?.state('sync').behind).toBe(1);
	});

	it('WHEN the checkout dir has no .git it reports a no-git state', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = createCheckout(ctx.config, 'norepo', undefined, '');
		await mkdir(checkout.path, { recursive: true });

		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.state('git-dir')).toEqual({ type: 'git-dir', hasGit: false });
		expect(result.scan?.issues()).toContain('no git');
	});

	it('WHEN the checkout dir has a .git it reports a git-dir state', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, ctx.config.checkouts.path, 'myrepo');
		await makeGitRepo(tempDirs, { dir: checkoutDir });

		const checkout = createCheckout(ctx.config, 'myrepo', undefined, 'main');
		const result = await scanCheckoutState(ctx, checkout);

		expect(result.scan?.state('git-dir')).toEqual({ type: 'git-dir', hasGit: true });
		expect(result.scan?.issues()).not.toContain('no git');
	});
});
