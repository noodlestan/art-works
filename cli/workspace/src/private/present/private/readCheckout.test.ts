import { describe, expect, it } from 'vitest';

import { readCheckout } from './readCheckout.js';

describe('readCheckout', () => {
	it('WHEN operation data contains a checkout it returns it', () => {
		const checkout = { path: '/tmp/checkout' };

		expect(readCheckout({ checkout })).toBe(checkout);
	});

	it('WHEN operation data has no checkout it returns undefined', () => {
		expect(readCheckout(undefined)).toBeUndefined();
		expect(readCheckout({})).toBeUndefined();
	});
});
