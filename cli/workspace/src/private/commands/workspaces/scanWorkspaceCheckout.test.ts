import { afterEach, describe, expect, it } from 'vitest';

import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeGitRepo } from '../../../test/helpers/git/makeGitRepo.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { scanWorkspaceCheckout } from './scanWorkspaceCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('scanWorkspaceCheckout', () => {
	it('WHEN the workspace root exists it scans it and sets ctx.workspace', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		await makeGitRepo(tempDirs, { dir: workspaceDir });
		const ctx = createWorkspaceContextMock(workspaceDir);

		const result = await scanWorkspaceCheckout(ctx);

		expect(result).toBeDefined();
		expect(ctx.workspace).toBe(result);
		expect(result?.record.name).toBe('Workspace');
		expect(result?.record.location).toBe('-');
		expect(result?.scan?.state('exists').exists).toBe(true);
		expect(result?.scan?.state('git-dir').hasGit).toBe(true);
	});

	it('WHEN a refetch is requested it re-scans with refetch', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		await makeGitRepo(tempDirs, { dir: workspaceDir });
		const ctx = createWorkspaceContextMock(workspaceDir);

		const result = await scanWorkspaceCheckout(ctx, true);

		expect(result).toBeDefined();
		expect(ctx.workspace).toBe(result);
		expect(result?.scan?.state('exists').exists).toBe(true);
	});

	it('WHEN the workspace root has no git it returns a not-cloned scan', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);

		const result = await scanWorkspaceCheckout(ctx);

		expect(result).toBeDefined();
		expect(ctx.workspace).toBe(result);
		expect(result?.scan?.state('exists').exists).toBe(true);
		expect(result?.scan?.state('git-dir').hasGit).toBe(false);
		expect(result?.scan?.issues()).toContain('no git');
	});
});
