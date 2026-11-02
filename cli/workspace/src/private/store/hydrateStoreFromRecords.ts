import type { ArtRecord } from '@art-js/records';

import type { WorkspaceConfig } from '../../config/types.js';
import type { CheckoutRecord, RepositoryRecord } from '../resources/types.js';

import { createCheckout } from './createCheckout.js';
import type { CheckoutStore } from './createCheckoutStore.js';

export interface RepositoryCheckoutRecordHandle {
	repo?: RepositoryRecord;
	checkout: CheckoutRecord;
	recordHandle: ArtRecord;
}

export function hydrateStoreFromRecords(
	config: WorkspaceConfig,
	store: CheckoutStore,
	records: RepositoryCheckoutRecordHandle[],
): void {
	for (const entry of records) {
		const checkout = createCheckout(
			config,
			entry.checkout.location,
			entry.repo,
			entry.checkout.branch,
			entry.checkout.name,
		);
		store.addCheckout({ ...checkout, recordHandle: entry.recordHandle });
	}
}
