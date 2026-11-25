import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCheckoutFixture } from '../../../test/helpers/checkout/makeCheckoutFixture.js';
import { makeCheckoutScanFixture } from '../../../test/helpers/checkout/makeCheckoutScanFixture.js';
import { createWorkspaceContextMock } from '../../../test/helpers/context/createWorkspaceContextMock.js';
import { makeTempDir } from '../../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../../test/helpers/tempDirs/removeTempDirs.js';

import { doCheckoutRun } from './doCheckoutRun.js';

const tempDirs: string[] = [];

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('doCheckoutRun', () => {
	it('WHEN the checkout does not exist, it logs failure and returns null', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkout = makeCheckoutFixture({ path: join(workspaceDir, 'nonexistent') });

		const result = await doCheckoutRun(ctx, checkout, 'echo hello');

		expect(result).toBeNull();
		const expectedFailureOp = expect.objectContaining({ operation: 'run', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenCalledExactlyOnceWith(expectedFailureOp);
		const failure = vi.mocked(ctx.operations.log).mock.calls[0]?.[0];
		expect(failure?.text()).toContain('checkout not cloned');
	});

	it('WHEN the checkout exists and the command succeeds, it logs success', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		const result = await doCheckoutRun(ctx, checkout, 'echo hello');

		expect(result).not.toBeNull();
		const expectedPendingOp = expect.objectContaining({ operation: 'run', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedSuccessOp = expect.objectContaining({ operation: 'run', outcome: 'success' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedSuccessOp);
	});

	it('WHEN the command exits non-zero, it logs a failure with the exit code', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		const result = await doCheckoutRun(ctx, checkout, 'exit 1');

		expect(result).not.toBeNull();
		const expectedPendingOp = expect.objectContaining({ operation: 'run', outcome: 'pending' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(1, expectedPendingOp);
		const expectedFailureOp = expect.objectContaining({ operation: 'run', outcome: 'failure' });
		expect(ctx.operations.log).toHaveBeenNthCalledWith(2, expectedFailureOp);
		const failure = vi.mocked(ctx.operations.log).mock.calls[1]?.[0];
		expect(failure?.text()).toContain('Exit code: 1');
	});

	it('WHEN a successful command produces no output, it prints the no-output notice', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		await doCheckoutRun(ctx, checkout, 'true');

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('\n--- [No output]\n');
	});

	it('WHEN a successful command returns stdout, it prints the output', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		await doCheckoutRun(ctx, checkout, 'echo hello');

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('\n--- Output:\n');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(expect.stringContaining('hello'));
	});

	it('WHEN a command returns stdout and stderr, it prints both', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		await doCheckoutRun(ctx, checkout, 'echo out; echo err >&2');

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('\n--- Output:\n');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(expect.stringContaining('out'));
		expect(vi.mocked(console.error)).toHaveBeenCalledWith('\n---\n');
		expect(vi.mocked(console.error)).toHaveBeenCalledWith(expect.stringContaining('err'));
	});

	it('WHEN an unsuccessful command returns stderr, it labels and prints the error', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = createWorkspaceContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutFixture({
			path: checkoutDir,
			scan: makeCheckoutScanFixture(),
		});

		await doCheckoutRun(ctx, checkout, 'echo err >&2; exit 1');

		expect(vi.mocked(console.error)).toHaveBeenCalledWith('\n--- Error:\n');
		expect(vi.mocked(console.error)).toHaveBeenCalledWith(expect.stringContaining('err'));
	});
});
