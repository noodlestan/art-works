import { createRecordsDocument } from '@art-js/records';
import { type FSRecordFile, createFSRecordsAdapter } from '@art-lib/fs-records';
import { createArtCodec } from '@art-md/codec';

import type { WorkspaceConfig } from '../../../config/index.js';
import type { NamespaceRecord } from '../types.js';

function readValue(value: unknown): string {
	const text = String(value).trim();
	return text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1).trim() : text;
}

export async function loadNamespaceRecords(
	config: WorkspaceConfig,
	checkoutPath: string,
): Promise<NamespaceRecord[]> {
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
						r => typeof r.name === 'string' && r.name.startsWith('Namespace:'),
					);
					const name = recordHandle
						? String(recordHandle.name)
								.replace(/^Namespace:\s*/, '')
								.trim()
						: '';
					if (!recordHandle || !name) {
						console.warn(`namespace record ${file.filename}: missing name, skipped`);
						return null;
					}
					const path = recordHandle.path ? readValue(recordHandle.path) : '.';
					const packageNames = recordHandle.packages
						? String(recordHandle.packages)
								.split('\n')
								.map(line => line.replace(/^-\s*Package:\s*/, '').trim())
								.filter(Boolean)
						: [];
					const record: NamespaceRecord = {
						kind: 'namespace',
						name,
						path,
						packageNames,
					};
					return record;
				} catch {
					return null;
				}
			}),
	);
	return records.filter((record): record is NamespaceRecord => record !== null);
}
