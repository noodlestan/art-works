import { createRecordsDocument } from '@art-js/records';
import type { FSRecordFile } from '@art-lib/fs-records';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { createGenericOperation } from '../../operations/createGenericOperation.js';
import type { RepositoryRecord } from '../types.js';

function readValue(value: unknown): string {
	const text = String(value).trim();
	return text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1).trim() : text;
}

export async function loadRepositoryRecords(ctx: WorkspaceContext): Promise<RepositoryRecord[]> {
	const searchPath = ctx.config.root.path;
	ctx.log.log(createGenericOperation('load-repository-records', searchPath));

	const recordFiles: FSRecordFile[] = await ctx.fsRecords.discoverRecordFiles();
	const documentRecords = createRecordsDocument<FSRecordFile>({
		codec: ctx.codec,
		createContentSource: (file: FSRecordFile) => ctx.fsRecords.createContentSource(file),
	});

	const records = await Promise.all(
		recordFiles
			.filter(file => !file.error)
			.map(async file => {
				try {
					const collection = await documentRecords.read(file);
					const extracted = await collection.extract();
					const recordHandle = extracted.find(
						r => typeof r.name === 'string' && r.name.startsWith('Repository:'),
					);
					if (!recordHandle) {
						return null;
					}
					const name = String(recordHandle.name)
						.replace(/^Repository:\s*/, '')
						.trim();
					if (!name) {
						console.warn('repository record with empty name, skipped');
						return null;
					}
					const remote = recordHandle.remote ? readValue(recordHandle.remote) : '';
					if (!remote) {
						console.warn(`repository record ${file.filename}: missing remote, using default`);
					}
					const record: RepositoryRecord = {
						name,
						remote,
						...(recordHandle.purpose ? { purpose: readValue(recordHandle.purpose) } : {}),
						...(recordHandle.description
							? { description: readValue(recordHandle.description) }
							: {}),
						...(recordHandle.consumers ? { consumers: readValue(recordHandle.consumers) } : {}),
					};
					return record;
				} catch {
					return null;
				}
			}),
	);
	return records.filter((record): record is RepositoryRecord => record !== null);
}
