import { createFSRecordsAdapter } from '@art-lib/fs-records';
import { createLoggerMock } from '@art-lib/logger/test/helpers/logger/createLoggerMock';
import { createOperationsLogMock } from '@art-lib/operations/test/helpers/log/createOperationsLogMock';
import { createArtCodec } from '@art-md/codec';
import { describe, expect, it } from 'vitest';

import { makeWorkspaceConfigFixture } from '../../test/helpers/context/makeWorkspaceConfigFixture.js';
import { createCheckoutStore } from '../store/createCheckoutStore.js';

import { createWorkspaceContext } from './createWorkspaceContext.js';

describe('createWorkspaceContext', () => {
	it('WHEN a context is created it exposes its logger and operations log', () => {
		const logger = createLoggerMock();
		const operations = createOperationsLogMock();
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const fsRecords = createFSRecordsAdapter(config.data.store);
		const codec = createArtCodec({});

		const ctx = createWorkspaceContext(config, store, fsRecords, codec, operations, logger);

		expect(ctx.config).toBe(config);
		expect(ctx.config.root.path).toBe('.');
		expect(ctx.store).toBe(store);
		expect(ctx.operations).toBe(operations);
		expect(ctx.logger).toBe(logger);
		expect(ctx.fsRecords).toBe(fsRecords);
	});
});
