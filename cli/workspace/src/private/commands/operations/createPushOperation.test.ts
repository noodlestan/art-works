import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createPushOperation } from './createPushOperation.js';

describe('createPushOperation', () => {
	it('WHEN a push operation is created it has correct operation, outcome and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createPushOperation(checkout, 'main');
		expect(pending.operation).toBe('push');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.branch).toBe('main');
		expect(pending.text()).toContain('main');
	});
});
