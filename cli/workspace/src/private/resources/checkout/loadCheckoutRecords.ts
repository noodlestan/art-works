import { createRecordsDocument } from '@art-js/records';
import type { FSRecordFile } from '@art-lib/fs-records';
import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import type { RepositoryCheckoutRecordHandle } from '../../store/hydrateStoreFromRecords.js';
import type { CheckoutRecord, RepositoryRecord } from '../types.js';

export async function loadCheckoutRecords(
	ctx: WorkspaceContext,
	repos: RepositoryRecord[],
): Promise<RepositoryCheckoutRecordHandle[]> {
	const searchPath = ctx.config.root.path;
	ctx.log.log(createGenericOperation('load-checkout-records', searchPath));

	const recordFiles: FSRecordFile[] = await ctx.fsRecords.discoverRecordFiles();
	const documentRecords = createRecordsDocument<FSRecordFile>({
		codec: ctx.codec,
		createContentSource: (file: FSRecordFile) => ctx.fsRecords.createContentSource(file),
	});

	const checkouts = await Promise.all(
		recordFiles
			.filter(file => !file.error)
			.map(async file => {
				try {
					const collection = await documentRecords.read(file);
					const records = await collection.extract();
					const recordHandle = records.find(
						r => typeof r.name === 'string' && r.name.startsWith('Checkout:'),
					);
					if (!recordHandle) {
						return null;
					}
					const name = String(recordHandle.name)
						.replace(/^Checkout:\s*/, '')
						.trim();
					if (!name) {
						console.warn('checkout record with empty name, skipped');
						return null;
					}
					const repository = recordHandle.repository
						? String(recordHandle.repository).trim()
						: undefined;
					const location = recordHandle.location ? String(recordHandle.location).trim() : '';
					const branch = recordHandle.branch ? String(recordHandle.branch).trim() : 'main';
					const record: CheckoutRecord = {
						name,
						repository,
						location,
						branch,
					};
					const repo = repos.find(r => r.name === record.repository);
					if (repo) {
						return {
							repo,
							checkout: record,
							recordHandle,
						};
					}
					return {
						checkout: record,
						recordHandle,
					};
				} catch {
					return null;
				}
			}),
	);
	return checkouts.filter(
		(checkout): checkout is RepositoryCheckoutRecordHandle => checkout !== null,
	);
}
