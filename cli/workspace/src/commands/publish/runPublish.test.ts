import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkspaceContextMock } from '../../test/helpers/context/createWorkspaceContextMock.js';

import { runPublish } from './runPublish.js';

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('publish command', () => {
	it('WHEN runPublish runs, it logs its TODO status message', async () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const ctx = createWorkspaceContextMock('/tmp');

		await runPublish(ctx, { root: '/tmp' });

		expect(infoSpy).toHaveBeenCalledWith('publish command - TODO');
	});
});
