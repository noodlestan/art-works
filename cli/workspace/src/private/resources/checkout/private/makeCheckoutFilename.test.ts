import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { makeWorkspaceConfigFixture } from '../../../../test/helpers/context/makeWorkspaceConfigFixture.js';
import { makeTempDir } from '../../../../test/helpers/tempDirs/makeTempDir.js';

import { makeCheckoutFilename } from './makeCheckoutFilename.js';

const tempDirs: string[] = [];

describe('makeCheckoutFilename', () => {
	it('WHEN a filename is made it derives the slug from the checkout name', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeWorkspaceConfigFixture(tempDir);
		const data = { name: 'Artificial', location: 'checkouts/artificial', branch: 'main' };

		const result = makeCheckoutFilename(config, data);

		expect(result).toBe(join(tempDir, '_records/artificial-checkout.art'));
	});

	it('WHEN the name contains spaces it normalizes them to dashes', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeWorkspaceConfigFixture(tempDir);
		const data = { name: 'My Checkout', location: 'checkouts/my-checkout', branch: 'main' };

		const result = makeCheckoutFilename(config, data);

		expect(result).toBe(join(tempDir, '_records/my-checkout-checkout.art'));
	});

	it('WHEN the name has mixed case it lowercases it', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeWorkspaceConfigFixture(tempDir);
		const data = { name: 'UPPER CASE', location: 'checkouts/upper-case', branch: 'main' };

		const result = makeCheckoutFilename(config, data);

		expect(result).toBe(join(tempDir, '_records/upper-case-checkout.art'));
	});

	it('WHEN a filename is made it uses the data store path', () => {
		const tempDir = makeTempDir(tempDirs);
		const config = makeWorkspaceConfigFixture(tempDir);
		const data = { name: 'Foo', location: 'checkouts/foo', branch: 'main' };

		const result = makeCheckoutFilename(config, data);

		expect(result).toBe(join(config.data.store.basePath, 'foo-checkout.art'));
	});
});
