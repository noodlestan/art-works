import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createCheckoutRunOperation } from './createCheckoutRunOperation.js';

describe('createCheckoutRunOperation', () => {
	it('WHEN created for a command it has the correct operation, outcome and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createCheckoutRunOperation(checkout, 'npm test');
		expect(pending.operation).toBe('run');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.command).toBe('npm test');
		expect(pending.text()).toBe('npm test');
	});
});
