import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createPullOperation } from './createPullOperation.js';

describe('createPullOperation', () => {
	it('WHEN a pull operation is created it has correct operation, outcome and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createPullOperation(checkout, 'main');
		expect(pending.operation).toBe('pull');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.branch).toBe('main');
		expect(pending.text()).toContain('main');
	});
});
