import { createGenericOperation } from '@art-lib/operations';

import { scanWorkspaceCheckout } from '../../private/commands/workspaces/scanWorkspaceCheckout.js';
import { syncWorkspaceCheckout } from '../../private/commands/workspaces/syncWorkspaceCheckout.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../private/present/presentCheckoutReport.js';
import { presentExtraneousReport } from '../../private/present/presentExtraneousReport.js';
import { presentOperationsReport } from '../../private/present/presentOperationsReport.js';
import { presentWorkspaceReport } from '../../private/present/presentWorkspaceReport.js';
import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';
import { scanAllCheckoutsStates } from '../../private/store/scanAllCheckoutsStates.js';

import { scanExtraneousCheckouts } from './private/scanExtraneousCheckouts.js';
import { syncCheckouts } from './private/syncCheckouts.js';

export async function runSanity(
	ctx: WorkspaceContext,
	options: { auto: boolean; refetch?: boolean },
): Promise<void> {
	const repos = await loadRepositoryRecords(ctx);
	const records = await loadCheckoutRecords(ctx, repos);
	hydrateStoreFromRecords(
		ctx.config,
		ctx.store,
		records as unknown as Parameters<typeof hydrateStoreFromRecords>[2],
	);

	ctx.log.log(createGenericOperation('command', ['sanity', options.auto]));

	let workspace = await scanWorkspaceCheckout(ctx, options.refetch);
	await scanAllCheckoutsStates(ctx, options.refetch);

	if (options.auto) {
		workspace = await syncWorkspaceCheckout(ctx);
		await syncCheckouts(ctx);
	}

	const extraneous = await scanExtraneousCheckouts(ctx, ctx.store);

	const workspaceIssues = workspace?.scan
		? workspace.scan
				.issues()
				.filter(i => i !== 'unknown project' && i !== 'no remote' && i !== 'wrong remote')
		: [];
	const filteredWorkspace = workspace
		? {
				...workspace,
				scan: workspace.scan ? { ...workspace.scan, issues: () => workspaceIssues } : undefined,
			}
		: undefined;

	presentWorkspaceReport(filteredWorkspace);
	presentCheckoutReport(ctx.config, ctx.store.getAllCheckouts());
	presentExtraneousReport(extraneous);
	presentOperationsReport(ctx.log);
}
