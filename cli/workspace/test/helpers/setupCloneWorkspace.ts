import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeGitBareRepo } from '../../src/test/helpers/git/makeGitBareRepo.js';
import { makeGitRepoFromBare } from '../../src/test/helpers/git/makeGitRepoFromBare.js';
import { makeTempDir } from '../../src/test/helpers/tempDirs/makeTempDir.js';

const TEST_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(TEST_ROOT, 'fixture-repo');

const repositories = [
	{ name: 'Alpha', location: 'alpha' },
	{ name: 'Beta', location: 'beta' },
] as const;

export async function setupCloneWorkspace(
	tempDirs: string[],
): Promise<{ root: string; locations: string[] }> {
	const root = makeTempDir(tempDirs);
	cpSync(FIXTURE, root, { recursive: true });
	const recordsDir = join(root, '_records');
	writeFileSync(
		join(root, '.art-workspace.mts'),
		"export default { clone: { path: 'checkouts' }, checkouts: { path: 'checkouts' }, output: { mode: 'quiet' } };\n",
	);

	rmSync(join(recordsDir, 'art-works-checkout.art'));
	rmSync(join(recordsDir, 'art-works.art'));

	for (const repository of repositories) {
		const bareRepo = await makeGitBareRepo(tempDirs);
		await makeGitRepoFromBare(tempDirs, bareRepo.dir);
		writeFileSync(
			join(recordsDir, `${repository.location}.art`),
			`# Module\n\n## Repository: ${repository.name}\n\n**Purpose:** Integration fixture\n\n**Remote:** \`${bareRepo.dir}\`\n`,
		);
		writeFileSync(
			join(recordsDir, `${repository.location}-checkout.art`),
			`# Module\n\n## Checkout: ${repository.name}\n\n**Repository:** ${repository.name}\n\n**Location:** \`${repository.location}\`\n\n**Branch:** \`main\`\n`,
		);
	}

	// Ensure the clone destinations do not exist before the CLI runs.
	const checkoutsDir = join(root, 'checkouts');
	mkdirSync(checkoutsDir, { recursive: true });

	return { root, locations: repositories.map(({ location }) => location) };
}
