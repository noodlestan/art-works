import { createRecordsDocument } from '@art-js/records';
import { type FSRecordFile, createFSRecordsAdapter } from '@art-lib/fs-records';
import { createArtCodec } from '@art-md/codec';

import type { WorkspaceConfig } from '../../../config/index.js';
import type { PackageRecord } from '../types.js';

function readValue(value: unknown): string {
	const text = String(value).trim();
	return text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1).trim() : text;
}

export async function loadPackageRecords(
	config: WorkspaceConfig,
	checkoutPath: string,
): Promise<PackageRecord[]> {
	const adapter = createFSRecordsAdapter({
		basePath: checkoutPath,
		patterns: config.discover.records.paths,
	});
	const recordFiles: FSRecordFile[] = await adapter.discoverRecordFiles();
	const documentRecords = createRecordsDocument<FSRecordFile>({
		codec: createArtCodec({}),
		createContentSource: (file: FSRecordFile) => adapter.createContentSource(file),
	});

	const records = await Promise.all(
		recordFiles
			.filter(file => !file.error)
			.map(async file => {
				try {
					const collection = await documentRecords.read(file);
					const extracted = await collection.extract();
					const recordHandle = extracted.find(
						r => typeof r.name === 'string' && r.name.startsWith('Package:'),
					);
					const name = recordHandle
						? String(recordHandle.name)
								.replace(/^Package:\s*/, '')
								.trim()
						: '';
					if (!recordHandle || !name) {
						console.warn(`package record ${file.filename}: missing name, skipped`);
						return null;
					}
					const record: PackageRecord = {
						kind: 'package',
						name,
						canonicalName: recordHandle.canonicalName ? readValue(recordHandle.canonicalName) : '',
						path: recordHandle.path ? readValue(recordHandle.path) : '',
					};
					return record;
				} catch {
					return null;
				}
			}),
	);
	return records.filter((record): record is PackageRecord => record !== null);
}
