import { createCheckoutScan } from '../../../private/scan/private/createCheckoutScan.js';
import { createCommittedState } from '../../../private/scan/states/createCommittedState.js';
import { createExistsState } from '../../../private/scan/states/createExistsState.js';
import { createGitDirState } from '../../../private/scan/states/createGitDirState.js';
import { createNoConflictsState } from '../../../private/scan/states/createNoConflictsState.js';
import { createNoDetachedState } from '../../../private/scan/states/createNoDetachedState.js';
import { createRemoteState } from '../../../private/scan/states/createRemoteState.js';
import { createRepoState } from '../../../private/scan/states/createRepoState.js';
import { createSyncState } from '../../../private/scan/states/createSyncState.js';
import { createWrongRemoteState } from '../../../private/scan/states/createWrongRemoteState.js';
import type { CheckoutScan } from '../../../private/scan/types.js';

export type CheckoutScanScenario =
	'default' | 'ahead' | 'behind' | 'uncommitted' | 'no-remote' | 'not-cloned';

export function makeCheckoutScanFixture(scenarios: CheckoutScanScenario[] = []): CheckoutScan {
	const has = (scenario: CheckoutScanScenario) => scenarios.includes(scenario);

	const ahead = has('ahead') ? 1 : 0;
	const behind = has('behind') ? 1 : 0;
	const dirty = has('uncommitted');
	const hasRemote = !has('no-remote');

	return createCheckoutScan([
		createRepoState(false),
		createGitDirState(true),
		createExistsState(!has('not-cloned')),
		createRemoteState('main', 'main', hasRemote),
		createSyncState(ahead - behind, ahead, behind),
		createCommittedState(!dirty),
		createNoConflictsState(true),
		createNoDetachedState(true),
		createWrongRemoteState(false),
	]);
}
