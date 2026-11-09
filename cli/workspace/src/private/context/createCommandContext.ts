import type { OutputMode } from '@art-lib/logger';
import { createGenericOperation } from '@art-lib/operations';
import type { Command } from 'commander';

import { createConfig } from '../cli/createConfig.js';
import { createContext } from '../cli/createContext.js';
import { createLogger } from '../logger/createLogger.js';

import type { WorkspaceContext } from './types.js';

const logger = createLogger();

export async function createCommandContext(
	root: string,
	command: Command,
	mode?: OutputMode,
): Promise<WorkspaceContext> {
	logger.log(createGenericOperation('boot'));
	const config = await createConfig(logger, root, {
		cache: command.optsWithGlobals().configCache !== false,
		verbose: mode === 'verbose',
	});
	const context = createContext(config, logger);
	logger.setOutputMode(mode ?? 'normal');
	return context;
}
