import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Checkout } from '../../private/store/createCheckout.js';
import { makeCheckoutScanFixture } from '../../test/helpers/checkout/makeCheckoutScanFixture.js';

import { presentPackageStateReport } from './presentPackageStateReport.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('presentPackageStateReport', () => {
	let checkout: Checkout;

	beforeEach(() => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		checkout = {
			record: { name: 'Artificial', location: 'artificial', branch: 'main' },
			path: '/tmp/artificial',
			scan: makeCheckoutScanFixture([]),
		};
	});

	it('WHEN states are present it prints a table with the expected columns', () => {
		presentPackageStateReport(checkout, [
			{
				canonicalName: '@artisans/art-mantras',
				version: '1.2.3',
				publishedVersion: '1.0.0',
				directory: '/tmp/artisans/apps/art-mantras',
				states: [],
			},
		]);

		const output = (console.info as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('\n');
		expect(output).toContain('Packages for Artificial:');
		expect(output).toContain('@artisans/art-mantras');
		expect(output).toContain('1.2.3');
		expect(output).toContain('1.0.0');
		expect(output).toContain('package');
		expect(output).toContain('version');
		expect(output).toContain('published');
		expect(output).toContain('states');
	});

	it('WHEN the package list is empty nothing is printed', () => {
		presentPackageStateReport(checkout, []);

		const calls = (console.info as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls).toHaveLength(0);
	});

	it('WHEN a package has the no package.json state it shows it', () => {
		presentPackageStateReport(checkout, [
			{
				canonicalName: '@artisans/art-mantras',
				version: null,
				publishedVersion: '1.0.0',
				directory: '/tmp/artisans/apps/art-mantras',
				states: ['no package.json'],
			},
		]);

		const output = (console.info as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('\n');
		expect(output).toContain('no package.json');
	});

	it('WHEN a package has the npm info failed state it shows it', () => {
		presentPackageStateReport(checkout, [
			{
				canonicalName: '@artisans/art-mantras',
				version: '1.2.3',
				publishedVersion: 'unknown',
				directory: '/tmp/artisans/apps/art-mantras',
				states: ['npm info failed'],
			},
		]);

		const output = (console.info as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('\n');
		expect(output).toContain('npm info failed');
		expect(output).toContain('unknown');
	});
});
