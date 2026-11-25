import { relative, resolve } from 'node:path';

import type { FSRecordFile } from '@art-lib/fs-records';

export function makeRecordFileFixture(basePath: string, filename: string): FSRecordFile {
	const resolvedBasePath = resolve(basePath);
	const resolvedFilename = resolve(filename);

	return {
		filename: resolvedFilename,
		basePath: resolvedBasePath,
		path: relative(resolvedBasePath, resolvedFilename),
	};
}
