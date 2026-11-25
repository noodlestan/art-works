import type { Command } from 'commander';

export function parseConfigDebugOption(command: Command): boolean {
	return command.optsWithGlobals().configCache !== false;
}
