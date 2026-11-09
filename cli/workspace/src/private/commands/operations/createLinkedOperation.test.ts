import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createLinkedOperation } from './createLinkedOperation.js';

describe('createLinkedOperation', () => {
	it('WHEN a linked operation is created it has the correct operation, outcome, and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createLinkedOperation(checkout, '@scope/pkg', '1.2.3');
		expect(pending.operation).toBe('linked');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.package).toBe('@scope/pkg');
		expect(pending.data?.target).toBe('1.2.3');
		expect(pending.text()).toContain('@scope/pkg');
	});
});
