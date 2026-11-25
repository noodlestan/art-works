import type { FSRecordsAdapter } from '@art-lib/fs-records';
import type { LoggerAPI } from '@art-lib/logger';
import type { OperationsLog } from '@art-lib/operations';
import type { ArtCodec } from '@art-md/primitives';

import type { WorkspaceConfig } from '../../config/types.js';
import type { Checkout } from '../store/createCheckout.js';
import type { CheckoutStore } from '../store/createCheckoutStore.js';

export interface WorkspaceContext {
	config: WorkspaceConfig;
	store: CheckoutStore;
	fsRecords: FSRecordsAdapter;
	codec: ArtCodec;
	operations: OperationsLog;
	logger: LoggerAPI;
	workspace?: Checkout;
}
