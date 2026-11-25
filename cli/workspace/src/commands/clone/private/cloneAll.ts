import type { WorkspaceContext } from '../../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../../private/present/presentCheckoutReport.js';
import { presentOperationsReport } from '../../../private/present/presentOperationsReport.js';
import type { RepositoryRecord } from '../../../private/resources/types.js';
import { createCheckout } from '../../../private/store/createCheckout.js';
import { scanAllCheckoutsStates } from '../../../private/store/scanAllCheckoutsStates.js';

import { cloneIfMissing } from './cloneIfMissing.js';

export async function cloneAll(ctx: WorkspaceContext, repos: RepositoryRecord[]): Promise<void> {
	for (const repo of repos) {
		if (!ctx.store.getCheckoutOfRepo(repo.name)) {
			const checkout = createCheckout(ctx.config, repo.name, repo);
			ctx.store.addCheckout(checkout);
		}
	}

	for (const checkout of ctx.store.getAllCheckouts()) {
		await cloneIfMissing(ctx, checkout);
	}

	await scanAllCheckoutsStates(ctx);
	presentCheckoutReport(ctx.config, ctx.store.getAllCheckouts());
	presentOperationsReport(ctx.operations);
}
