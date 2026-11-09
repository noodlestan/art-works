import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { runCommandInDirectory } from '../../exec/runCommandInDirectory.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';
import { createCheckoutRunOperation } from '../operations/createCheckoutRunOperation.js';

export async function doCheckoutRun(
	ctx: WorkspaceContext,
	checkout: Checkout,
	command: string,
): Promise<Checkout | null> {
	if (!checkout.scan?.state('exists').exists) {
		const op = createOperationFailure(
			createCheckoutRunOperation(checkout, command),
			new Error('checkout not cloned'),
		);
		ctx.log.log(op);
		return null;
	}

	const pending = createCheckoutRunOperation(checkout, command);
	try {
		ctx.log.log(pending);
		const runOutcome = await runCommandInDirectory(checkout.path, command);
		if (runOutcome.code === 0) {
			ctx.log.log(createOperationSuccess(pending));
		} else {
			ctx.log.log(createOperationFailure(pending, new Error(`Exit code: ${runOutcome.code}`)));
		}
		if (!runOutcome.output.trim() && !runOutcome.error.trim()) {
			console.info('\n--- [No output]\n');
		} else {
			if (runOutcome.output) {
				console.info('\n--- Output:\n');
				console.info(runOutcome.output);
				console.info('');
			}
			if (runOutcome.error) {
				const maybeErrorLabel = runOutcome.code === 0 ? '' : ' Error:';
				console.error(`\n---${maybeErrorLabel}\n`);
				console.error(runOutcome.error);
				console.error('');
			}
		}
		const updated = await scanCheckoutState(ctx, checkout, true);
		ctx.store.updateCheckout(updated);
		return updated;
	} catch (error) {
		ctx.log.log(createOperationFailure(pending, error));
		return null;
	}
}
