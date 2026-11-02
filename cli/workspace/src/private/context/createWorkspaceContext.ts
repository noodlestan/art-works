import type { FSRecordsAdapter } from '@art-lib/fs-records';
import type { ArtCodec } from '@art-md/primitives';

import type { WorkspaceConfig } from '../../config/types.js';
import type { OperationsLog } from '../log/createOperationsLog.js';
import type { Checkout } from '../store/createCheckout.js';
import type { CheckoutStore } from '../store/createCheckoutStore.js';

import type { WorkspaceContext } from './types.js';

export type { WorkspaceContext } from './types.js';

export function createWorkspaceContext(
	config: WorkspaceConfig,
	store: CheckoutStore,
	fsRecords: FSRecordsAdapter,
	codec: ArtCodec,
	log: OperationsLog,
	workspace?: Checkout,
): WorkspaceContext {
	return { config, store, fsRecords, codec, log, workspace };
}
