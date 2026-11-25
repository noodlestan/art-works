import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupCloneWorkspace } from '../../../../test/helpers/setupCloneWorkspace.js';
import { loadCheckoutRecords } from '../../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../../private/resources/repository/loadRepositoryRecords.js';
import { hydrateStoreFromRecords } from '../../../private/store/hydrateStoreFromRecords.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { writeCheckoutRecordFixture } from '../../../test/helpers/records/writeCheckoutRecordFixture.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { cloneSpecific } from './cloneSpecific.js';

const tempDirs: string[] = [];

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('cloneSpecific', () => {
	it('WHEN the repository is unknown, it logs a failure', async () => {
		const { root } = await setupCloneWorkspace(tempDirs);
		const ctx = createWorkspaceContextMock(root);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repos = await loadRepositoryRecords(ctx);

		await cloneSpecific(ctx, repos, 'Unknown');

		const failure = vi
			.mocked(ctx.operations.log)
			.mock.calls.find(
				([operation]) => operation.operation === 'clone' && operation.outcome === 'failure',
			)?.[0];
		const expectedFailureOp = expect.objectContaining({ operation: 'clone', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
		expect(failure?.text()).toContain('unknown repo "Unknown"');
	});

	it('WHEN a custom location is given, it creates the checkout record at that location', async () => {
		const { root } = await setupCloneWorkspace(tempDirs);
		const ctx = createWorkspaceContextMock(root);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repos = await loadRepositoryRecords(ctx);

		await cloneSpecific(ctx, repos, 'Alpha', 'custom');

		const checkout = ctx.store.getCheckoutForLocation('alpha-custom');
		const recordFile = join(root, '_records/alpha-@-custom-checkout.art');
		const recordContents = readFileSync(recordFile, 'utf-8');
		expect(checkout).toBeDefined();
		expect(checkout?.record.name).toBe('Alpha @ custom');
		expect(checkout?.record.location).toBe('alpha-custom');
		expect(existsSync(recordFile)).toBe(true);
		expect(recordContents).toContain('**Location:** alpha-custom');
	});

	it('WHEN the requested location is already used by another repository, it logs a failure', async () => {
		const { root } = await setupCloneWorkspace(tempDirs);
		const ctx = createWorkspaceContextMock(root);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repos = await loadRepositoryRecords(ctx);
		writeCheckoutRecordFixture(root, 'Beta', 'Beta', 'alpha-custom');
		const checkoutRecords = await loadCheckoutRecords(ctx, repos);
		hydrateStoreFromRecords(ctx.config, ctx.store, checkoutRecords);

		await cloneSpecific(ctx, repos, 'Alpha', 'custom');

		const failure = vi
			.mocked(ctx.operations.log)
			.mock.calls.find(
				([operation]) => operation.operation === 'clone' && operation.outcome === 'failure',
			)?.[0];
		const expectedFailureOp = expect.objectContaining({ operation: 'clone', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
		expect(failure?.text()).toContain("location alpha-custom is already used by checkout 'Beta'.");
	});

	it('WHEN the target directory already exists without a checkout record, it logs a failure', async () => {
		const { root } = await setupCloneWorkspace(tempDirs);
		const ctx = createWorkspaceContextMock(root);
		vi.mocked(ctx.operations.all).mockReturnValue([]);
		const repos = await loadRepositoryRecords(ctx);
		mkdirSync(join(root, ctx.config.checkouts.path, 'alpha'), { recursive: true });

		await cloneSpecific(ctx, repos, 'Alpha');

		const failure = vi
			.mocked(ctx.operations.log)
			.mock.calls.find(
				([operation]) => operation.operation === 'clone' && operation.outcome === 'failure',
			)?.[0];
		const expectedFailureOp = expect.objectContaining({ operation: 'clone', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledWith(expectedFailureOp);
		expect(failure?.text()).toContain('directory already exists at');
	});
});
