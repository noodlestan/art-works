import type { WorkspaceContext } from '../../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../../private/present/presentCheckoutReport.js';
import { scanAllCheckoutsStates } from '../../../private/store/scanAllCheckoutsStates.js';

export async function cloneStatus(ctx: WorkspaceContext): Promise<void> {
	await scanAllCheckoutsStates(ctx);
	presentCheckoutReport(ctx.config, ctx.store.getAllCheckouts());
}
