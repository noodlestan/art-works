import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { makeTempDir } from '../src/test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../src/test/helpers/tempDirs/removeTempDirs.js';

import { ENCODING, PACKAGE_ROOT } from './helpers/constants.js';
import { setupWorkspace } from './helpers/setupWorkspace.js';
import { spawnCli } from './helpers/spawnCli.js';
import { type TestCliResult } from './helpers/types.js';

const MANIFEST_FILE = '.art-workspace.mts';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

/** Commands report on stdout, commander errors on stderr — assertions read both. */
function output(result: TestCliResult): string {
	return result.stdout + result.stderr;
}

describe('cli integration', () => {
	describe('bin', () => {
		it('WHEN asked for the version, prints the bin package version', async () => {
			const packageJson = await readFile(join(PACKAGE_ROOT, 'package.json'), ENCODING);
			const manifest = JSON.parse(packageJson);

			const result = await spawnCli({ args: ['--version'] });

			expect(result.code).toBe(0);
			expect(result.stdout.trim()).toBe(manifest.version);
		});

		it('WHEN asked for help, lists every implemented command', async () => {
			const result = await spawnCli({ args: ['--help'] });

			expect(result.code).toBe(0);
			expect(result.stdout).toContain('Commands:');
			for (const command of [
				'sanity',
				'init',
				'clone',
				'branch',
				'pull',
				'sync',
				'checkouts',
				'repo',
			]) {
				expect(result.stdout).toContain(command);
			}
		});

		it('WHEN given an unknown command, rejects and lists valid commands', async () => {
			const result = await spawnCli({ args: ['bogus'] });

			expect(result.code).toBe(1);
			expect(output(result)).toContain("unknown command 'bogus'");
		});

		it('WHEN given an unknown option, rejects with the option name', async () => {
			const result = await spawnCli({ args: ['sanity', '--bogus'] });

			expect(result.code).toBe(1);
			expect(output(result)).toContain("unknown option '--bogus'");
		});
	});

	describe('config', () => {
		it('WHEN a manifest exists in the cwd, loads it instead of warning', async () => {
			const root = await setupWorkspace(tempDirs);

			const result = await spawnCli({ args: ['sanity'], cwd: root });

			expect(result.code).toBe(0);
			expect(output(result)).not.toContain('not found at');
			// `process.cwd()` reports the symlink-resolved temp path on macOS
			expect(output(result)).toContain(
				`Running from config at ${join(realpathSync(root), MANIFEST_FILE)}`,
			);
		});

		it('WHEN no manifest exists in the cwd or any parent, advertises running without config', async () => {
			const root = makeTempDir(tempDirs);

			const result = await spawnCli({ args: ['sanity'], cwd: root });

			expect(result.code).toBe(0);
			expect(output(result)).toContain('running without config');
		});

		it('WHEN the manifest is malformed, reports the manifest path', async () => {
			const root = await setupWorkspace(tempDirs);
			writeFileSync(join(root, '.art-workspace.mts'), 'export default {{{');

			const result = await spawnCli({ args: ['sanity'], cwd: root });

			expect(result.code).toBe(1);
			expect(output(result)).toContain('workspace manifest at');
			expect(output(result)).toContain('.art-workspace.mts');
		});
	});

	describe('commands', () => {
		describe('init', () => {
			it('WHEN invoked in an empty directory, creates the manifest with the default values', async () => {
				const root = makeTempDir(tempDirs);

				const result = await spawnCli({ args: ['init'], cwd: root });

				const content = readFileSync(join(root, MANIFEST_FILE), ENCODING);

				expect(result.code).toBe(0);
				expect(output(result)).toContain(`Created ${MANIFEST_FILE} at`);
				expect(content).toContain('root: { path: process.cwd() }');
				expect(content).toContain("checkouts: { path: 'checkouts' }");
				expect(content).toContain('store:');
				expect(content).toContain('discover:');
				expect(content).toContain('records:');
				expect(content).not.toContain('clone');
			});

			it('WHEN the manifest already exists, refuses to overwrite it and exits non-zero', async () => {
				const root = makeTempDir(tempDirs);
				writeFileSync(join(root, MANIFEST_FILE), 'export default {};');

				const result = await spawnCli({ args: ['init'], cwd: root });

				expect(result.code).toBe(1);
				expect(output(result)).toContain(`${MANIFEST_FILE} already exists at`);
				expect(readFileSync(join(root, MANIFEST_FILE), ENCODING)).toBe('export default {};');
			});

			it('WHEN the manifest was created, subsequent runs discover and load it', async () => {
				const root = makeTempDir(tempDirs);
				await spawnCli({ args: ['init'], cwd: root });

				const result = await spawnCli({ args: ['sanity'], cwd: root });

				expect(result.code).toBe(0);
				expect(output(result)).not.toContain('not found at');
				// `process.cwd()` reports the symlink-resolved temp path on macOS
				expect(output(result)).toContain(
					`Running from config at ${join(realpathSync(root), MANIFEST_FILE)}`,
				);
			});
		});

		describe('sanity', () => {
			it('WHEN invoked by name only, runs and prints a checkout report', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['sanity'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Checkouts:');
				expect(result.stdout).toContain('Art Works');
			});

			it('WHEN given --auto, accepts the option and runs', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['sanity', '--auto'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Checkouts:');
			});
		});

		describe('clone', () => {
			it('WHEN invoked by name only, runs with no targets', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['clone'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Checkouts:');
			});

			it('WHEN given --all, accepts the option and runs', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['clone', '--all'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Checkouts:');
			});
		});

		describe('repo', () => {
			it('WHEN invoked by name only, lists every repository', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['repo'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Repository:');
				expect(result.stdout).toContain('Art Works');
			});

			it('WHEN given a checkout location, lists that repository', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['repo', 'art-works'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Repository:');
			});
		});

		describe('branch', () => {
			it('WHEN invoked by name only, rejects with missing required argument', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['branch'], cwd: root });

				expect(result.code).toBe(1);
				expect(output(result)).toContain("missing required argument 'branch'");
			});

			it('WHEN given a branch with --all, accepts and runs', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['branch', 'main', '--all'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Operations:');
			});
		});

		describe('pull', () => {
			it('WHEN invoked by name only, prints the selection usage text', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['pull'], cwd: root });

				expect(output(result)).toContain('No targets.');
				expect(output(result)).toContain('Use `pull -c <pattern>`');
			});

			it('WHEN given --all, accepts and runs', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['pull', '--all'], cwd: root });

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Checkouts:');
			});
		});

		describe('checkouts run', () => {
			it('WHEN invoked without a command, rejects with missing required argument', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({ args: ['checkouts', 'run'], cwd: root });

				expect(result.code).toBe(1);
				expect(output(result)).toContain("missing required argument 'command'");
			});

			it('WHEN given a command with --all, accepts and runs', async () => {
				const root = await setupWorkspace(tempDirs);

				const result = await spawnCli({
					args: ['checkouts', 'run', 'echo', 'hi', '--all'],
					cwd: root,
				});

				expect(result.code).toBe(0);
				expect(result.stdout).toContain('Operations:');
			});
		});
	});

	describe('checkout selection options (-c, --all)', () => {
		it('WHEN -c matches a checkout, it is selected', async () => {
			const root = await setupWorkspace(tempDirs);

			const result = await spawnCli({ args: ['pull', '-c', 'art-works'], cwd: root });

			expect(result.code).toBe(0);
			expect(result.stdout).toContain('Art Works');
		});

		it('WHEN -c matches no checkout, it reports so', async () => {
			const root = await setupWorkspace(tempDirs);

			const result = await spawnCli({ args: ['pull', '-c', 'nope'], cwd: root });

			expect(result.code).toBe(0);
			expect(output(result)).toContain('no checkout matches pattern');
		});
	});

	describe('output option (-o, --output)', () => {
		it('WHEN verbose is given, it streams operations', async () => {
			const root = await setupWorkspace(tempDirs);

			const result = await spawnCli({ args: ['sanity', '--output', 'verbose'], cwd: root });

			expect(result.code).toBe(0);
			expect(result.stdout).toContain('| boot |');
		});

		it('WHEN quiet is given, it prints only the report', async () => {
			const root = await setupWorkspace(tempDirs);

			const result = await spawnCli({ args: ['sanity', '--output', 'quiet'], cwd: root });

			expect(result.code).toBe(0);
			expect(result.stdout).not.toContain('| boot |');
			expect(result.stdout).toContain('Checkouts:');
		});
	});
});
