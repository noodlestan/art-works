import { runWithConcurrency } from '../../private/async/runWithConcurrency.js';
import { doPushCheckout } from '../../private/commands/checkouts/doPushCheckout.js';
import { doPushWorkspaceCheckout } from '../../private/commands/workspaces/doPushWorkspaceCheckout.js';
import { scanWorkspaceCheckout } from '../../private/commands/workspaces/scanWorkspaceCheckout.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { createGenericOperation } from '../../private/operations/createGenericOperation.js';
import { createOperationFailure } from '../../private/operations/createOperationFailure.js';
import { presentCheckoutReport } from '../../private/present/presentCheckoutReport.js';
import { presentOperationsReport } from '../../private/present/presentOperationsReport.js';
import { presentWorkspaceReport } from '../../private/present/presentWorkspaceReport.js';
import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { scanCheckoutState } from '../../private/scan/scanCheckoutState.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';

export async function runPush(
	ctx: WorkspaceContext,
	options: { checkouts?: string[]; all?: boolean; workspace?: boolean } = {},
): Promise<void> {
	const repos = await loadRepositoryRecords(ctx);
	const records = await loadCheckoutRecords(ctx, repos);
	hydrateStoreFromRecords(
		ctx.config,
		ctx.store,
		records as unknown as Parameters<typeof hydrateStoreFromRecords>[2],
	);

	const pending = createGenericOperation('command', ['push', options]);
	ctx.log.log(pending);

	if (
		!options.all &&
		!options.workspace &&
		(!options.checkouts || options.checkouts.length === 0)
	) {
		ctx.log.log(createOperationFailure(pending, 'No targets.'));
		console.error(
			`\nUsage: Use \`push -c <pattern>\` to match specific checkouts or \`push --all\` if you want to apply the command to all checkouts. Add \`-w\` to apply the command to the workspace as well.\n`,
		);
		return;
	}

	const checkouts = options.all
		? ctx.store.getAllCheckouts()
		: ctx.store.getCheckoutsByPattern(options.checkouts ?? []);

	await runWithConcurrency(checkouts, 4, async checkout => {
		const scanned = await scanCheckoutState(ctx, checkout, true);
		ctx.store.updateCheckout(scanned);
		if (scanned.scan?.can?.('push')) {
			await doPushCheckout(ctx, scanned);
		}
	});

	if (options.workspace) {
		await scanWorkspaceCheckout(ctx);
		await doPushWorkspaceCheckout(ctx);
		presentWorkspaceReport(ctx.workspace);
	}

	presentCheckoutReport(ctx.config, checkouts);
	presentOperationsReport(ctx.log);
}
