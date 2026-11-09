import type { Checkout } from '../../store/createCheckout.js';

/**
 * `checkout` travels inside the generic `data` payload; generic operations
 * carry none, which the report renders as `-`.
 */
export function readCheckout(data: unknown): Checkout | undefined {
	return (data as { checkout?: Checkout } | undefined)?.checkout;
}
