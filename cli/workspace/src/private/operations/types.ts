import type { OperationFailure, OperationPending, OperationSuccess } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

export type CheckoutOp =
	'clone' | 'push' | 'pull' | 'publish' | 'branch' | 'linked' | 'unlink' | 'run';

/** The payload of each command operation; `checkout` rides inside `data`. */
export type CloneData = {
	checkout?: Checkout;
	location: string;
};

export type PushData = {
	checkout?: Checkout;
	branch: string;
};

export type PullData = {
	checkout?: Checkout;
	branch: string;
};

export type PublishData = {
	checkout?: Checkout;
	package: string;
	version: string;
};

export type BranchData = {
	checkout?: Checkout;
	branch: string;
};

export type LinkedData = {
	checkout?: Checkout;
	package: string;
	target: string;
};

export type UnlinkData = {
	checkout?: Checkout;
	package: string;
	source: string;
};

export type CheckoutRunData = {
	checkout?: Checkout;
	command: string;
};

export type ScanCheckoutStateData = {
	checkout: Checkout;
	location: string;
};

export type ClonePending = OperationPending<CloneData> & {
	operation: 'clone';
};

export type PushPending = OperationPending<PushData> & {
	operation: 'push';
};

export type PullPending = OperationPending<PullData> & {
	operation: 'pull';
};

export type PublishPending = OperationPending<PublishData> & {
	operation: 'publish';
};

export type BranchPending = OperationPending<BranchData> & {
	operation: 'branch';
};

export type LinkedPending = OperationPending<LinkedData> & {
	operation: 'linked';
};

export type UnlinkPending = OperationPending<UnlinkData> & {
	operation: 'unlink';
};

export type CheckoutRunPending = OperationPending<CheckoutRunData> & {
	operation: 'run';
};

export type ScanCheckoutStatePending = OperationPending<ScanCheckoutStateData> & {
	operation: 'scan-checkout-state';
};

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
