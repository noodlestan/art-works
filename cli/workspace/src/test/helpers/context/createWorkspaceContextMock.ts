import { createFSRecordsAdapter } from '@art-lib/fs-records';
import { createLoggerMock } from '@art-lib/logger/test/helpers/logger/createLoggerMock';
import { createOperationsLogMock } from '@art-lib/operations/test/helpers/log/createOperationsLogMock';
import { createArtCodec } from '@art-md/codec';

import {
	type WorkspaceContext,
	createWorkspaceContext,
} from '../../../private/context/createWorkspaceContext.js';
import type { Checkout } from '../../../private/store/createCheckout.js';
import { createCheckoutStore } from '../../../private/store/createCheckoutStore.js';

import { makeWorkspaceConfigFixture } from './makeWorkspaceConfigFixture.js';

export function createWorkspaceContextMock(
	tempDir: string,
	workspace?: Checkout,
): WorkspaceContext {
	const config = makeWorkspaceConfigFixture(tempDir);
	const store = createCheckoutStore();
	const logger = createLoggerMock();
	const operations = createOperationsLogMock();
	const fsRecords = createFSRecordsAdapter(config.data.store);
	const codec = createArtCodec({});
	const ctx = createWorkspaceContext(
		config,
		store,
		fsRecords,
		codec,
		operations,
		logger,
		workspace,
	);
	return ctx;
}
