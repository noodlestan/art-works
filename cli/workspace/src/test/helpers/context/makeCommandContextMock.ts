import { createFSRecordsAdapter } from '@art-lib/fs-records';
import { createArtCodec } from '@art-md/codec';

import {
	type WorkspaceContext,
	createWorkspaceContext,
} from '../../../private/context/createWorkspaceContext.js';
import { createOperationsLog } from '../../../private/log/createOperationsLog.js';
import type { Checkout } from '../../../private/store/createCheckout.js';
import { createCheckoutStore } from '../../../private/store/createCheckoutStore.js';

import { makeConfigMock } from './makeConfigMock.js';

export function makeCommandContextMock(tempDir: string, workspace?: Checkout): WorkspaceContext {
	const config = makeConfigMock(tempDir);
	const store = createCheckoutStore();
	const log = createOperationsLog();
	const fsRecords = createFSRecordsAdapter(config.data.store);
	const codec = createArtCodec({});
	const ctx = createWorkspaceContext(config, store, fsRecords, codec, log, workspace);
	return ctx;
}
