import type { FSRecordsAdapter } from '@art-lib/fs-records';
import type { LoggerAPI } from '@art-lib/logger';
import type { OperationsLog } from '@art-lib/operations';
import type { ArtCodec } from '@art-md/primitives';

import type { WorkspaceConfig } from '../../config/types.js';
import type { Checkout } from '../store/createCheckout.js';
import type { CheckoutStore } from '../store/createCheckoutStore.js';

import type { WorkspaceContext } from './types.js';

export type { WorkspaceContext } from './types.js';

export function createWorkspaceContext(
	config: WorkspaceConfig,
	store: CheckoutStore,
	fsRecords: FSRecordsAdapter,
	codec: ArtCodec,
	operations: OperationsLog,
	logger: LoggerAPI,
	workspace?: Checkout,
): WorkspaceContext {
	return { config, store, fsRecords, codec, operations, logger, workspace };
}
