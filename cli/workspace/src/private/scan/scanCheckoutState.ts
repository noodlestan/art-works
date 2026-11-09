import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { createOperationFailure } from '@art-lib/operations';

import type { WorkspaceContext } from '../context/createWorkspaceContext.js';
import { getBehindAheadCount } from '../git/getBehindAheadCount.js';
import { getCurrentBranch } from '../git/getCurrentBranch.js';
import { getRemoteBranch } from '../git/getRemoteBranch.js';
import { getRemoteUrl } from '../git/getRemoteUrl.js';
import { hasMergeConflicts } from '../git/hasMergeConflicts.js';
import { hasRemote } from '../git/hasRemote.js';
import { isDetachedHead } from '../git/isDetachedHead.js';
import { isDirty } from '../git/isDirty.js';
import { remoteFetch } from '../git/remoteFetch.js';
import type { Checkout } from '../store/types.js';

import { createCheckoutNoClonedScan } from './private/createCheckoutNoClonedScan.js';
import { createCheckoutScan } from './private/createCheckoutScan.js';
import { createScanCheckoutStateOperation } from './private/createScanCheckoutStateOperation.js';
import { createCommittedState } from './states/createCommittedState.js';
import { createExistsState } from './states/createExistsState.js';
import { createGitDirState } from './states/createGitDirState.js';
import { createNoConflictsState } from './states/createNoConflictsState.js';
import { createNoDetachedState } from './states/createNoDetachedState.js';
import { createRemoteState } from './states/createRemoteState.js';
import { createRepoState } from './states/createRepoState.js';
import { createSyncState } from './states/createSyncState.js';
import { createWrongRemoteState } from './states/createWrongRemoteState.js';

export async function scanCheckoutState(
	ctx: WorkspaceContext,
	checkout: Checkout,
	refetch = false,
): Promise<Checkout> {
	try {
		await access(checkout.path);
	} catch {
		return { ...checkout, scan: createCheckoutNoClonedScan(Boolean(checkout.repo)) };
	}
	const pending = createScanCheckoutStateOperation(checkout);
	ctx.log.log(pending);

	let hasGitDir = false;
	try {
		await access(join(checkout.path, '.git'));
		hasGitDir = true;
	} catch {
		hasGitDir = false;
	}

	let branch: string | null = null;
	let remoteBranch: string | null = null;
	let remote = false;
	let dirty = false;
	let conflicts = false;
	let detached = false;
	let ahead = 0;
	let behind = 0;
	let wrongRemote = false;
	if (hasGitDir) {
		try {
			branch = await getCurrentBranch(checkout.path);
			remote = await hasRemote(checkout.path);
			detached = await isDetachedHead(checkout.path);
			conflicts = await hasMergeConflicts(checkout.path);
			dirty = await isDirty(checkout.path);
			if (remote && branch !== '-' && branch !== 'HEAD') {
				remoteBranch = await getRemoteBranch(checkout.path);
				if (refetch) await remoteFetch(checkout.path);
				const { ahead: aheadCount, behind: behindCount } = await getBehindAheadCount(
					checkout.path,
					remoteBranch,
				);
				ahead = aheadCount;
				behind = behindCount;
			}
			if (remote && checkout.repo?.remote) {
				const actualUrl = await getRemoteUrl(checkout.path);
				if (actualUrl && actualUrl !== checkout.repo.remote) {
					wrongRemote = true;
				}
			}
		} catch (error) {
			ctx.log.log(createOperationFailure(pending, error));
		}
	}

	const remoteState = createRemoteState(branch, checkout.record.branch, remote);
	const scan = createCheckoutScan([
		createRepoState(Boolean(checkout.repo)),
		createGitDirState(hasGitDir),
		createExistsState(true),
		remoteState,
		createSyncState(ahead - behind, ahead, behind),
		createCommittedState(!dirty),
		createNoConflictsState(!conflicts),
		createNoDetachedState(!detached),
		createWrongRemoteState(wrongRemote),
	]);
	return { ...checkout, scan };
}
