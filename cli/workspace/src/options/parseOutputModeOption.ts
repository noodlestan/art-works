import type { OutputMode } from '@art-lib/logger';
import type { Command } from 'commander';

/**
 * Converts the raw `-o` argv string once, at the commander boundary: the rest
 * of the CLI only ever sees an `OutputMode`. Anything but `quiet` or `verbose`
 * falls back to `normal`.
 */
export function parseOutputModeOption(command: Command): OutputMode {
	const value = command.optsWithGlobals().output;
	return value === 'quiet' || value === 'verbose' ? value : 'normal';
}
