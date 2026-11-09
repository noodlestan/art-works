import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { createOperationFailure } from '@art-lib/operations';

import { createCloneOperation } from '../../private/commands/operations/createCloneOperation.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { presentCheckoutReport } from '../../private/present/presentCheckoutReport.js';
import { presentOperationsReport } from '../../private/present/presentOperationsReport.js';
import { upsertCheckoutRecord } from '../../private/resources/checkout/upsertCheckoutRecord.js';
import type { RepositoryRecord } from '../../private/resources/types.js';
import { createCheckout } from '../../private/store/createCheckout.js';
import { createCheckoutLocation } from '../../private/store/createCheckoutLocation.js';
import { scanAllCheckoutsStates } from '../../private/store/scanAllCheckoutsStates.js';

import { cloneIfMissing } from './private/cloneIfMissing.js';

export async function cloneSpecific(
	ctx: WorkspaceContext,
	repos: RepositoryRecord[],
	repoName: string,
	checkoutInput?: string,
): Promise<void> {
	const canonical = repoName.startsWith('@') ? repoName.split('/')[1] : repoName;
	const repo = repos.find(r => r.name.toLowerCase() === canonical.toLowerCase());

	if (!repo) {
		ctx.log.log(
			createOperationFailure(createCloneOperation(undefined), `unknown repo "${repoName}"`),
		);
		presentOperationsReport(ctx.log);
		return;
	}

	const location = createCheckoutLocation(repo, checkoutInput);

	const existing = ctx.store.getCheckoutForLocation(location);
	if (existing && existing.repo?.name !== repo.name) {
		const msg = `location ${location} is already used by checkout '${existing.record.name}'.`;
		ctx.log.log(createOperationFailure(createCloneOperation(existing), msg));
		presentOperationsReport(ctx.log);
		return;
	}

	if (existing) {
		await cloneIfMissing(ctx, existing);
	} else {
		const targetDir = join(ctx.config.root.path, ctx.config.checkouts.path, location);
		if (existsSync(targetDir)) {
			const msg = `directory already exists at ${targetDir}`;
			ctx.log.log(createOperationFailure(createCloneOperation(undefined), msg));
			presentOperationsReport(ctx.log);
			return;
		}

		const checkoutName = checkoutInput ? `${repo.name} @ ${checkoutInput}` : repo.name;
		const created = createCheckout(ctx.config, location, repo, 'main', checkoutName);
		const withRecord = await upsertCheckoutRecord(ctx, created);
		ctx.store.addCheckout(withRecord);

		await cloneIfMissing(ctx, withRecord);
	}

	await scanAllCheckoutsStates(ctx);
	presentCheckoutReport(ctx.config, ctx.store.getAllCheckouts());
	presentOperationsReport(ctx.log);
}
