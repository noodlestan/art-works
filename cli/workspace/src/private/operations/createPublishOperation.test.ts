import { describe, expect, it } from 'vitest';

import { makeCheckoutFixture } from '../../test/helpers/checkout/makeCheckoutFixture.js';

import { createPublishOperation } from './createPublishOperation.js';

describe('createPublishOperation', () => {
	it('WHEN the factory is called it builds the correct operation, outcome and text', () => {
		const checkout = makeCheckoutFixture();
		const pending = createPublishOperation(checkout, '@scope/pkg', '1.2.3');
		expect(pending.operation).toBe('publish');
		expect(pending.outcome).toBe('pending');
		expect(pending.data?.package).toBe('@scope/pkg');
		expect(pending.data?.version).toBe('1.2.3');
		expect(pending.text()).toContain('@scope/pkg@1.2.3');
	});
});
