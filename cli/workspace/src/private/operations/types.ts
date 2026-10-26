import type { Checkout } from '../store/createCheckout.js';

export type CheckoutOp =
	'clone' | 'push' | 'pull' | 'publish' | 'branch' | 'linked' | 'unlink' | 'run';

export type OperationOutcome = 'pending' | 'success' | 'failure';

export interface OperationBase {
	operation: string;
	ts: Date; // created when the pending op is logged
	finishedTs?: Date; // set when the op resolves (success/failure)
	checkout?: Checkout;
	outcome: OperationOutcome;
	message: () => string;
	timing: () => number; // finishedTs ? finishedTs.getTime() - ts.getTime() : NaN
}

export interface OperationPending extends OperationBase {
	outcome: 'pending';
	data?: unknown;
}

export interface OperationSuccess extends OperationBase {
	outcome: 'success';
	data?: unknown;
}

export interface OperationFailure extends OperationBase {
	outcome: 'failure';
	error: string;
	errorSerialized: () => string;
	data?: unknown;
}

export interface ClonePending extends OperationPending {
	operation: 'clone';
	location: string;
}

export interface PushPending extends OperationPending {
	operation: 'push';
	branch: string;
}

export interface PullPending extends OperationPending {
	operation: 'pull';
	branch: string;
}

export interface PublishPending extends OperationPending {
	operation: 'publish';
	package: string;
	version: string;
}

export interface BranchPending extends OperationPending {
	operation: 'branch';
	branch: string;
}

export interface LinkedPending extends OperationPending {
	operation: 'linked';
	package: string;
	target: string;
}

export interface UnlinkPending extends OperationPending {
	operation: 'unlink';
	package: string;
	source: string;
}

export interface CheckoutRunPending extends OperationPending {
	operation: 'run';
	command: string;
}

export type Operation =
	| ClonePending
	| PushPending
	| PullPending
	| PublishPending
	| BranchPending
	| LinkedPending
	| UnlinkPending
	| CheckoutRunPending
	| OperationPending
	| OperationSuccess
	| OperationFailure;
