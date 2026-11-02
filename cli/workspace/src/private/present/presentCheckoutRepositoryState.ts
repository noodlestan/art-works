import type { CheckoutRepositoryState } from '../../commands/repo/runRepo.js';

export function presentCheckoutRepositoryState(state: CheckoutRepositoryState): void {
	console.info('');
	console.info(`Repository:`);
	console.info(`  name: ${state.target.repo?.name || '(unknown)'}`);
	console.info(`  remote: ${state.target.repo?.remote || '(unknown)'}`);
	if (state.issues.length > 0) {
		console.info(`  issues: ${state.issues.join('; ')}`);
	}

	console.info('');
	console.info(`Checkout:`);
	const handle = (state.target as { recordHandle?: { name?: string } }).recordHandle;
	console.info(`  record: ${handle?.name || '(unknown)'}`);
	console.info(`  location: ${state.target.record.location || '(unknown)'}`);
	console.info(`  branch: ${state.branch || state.target.record.branch}`);
	if (state.target.scan && state.target.scan.issues().length > 0) {
		console.info(`  states: ${state.target.scan.issues().join('; ')}`);
	}
}
