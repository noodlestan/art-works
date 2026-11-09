import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { loadCheckoutRecords } from '../../private/resources/checkout/loadCheckoutRecords.js';
import { loadRepositoryRecords } from '../../private/resources/repository/loadRepositoryRecords.js';
import { hydrateStoreFromRecords } from '../../private/store/hydrateStoreFromRecords.js';

import { cloneAll } from './cloneAll.js';
import { cloneSpecific } from './cloneSpecific.js';
import { cloneStatus } from './cloneStatus.js';

interface CloneOptions {
	all?: boolean;
	repoName?: string;
	checkoutInput?: string;
}

export async function runClone(
	ctx: WorkspaceContext,
	options: CloneOptions,
): Promise<WorkspaceContext> {
	const repos = await loadRepositoryRecords(ctx);
	const records = await loadCheckoutRecords(ctx, repos);
	hydrateStoreFromRecords(ctx.config, ctx.store, records);

	ctx.log.log(createGenericOperation('command', ['clone', options]));

	const { all, repoName, checkoutInput } = options;

	if (all) {
		await cloneAll(ctx, repos);
	} else if (repoName) {
		await cloneSpecific(ctx, repos, repoName, checkoutInput);
	} else {
		await cloneStatus(ctx);
	}

	return ctx;
}
