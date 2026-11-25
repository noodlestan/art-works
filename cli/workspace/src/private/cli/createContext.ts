import { createFSRecordsAdapter } from '@art-lib/fs-records';
import type { LoggerAPI } from '@art-lib/logger';
import {
	type OperationsLog,
	createGenericOperation,
	createOperationsLog,
	createPipeSeparatedFormatter,
} from '@art-lib/operations';
import { createArtCodec } from '@art-md/codec';

import type { WorkspaceConfig } from '../../config/types.js';
import { createWorkspaceContext } from '../context/createWorkspaceContext.js';
import type { WorkspaceContext } from '../context/types.js';
import type { Operation } from '../operations/types.js';
import { makeOperationLogFields } from '../present/makeOperationLogLine.js';
import { createCheckoutStore } from '../store/createCheckoutStore.js';

export function createWorkspaceOperationsLog(logger: LoggerAPI): OperationsLog<Operation> {
	return createOperationsLog(logger, {
		formatter: createPipeSeparatedFormatter<Operation>(makeOperationLogFields),
	});
}

export function createContext(
	config: WorkspaceConfig,
	logger: LoggerAPI,
	operations: OperationsLog<Operation> = createWorkspaceOperationsLog(logger),
): WorkspaceContext {
	operations.log(createGenericOperation('create-context'));
	const store = createCheckoutStore();
	const fsRecords = createFSRecordsAdapter(config.data.store);
	const codec = createArtCodec({});
	return createWorkspaceContext(config, store, fsRecords, codec, operations, logger);
}
