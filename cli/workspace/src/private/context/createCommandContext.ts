import type { OutputMode } from '@art-lib/logger';
import { createGenericOperation } from '@art-lib/operations';

import { createConfig } from '../cli/createConfig.js';
import { createContext, createWorkspaceOperationsLog } from '../cli/createContext.js';
import { createLogger } from '../logger/createLogger.js';

import type { WorkspaceContext } from './types.js';

const logger = createLogger();

export async function createCommandContext(
	root: string,
	cache: boolean,
	mode?: OutputMode,
): Promise<WorkspaceContext> {
	const operations = createWorkspaceOperationsLog(logger);
	operations.log(createGenericOperation('boot'));
	const config = await createConfig(operations, root, {
		cache,
		verbose: mode === 'verbose',
	});
	const context = createContext(config, logger, operations);
	logger.setOutputMode(mode ?? 'normal');
	return context;
}
