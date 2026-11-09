import { describe, expect, it } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';

import { createBranchOperation } from './createBranchOperation.js';

describe('createBranchOperation', () => {
	it('WHEN a branch operation is created it has correct operation, outcome and text', () => {
		const checkout = makeCheckoutMock();
		const pending = createBranchOperation(checkout, 'feat/x');
		expect(pending.operation).toBe('branch');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.branch).toBe('feat/x');
		expect(pending.text()).toContain('feat/x');
	});
});
