import { describe, expect, it } from 'vitest';

import { makeCheckoutFixture } from '../../test/helpers/checkout/makeCheckoutFixture.js';

import { createPushOperation } from './createPushOperation.js';

describe('createPushOperation', () => {
	it('WHEN a push operation is created it has correct operation, outcome and text', () => {
		const checkout = makeCheckoutFixture();
		const pending = createPushOperation(checkout, 'main');
		expect(pending.operation).toBe('push');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.branch).toBe('main');
		expect(pending.text()).toContain('main');
	});
});
