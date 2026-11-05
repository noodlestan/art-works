import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { advanceBareRepoByOneCommit } from '../../test/helpers/git/advanceBareRepoByOneCommit.js';
import { makeGitBareRepo } from '../../test/helpers/git/makeGitBareRepo.js';
import { makeGitRepo } from '../../test/helpers/git/makeGitRepo.js';
import { makeGitRepoFromBare } from '../../test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { pullCheckout } from './pullCheckout.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('pullCheckout', () => {
	it('WHEN origin has updates it pulls them into the repo', async () => {
		const dir = makeTempDir(tempDirs);
		const { dir: bareDir } = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareDir, { dir });
		await advanceBareRepoByOneCommit(tempDirs, bareDir);

		await pullCheckout(dir, 'main');

		expect(existsSync(join(dir, 'origin.txt'))).toBe(true);
	});

	it('WHEN the pull fails it throws', async () => {
		const dir = makeTempDir(tempDirs);
		await makeGitRepo(tempDirs, { commit: true, dir });

		await expect(pullCheckout(dir, 'main')).rejects.toThrow(
			'Could not read from remote repository.',
		);
	});
});
