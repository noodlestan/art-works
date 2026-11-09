import {
	createGenericOperation,
	createOperationFailure,
	createOperationSuccess,
} from '@art-lib/operations';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCommandContextMock } from '../../test/helpers/context/makeCommandContextMock.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';
import { createCloneOperation } from '../commands/operations/createCloneOperation.js';
import { createOperationsLog } from '../log/createOperationsLog.js';
import type { ClonePending } from '../operations/types.js';
import { createCheckout } from '../store/createCheckout.js';

import { makeOperationLogLine } from './makeOperationLogLine.js';
import { presentOperationsReport } from './presentOperationsReport.js';

function makeClonePendingOperationMock(): ClonePending {
	return createGenericOperation('clone', { location: 'checkouts/my-repo' }, () => {
		return 'cloning my-repo';
	});
}

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('presentOperationsReport', () => {
	it('WHEN the log is empty it prints no output', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const log = createOperationsLog();

		presentOperationsReport(log);

		expect(infoSpy).not.toHaveBeenCalled();
	});

	it('WHEN operations exist it prints Operations:', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const log = createOperationsLog();
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);
		const checkout = createCheckout(ctx.config, 'my-repo', {
			name: 'MyRepo',
			remote: 'git@example.com:my-repo.git',
		});
		log.log(createOperationSuccess(createCloneOperation(checkout)));

		presentOperationsReport(log);

		expect(infoSpy).toHaveBeenCalledWith('Operations:');
	});
});

describe('makeOperationLogLine', () => {
	it('FOR a pending operation it renders a line with ⏳', () => {
		const line = makeOperationLogLine(makeClonePendingOperationMock());

		expect(line[0]).toBe('⏳');
		expect(line).toEqual(['⏳', '-', '-', 'clone', 'cloning my-repo', '']);
	});

	it('FOR a successful operation it renders a line with 🟢', () => {
		const tempDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(tempDir);
		const checkout = createCheckout(ctx.config, 'my-repo', {
			name: 'MyRepo',
			remote: 'git@example.com:my-repo.git',
		});

		const line = makeOperationLogLine(createOperationSuccess(createCloneOperation(checkout)));

		expect(line[0]).toBe('🟢');
		expect(line).toEqual(['🟢', 'MyRepo', 'my-repo', 'clone', 'to my-repo', '0']);
	});

	it('FOR a failed operation it renders a line with 🔴', () => {
		const line = makeOperationLogLine(
			createOperationFailure(createCloneOperation(undefined), new Error('boom')),
		);

		expect(line[0]).toBe('🔴');
		expect(line.slice(0, 5)).toEqual(['🔴', '-', '-', 'clone', 'boom']);
		expect(Number(line[5])).not.toBeNaN();
	});
});
