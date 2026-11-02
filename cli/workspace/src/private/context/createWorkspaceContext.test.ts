import { createFSRecordsAdapter } from '@art-lib/fs-records';
import { createArtCodec } from '@art-md/codec';
import { describe, expect, it } from 'vitest';

import { makeConfigMock } from '../../test/helpers/context/makeConfigMock.js';
import { createOperationsLog } from '../log/createOperationsLog.js';
import { createCheckoutStore } from '../store/createCheckoutStore.js';

import { createWorkspaceContext } from './createWorkspaceContext.js';

describe('createWorkspaceContext', () => {
	it('WHEN a context is created it has the config, root, store, and log', () => {
		const config = makeConfigMock('.');
		const store = createCheckoutStore();
		const log = createOperationsLog();
		const fsRecords = createFSRecordsAdapter(config.data.store);
		const codec = createArtCodec({});

		const ctx = createWorkspaceContext(config, store, fsRecords, codec, log);

		expect(ctx.config).toBe(config);
		expect(ctx.config.root.path).toBe('.');
		expect(ctx.store).toBe(store);
		expect(ctx.log).toBe(log);
		expect(ctx.fsRecords).toBe(fsRecords);
	});
});
