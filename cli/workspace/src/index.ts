#!/usr/bin/env node
import { Command } from 'commander';

import { runBranch } from './commands/branch/runBranch.js';
import { runCheckoutsRun } from './commands/checkouts/runCheckoutsRun.js';
import { runClone } from './commands/clone/runClone.js';
import { runInit } from './commands/init/runInit.js';
import { runLink } from './commands/link/runLink.js';
import { runPublish } from './commands/publish/runPublish.js';
import { runPull } from './commands/pull/runPull.js';
import { runPush } from './commands/push/runPush.js';
import { runRepo } from './commands/repo/runRepo.js';
import { runSanity } from './commands/sanity/runSanity.js';
import { runSync } from './commands/sync/runSync.js';
import { runUnlink } from './commands/unlink/runUnlink.js';
import { createCommandContext } from './private/context/createCommandContext.js';
import { parseOutputMode } from './private/logger/createLogger.js';

const program = new Command();

program
	.name('art-workspace-cli')
	.description('Workspace orchestration CLI')
	.version(__BUILD_VERSION__);

program.option('--no-config-cache', 'Ignore the config cache and recompile the config');
program.option('-o, --output <mode>', 'One of quiet | normal(default) | verbose');

type InitOptions = Record<string, never>;

program
	.command('init')
	.description('Create a configuration file with default values')
	.action(async (options: InitOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		const created = await runInit(ctx, { root });

		if (!created) {
			process.exitCode = 1;
		}
	});

type SanityOptions = { auto?: boolean; refetch?: boolean };

program
	.command('sanity')
	.description('Check git status across all repos')
	.option('-a, --auto', 'push clean unpushed repos')
	.option('-r, --refetch', 'fetch ahead/behind data from remote')
	.action(async (options: SanityOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		const auto = options.auto ?? false;
		const refetch = options.refetch ?? false;
		await runSanity(ctx, { auto, refetch });
	});

type CloneOptions = { all?: boolean };

program
	.command('clone')
	.description('Clone repos from manifest')
	.option('-a, --all', 'clone all repos')
	.argument('[name]', 'repo name to clone')
	.argument('[target]', 'target location (relative to checkouts path)')
	.action(
		async (
			repoName: string | undefined,
			checkoutInput: string | undefined,
			options: CloneOptions,
			command: Command,
		) => {
			const root = process.cwd();
			const ctx = await createCommandContext(
				root,
				command,
				parseOutputMode(command.optsWithGlobals().output),
			);

			await runClone(ctx, { all: options.all, repoName, checkoutInput });
		},
	);

type BranchOptions = { checkouts?: string[]; all?: boolean };

program
	.command('branch')
	.description('Branch across checkouts')
	.argument('<branch>', 'branch name to create or switch to')
	.option(
		'-c, --checkouts <PATTERN...>',
		'One or more. Matches checkout name and location. Wildcard asterisk * supported. Example: -c "* @ refactor" "lib-*"',
	)
	.option('-a, --all', 'Apply to all checkouts')
	.action(async (branch: string, options: BranchOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runBranch(ctx, { branch, checkouts: options.checkouts, all: options.all });
	});

type PullOptions = { checkouts?: string[]; all?: boolean; workspace?: boolean };

program
	.command('pull')
	.description('Pull clean checkouts that are behind')
	.option(
		'-c, --checkouts <PATTERN...>',
		'One or more. Matches checkout name and location. Wildcard asterisk * supported. Example: -c "* @ refactor" "lib-*"',
	)
	.option('-a, --all', 'Apply to all checkouts')
	.option('-w, --workspace', 'Also apply the command to the workspace root')
	.action(async (options: PullOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runPull(ctx, {
			checkouts: options.checkouts,
			all: options.all,
			workspace: options.workspace,
		});
	});

type PushOptions = { checkouts?: string[]; all?: boolean; workspace?: boolean };

program
	.command('push')
	.description('Push clean checkouts that are ahead')
	.option(
		'-c, --checkouts <PATTERN...>',
		'One or more. Matches checkout name and location. Wildcard asterisk * supported. Example: -c "* @ refactor" "lib-*"',
	)
	.option('-a, --all', 'Apply to all checkouts')
	.option('-w, --workspace', 'Also apply the command to the workspace root')
	.action(async (options: PushOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runPush(ctx, {
			checkouts: options.checkouts,
			all: options.all,
			workspace: options.workspace,
		});
	});

type SyncOptions = { checkouts?: string[]; all?: boolean; workspace?: boolean };

program
	.command('sync')
	.description('Pull and push clean checkouts')
	.option(
		'-c, --checkouts <PATTERN...>',
		'One or more. Matches checkout name and location. Wildcard asterisk * supported. Example: -c "* @ refactor" "lib-*"',
	)
	.option('-a, --all', 'Apply to all checkouts')
	.option('-w, --workspace', 'Also apply the command to the workspace root')
	.action(async (options: SyncOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runSync(ctx, {
			checkouts: options.checkouts,
			all: options.all,
			workspace: options.workspace,
		});
	});

type CheckoutsRunOptions = { checkouts?: string[]; all?: boolean };

program
	.command('checkouts')
	.description('Checkout operations')
	.command('run')
	.description('Run a command in selected checkouts')
	.argument('<command>', 'command to run')
	.option(
		'-c, --checkouts <PATTERN...>',
		'One or more. Matches checkout name and location. Wildcard asterisk * supported. Example: -c "* @ refactor" "lib-*"',
	)
	.option('-a, --all', 'Apply to all checkouts')
	.action(async (shellCommand: string, options: CheckoutsRunOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runCheckoutsRun(ctx, {
			command: shellCommand,
			checkouts: options.checkouts,
			all: options.all,
		});
	});

type RepoOptions = Record<string, never>;

program
	.command('repo')
	.description('List checkout resources')
	.argument('[checkouts...]', 'checkout locations to list (default: all checkouts)')
	.action(async (locations: string[], options: RepoOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runRepo(ctx, { locations });
	});

type LinkOptions = Record<string, never>;

program
	.command('link')
	.description('Link packages for local dev')
	.action(async (options: LinkOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runLink(ctx, { root });
	});

type UnlinkOptions = Record<string, never>;

program
	.command('unlink')
	.description('Unlink packages')
	.action(async (options: UnlinkOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runUnlink(ctx, { root });
	});

type PublishOptions = { auto?: boolean };

program
	.command('publish')
	.description('Publish packages')
	.option('-a, --auto', 'auto-publish')
	.action(async (options: PublishOptions, command: Command) => {
		const root = process.cwd();
		const ctx = await createCommandContext(
			root,
			command,
			parseOutputMode(command.optsWithGlobals().output),
		);

		await runPublish(ctx, { root, auto: options.auto });
	});

program.parse();
