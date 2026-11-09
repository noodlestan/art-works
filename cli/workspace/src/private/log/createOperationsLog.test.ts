import { createGenericOperation, createOperationSuccess } from '@art-lib/operations';
import { describe, expect, it, vi } from 'vitest';

import { makeConfigMock } from '../../test/helpers/context/makeConfigMock.js';
import { createCloneOperation } from '../commands/operations/createCloneOperation.js';
import { readCheckout } from '../present/private/readCheckout.js';
import { createCheckout } from '../store/createCheckout.js';

import { createOperationsLog } from './createOperationsLog.js';

function makeCheckout(name: string) {
	const config = makeConfigMock('.');
	const repo = { name, remote: `git@example.com:${name}.git` };
	return createCheckout(config, repo.name, repo, 'main');
}

function makeResolvedClone(name: string) {
	return createOperationSuccess(createCloneOperation(makeCheckout(name)));
}

function makePendingOperation() {
	return createGenericOperation('clone', { location: 'checkouts/my-repo' }, () => {
		return 'cloning my-repo';
	});
}

describe('createOperationsLog', () => {
	it('WHEN an operation is logged it is recorded', () => {
		const operations = createOperationsLog();

		operations.log(makeResolvedClone('test'));

		const ops = operations.all();
		expect(ops).toHaveLength(1);
		expect(ops[0].operation).toBe('clone');
		expect(readCheckout(ops[0].data)?.repo?.name).toBe('test');
	});

	it('WHEN no operations are logged it returns an empty array', () => {
		const operations = createOperationsLog();

		expect(operations.all()).toEqual([]);
	});

	it('WHEN since() receives a timestamp, it returns only operations logged afterward', async () => {
		const operations = createOperationsLog();
		operations.log(makeResolvedClone('a'));
		const before = new Date(Date.now() + 10);
		await new Promise(resolve => setTimeout(resolve, 15));
		operations.log(makeResolvedClone('b'));

		const ops = operations.since(before.getTime());
		expect(ops).toHaveLength(1);
		expect(readCheckout(ops[0].data)?.repo?.name).toBe('b');
	});

	it('WHEN latest() receives a limit, it returns that many most recent operations', () => {
		const operations = createOperationsLog();
		operations.log(makeResolvedClone('a'));
		operations.log(makeResolvedClone('b'));
		operations.log(makeResolvedClone('c'));

		const ops = operations.latest(2);
		expect(ops).toHaveLength(2);
		expect(readCheckout(ops[0].data)?.repo?.name).toBe('b');
		expect(readCheckout(ops[1].data)?.repo?.name).toBe('c');
	});

	it('WHEN an operation is pending it is streamed to the logger without being stored', () => {
		const logger = vi.fn();
		const operations = createOperationsLog({ log: logger, setOutputMode: () => {} });

		operations.log(makePendingOperation());

		expect(logger).toHaveBeenCalledTimes(1);
		expect(operations.all()).toEqual([]);
	});
});
