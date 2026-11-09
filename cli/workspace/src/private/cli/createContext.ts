import { createFSRecordsAdapter } from '@art-lib/fs-records';
import { createGenericOperation } from '@art-lib/operations';
import { createArtCodec } from '@art-md/codec';

import type { WorkspaceConfig } from '../../config/types.js';
import { createWorkspaceContext } from '../context/createWorkspaceContext.js';
import type { WorkspaceContext } from '../context/types.js';
import { createOperationsLog } from '../log/createOperationsLog.js';
import type { LoggerAPI as Logger } from '../logger/createLogger.js';
import { createCheckoutStore } from '../store/createCheckoutStore.js';

export function createContext(config: WorkspaceConfig, logger: Logger): WorkspaceContext {
	logger.log(createGenericOperation('create-context'));
	const store = createCheckoutStore();
	const log = createOperationsLog(logger);
	const fsRecords = createFSRecordsAdapter(config.data.store);
	const codec = createArtCodec({});
	return createWorkspaceContext(config, store, fsRecords, codec, log);
}
