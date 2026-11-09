import { createGenericOperation, createOperationFailure } from '@art-lib/operations';

import { doBranchCheckout } from '../../private/commands/checkouts/doBranchCheckout.js';
import { createBranchOperation } from '../../private/commands/operations/createBranchOperation.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../private/present/presentCheckoutReport.js';
import { presentOperationsReport } from '../../private/present/presentOperationsReport.js';
import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { scanCheckoutState } from '../../private/scan/scanCheckoutState.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';
import { scanAllCheckoutsStates } from '../../private/store/scanAllCheckoutsStates.js';

export async function runBranch(
	ctx: WorkspaceContext,
	options: { branch: string; checkouts?: string[]; all?: boolean },
): Promise<void> {
	const repos = await loadRepositoryRecords(ctx);
	const records = await loadCheckoutRecords(ctx, repos);
	hydrateStoreFromRecords(
		ctx.config,
		ctx.store,
		records as unknown as Parameters<typeof hydrateStoreFromRecords>[2],
	);

	const pending = createGenericOperation('command', ['branch', options]);
	ctx.log.log(pending);

	if (!options.all && (!options.checkouts || options.checkouts.length === 0)) {
		ctx.log.log(createOperationFailure(pending, 'No targets.'));
		console.error(
			`\nUsage: Use \`branch <branch> -c <pattern>\` to match specific checkouts or \`branch <branch> --all\` if you want to apply the command to all checkouts.\n`,
		);
		return;
	}

	const { branch, checkouts } = options;
	const resolvedCheckouts = options.all
		? ctx.store.getAllCheckouts()
		: ctx.store.getCheckoutsByPattern(checkouts ?? []);

	for (const checkout of resolvedCheckouts) {
		const scanned = await scanCheckoutState(ctx, checkout);
		ctx.store.updateCheckout(scanned);

		if (!scanned.scan?.can?.('branch')) {
			ctx.log.log(
				createOperationFailure(createBranchOperation(scanned, branch), 'checkout not cloned'),
			);
			continue;
		}

		await doBranchCheckout(ctx, scanned, branch);
	}

	await scanAllCheckoutsStates(ctx);
	presentCheckoutReport(ctx.config, ctx.store.getAllCheckouts());
	presentOperationsReport(ctx.log);
}
