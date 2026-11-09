import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCheckoutMock } from '../../../test/helpers/checkout/makeCheckoutMock.js';
import { makeCheckoutScanMock } from '../../../test/helpers/checkout/makeCheckoutScanMock.js';
import { makeCommandContextMock } from '../../../test/helpers/context/makeCommandContextMock.js';
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
	it('WHEN the checkout does not exist it logs a failure and returns null', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkout = makeCheckoutMock({
			path: join(workspaceDir, 'nonexistent'),
		});

		const result = await doCheckoutRun(ctx, checkout, 'echo hello');

		expect(result).toBeNull();
		const ops = ctx.log.all();
		expect(ops).toHaveLength(1);
		expect(ops[0].outcome).toBe('failure');
		expect(ops[0].text()).toContain('checkout not cloned');
	});

	it('WHEN the checkout exists it runs the command and logs success', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		const result = await doCheckoutRun(ctx, checkout, 'echo hello');

		expect(result).not.toBeNull();
		const ops = ctx.log.all();
		expect(ops.some(op => op.outcome === 'success')).toBe(true);
	});

	it('WHEN the command exits non-zero it logs a failure with the exit code', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		const result = await doCheckoutRun(ctx, checkout, 'exit 1');

		expect(result).not.toBeNull();
		const failure = ctx.log.all().find(op => op.outcome === 'failure');
		expect(failure).toBeDefined();
		expect(failure?.text()).toContain('Exit code: 1');
	});

	it('WHEN a successful command produces no output it prints [No output]', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		await doCheckoutRun(ctx, checkout, 'true');

		const infoOutput = (console.info as ReturnType<typeof vi.fn>).mock.calls
			.map(c => c[0])
			.join('');
		expect(infoOutput).toContain('[No output]');
	});

	it('WHEN a successful command returns stdout only it prints output', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		await doCheckoutRun(ctx, checkout, 'echo hello');

		const infoOutput = (console.info as ReturnType<typeof vi.fn>).mock.calls
			.map(c => c[0])
			.join('');
		expect(infoOutput).toContain('--- Output:\n');
		expect(infoOutput).toContain('hello');
	});

	it('WHEN a command returns stdout and stderr it prints output and error', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		await doCheckoutRun(ctx, checkout, 'echo out; echo err >&2');

		const infoOutput = (console.info as ReturnType<typeof vi.fn>).mock.calls
			.map(c => c[0])
			.join('');
		const errorOutput = (console.error as ReturnType<typeof vi.fn>).mock.calls
			.map(c => c[0])
			.join('');
		expect(infoOutput).toContain('--- Output:\n');
		expect(infoOutput).toContain('out');
		expect(errorOutput).toContain('---\n');
		expect(errorOutput).toContain('err');
	});

	it('WHEN an unsuccessful command returns stderr it prints label and stderr', async () => {
		const workspaceDir = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(workspaceDir);
		const checkoutDir = join(workspaceDir, 'checkout');
		mkdirSync(checkoutDir, { recursive: true });
		const checkout = makeCheckoutMock({
			path: checkoutDir,
			scan: makeCheckoutScanMock(),
		});

		await doCheckoutRun(ctx, checkout, 'echo err >&2; exit 1');

		const errorOutput = (console.error as ReturnType<typeof vi.fn>).mock.calls
			.map(c => c[0])
			.join('');
		expect(errorOutput).toContain('--- Error:\n');
		expect(errorOutput).toContain('err');
	});
});
