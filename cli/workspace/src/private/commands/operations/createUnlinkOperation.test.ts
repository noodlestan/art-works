import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createUnlinkOperation } from './createUnlinkOperation.js';

describe('createUnlinkOperation', () => {
	it('WHEN created for a package it has the correct operation, outcome and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createUnlinkOperation(checkout, '@scope/pkg', '1.2.3');
		expect(pending.operation).toBe('unlink');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.package).toBe('@scope/pkg');
		expect(pending.data?.source).toBe('1.2.3');
		expect(pending.text()).toContain('@scope/pkg');
	});
});
