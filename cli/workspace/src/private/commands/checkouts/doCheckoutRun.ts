import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { runCommandInDirectory } from '../../exec/runCommandInDirectory.js';
import { createCheckoutRunOperation } from '../../operations/createCheckoutRunOperation.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';

export async function doCheckoutRun(
	ctx: WorkspaceContext,
	checkout: Checkout,
	command: string,
): Promise<Checkout | null> {
	if (!checkout.scan?.state('exists').exists) {
		const pending = createCheckoutRunOperation(checkout, command);
		const failure = createOperationFailure(pending, new Error('checkout not cloned'));
		ctx.operations.log(failure);
		return null;
	}

	const pending = createCheckoutRunOperation(checkout, command);
	ctx.operations.log(pending);

	try {
		const runOutcome = await runCommandInDirectory(checkout.path, command);
		if (runOutcome.code === 0) {
			ctx.operations.log(createOperationSuccess(pending));
		} else {
			const failure = createOperationFailure(pending, new Error(`Exit code: ${runOutcome.code}`));
			ctx.operations.log(failure);
		}

		const hasOutput = Boolean(runOutcome.output.trim());
		const hasError = Boolean(runOutcome.error.trim());

		if (!hasOutput && !hasError) {
			console.info('\n--- [No output]\n');
		}

		if (hasOutput) {
			console.info('\n--- Output:\n');
			console.info(runOutcome.output);
			console.info('');
		}

		if (hasError) {
			const maybeErrorLabel = runOutcome.code === 0 ? '' : ' Error:';
			console.error(`\n---${maybeErrorLabel}\n`);
			console.error(runOutcome.error);
			console.error('');
		}

		const updated = await scanCheckoutState(ctx, checkout, true);
		ctx.store.updateCheckout(updated);
		return updated;
	} catch (error) {
		ctx.operations.log(createOperationFailure(pending, error));
		return null;
	}
}
