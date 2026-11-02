import { mkdirSync } from 'node:fs';

import { createRecordsDocument } from '@art-js/records';
import type { FSRecordFile } from '@art-lib/fs-records';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import type { Checkout } from '../../store/createCheckout.js';

import { makeCheckoutFilename } from './private/makeCheckoutFilename.js';

export function makeCheckoutRecordFile(ctx: WorkspaceContext, name: string): FSRecordFile {
	const basePath = ctx.config.data.store.basePath;
	const filename = makeCheckoutFilename(ctx.config, { name, location: '', branch: '' });
	return { filename, basePath, path: filename.replace(`${basePath}/`, '') };
}

export async function upsertCheckoutRecord(
	ctx: WorkspaceContext,
	checkout: Checkout,
): Promise<Checkout> {
	const record = checkout.record;
	const repository = checkout.repo?.name ?? record.repository;
	const handle = checkout.recordHandle;

	if (handle) {
		if (repository !== undefined) {
			handle.repository = repository;
		} else {
			delete handle.repository;
		}
		handle.location = record.location;
		handle.branch = record.branch;
		await handle.save();
		return checkout;
	}

	const documentRecords = createRecordsDocument<FSRecordFile>({
		codec: ctx.codec,
		createContentSource: (file: FSRecordFile) => ctx.fsRecords.createContentSource(file),
	});

	const targetFile = makeCheckoutRecordFile(ctx, record.name);
	mkdirSync(targetFile.basePath, { recursive: true });

	const collection = await documentRecords.create(targetFile);
	const module = collection.addRecord();
	module.name = 'Module';
	const created = collection.addRecord({ appendTo: module });
	created.name = `Checkout: ${record.name}`;
	if (repository !== undefined) {
		created.repository = repository;
	}
	created.location = record.location;
	created.branch = record.branch;
	await collection.save();

	return { ...checkout, recordHandle: created };
}
