import type { ArtRecord } from '@art-js/records';

import type { CheckoutRecord, RepositoryRecord } from '../resources/types.js';
import type { CheckoutScan } from '../scan/types.js';

export interface Checkout {
	repo?: RepositoryRecord;
	record: CheckoutRecord;
	recordHandle?: ArtRecord;
	path: string;
	scan?: CheckoutScan;
}
