import { afterEach, describe, expect, it } from 'vitest';

import { makeConfigMock } from '../../test/helpers/context/makeConfigMock.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { createCheckoutStore } from './createCheckoutStore.js';
import { hydrateStoreFromRecords } from './hydrateStoreFromRecords.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
});

describe('hydrateStoreFromRecords', () => {
	it('WHEN records are hydrated the store gets a checkout per record', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeConfigMock(tempDir);
		const store = createCheckoutStore();
		const records = [
			{
				repo: { name: 'Alpha', remote: 'git@example.com:alpha.git' },
				checkout: { name: 'Alpha', location: 'alpha', branch: 'main' },
				recordHandle: { name: 'Checkout: Alpha' } as unknown as import('@art-js/records').ArtRecord,
			},
			{
				repo: { name: 'Beta', remote: 'git@example.com:beta.git' },
				checkout: { name: 'Beta', location: 'beta', branch: 'develop' },
				recordHandle: { name: 'Checkout: Beta' } as unknown as import('@art-js/records').ArtRecord,
			},
		];

		hydrateStoreFromRecords(config, store, records);

		expect(store.getAllCheckouts()).toHaveLength(2);
		expect(store.getCheckoutForLocation('alpha')).toBeDefined();
		expect(store.getCheckoutForLocation('beta')).toBeDefined();
		expect(store.getCheckoutForLocation('beta')?.record.branch).toBe('develop');
	});

	it('WHEN a record is hydrated the record handle is copied into the checkout', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeConfigMock(tempDir);
		const store = createCheckoutStore();
		const recordHandle = {
			name: 'Checkout: Foo',
		} as unknown as import('@art-js/records').ArtRecord;
		const records = [
			{
				repo: { name: 'Foo', remote: 'git@example.com:foo.git' },
				checkout: { name: 'Foo', location: 'foo', branch: 'main' },
				recordHandle,
			},
		];

		hydrateStoreFromRecords(config, store, records);

		const checkout = store.getCheckoutForLocation('foo');
		expect(checkout).toBeDefined();
		expect(checkout?.recordHandle).toBe(recordHandle);
	});

	it('WHEN hydrate creates a new checkout it carries the record handle', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeConfigMock(tempDir);
		const store = createCheckoutStore();
		const recordHandle = {
			name: 'Checkout: Orphan',
		} as unknown as import('@art-js/records').ArtRecord;
		const records = [
			{
				checkout: { name: 'Orphan', location: 'orphan', branch: 'main' },
				recordHandle,
			},
		];

		hydrateStoreFromRecords(config, store, records);

		const checkout = store.getCheckoutForLocation('orphan');
		expect(checkout).toBeDefined();
		expect(checkout?.repo).toBeUndefined();
		expect(checkout?.recordHandle).toBe(recordHandle);
	});
});
