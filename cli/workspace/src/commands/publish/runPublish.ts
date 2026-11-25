import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { createPublishOperation } from '../../private/operations/createPublishOperation.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runPublish(
	ctx: WorkspaceContext,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	options: { root: string; auto?: boolean },
): Promise<void> {
	ctx.operations.log(createGenericOperation('command', ['publish', options]));
	ctx.operations.log(createPublishOperation(ctx.workspace, '', ''));
	// TODO: implement publish command
	console.info('publish command - TODO');
}
