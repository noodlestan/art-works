import type { OperationsLog } from '@art-lib/operations';

import { formatTable } from './formatTable.js';
import { makeOperationLogLine } from './makeOperationLogLine.js';

export function presentOperationsReport(log: OperationsLog): void {
	const operations = log.all();
	if (operations.length === 0) {
		return;
	}

	const headers = ['', 'repo', 'checkout', 'operation', 'message', 'ms'];
	const rows = operations.map(op => makeOperationLogLine(op));

	console.info('');
	console.info('Operations:');
	console.info(`-----------`);
	console.info(formatTable(rows, headers));
}
