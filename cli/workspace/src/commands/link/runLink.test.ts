import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';

import { runLink } from './runLink.js';

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('link command', () => {
	it('WHEN runLink runs, it logs its TODO status message', async () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const ctx = createWorkspaceContextMock('/tmp');

		await runLink(ctx, { root: '/tmp' });

		expect(infoSpy).toHaveBeenCalledWith('link command - TODO');
	});
});
