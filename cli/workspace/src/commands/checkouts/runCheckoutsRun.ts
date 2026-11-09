import { createGenericOperation, createOperationFailure } from '@art-lib/operations';

import { runWithConcurrency } from '../../private/async/runWithConcurrency.js';
import { doCheckoutRun } from '../../private/commands/checkouts/doCheckoutRun.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../private/present/presentCheckoutReport.js';
import { presentOperationsReport } from '../../private/present/presentOperationsReport.js';
import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { scanCheckoutState } from '../../private/scan/scanCheckoutState.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';

export async function runCheckoutsRun(
	ctx: WorkspaceContext,
	options: { command: string; checkouts?: string[]; all?: boolean },
): Promise<void> {
	const repos = await loadRepositoryRecords(ctx);
	const records = await loadCheckoutRecords(ctx, repos);
	hydrateStoreFromRecords(
		ctx.config,
		ctx.store,
		records as unknown as Parameters<typeof hydrateStoreFromRecords>[2],
	);

	const pending = createGenericOperation('command', ['checkouts run', options]);
	ctx.log.log(pending);

	if (!options.all && (!options.checkouts || options.checkouts.length === 0)) {
		ctx.log.log(createOperationFailure(pending, 'No targets.'));
		console.error(
			`\nUsage: Use \`checkouts run <command> -c <pattern>\` to match specific checkouts or \`checkouts run <command> --all\` if you want to apply the command to all checkouts.\n`,
		);
		return;
	}

	const checkouts = options.all
		? ctx.store.getAllCheckouts()
		: ctx.store.getCheckoutsByPattern(options.checkouts ?? []);

	await runWithConcurrency(checkouts, 4, async checkout => {
		const scanned = await scanCheckoutState(ctx, checkout);
		await doCheckoutRun(ctx, scanned, options.command);
	});

	presentCheckoutReport(ctx.config, checkouts);
	presentOperationsReport(ctx.log);
}
