import type {
	OperationFailure as SharedOperationFailure,
	OperationPending as SharedOperationPending,
	OperationSuccess as SharedOperationSuccess,
} from '@art-lib/operations';

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

export type ClonePending = SharedOperationPending<CloneData> & {
	operation: 'clone';
};

export type PushPending = SharedOperationPending<PushData> & {
	operation: 'push';
};

export type PullPending = SharedOperationPending<PullData> & {
	operation: 'pull';
};

export type PublishPending = SharedOperationPending<PublishData> & {
	operation: 'publish';
};

export type BranchPending = SharedOperationPending<BranchData> & {
	operation: 'branch';
};

export type LinkedPending = SharedOperationPending<LinkedData> & {
	operation: 'linked';
};

export type UnlinkPending = SharedOperationPending<UnlinkData> & {
	operation: 'unlink';
};

export type CheckoutRunPending = SharedOperationPending<CheckoutRunData> & {
	operation: 'run';
};

export type ScanCheckoutStatePending = SharedOperationPending<ScanCheckoutStateData> & {
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
	| SharedOperationPending
	| SharedOperationSuccess
	| SharedOperationFailure;
