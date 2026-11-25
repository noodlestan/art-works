import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWorkspaceConfigFixture } from '../../test/helpers/context/makeWorkspaceConfigFixture.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { presentCheckoutReport } from './presentCheckoutReport.js';

const tempDirs: string[] = [];

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('presentCheckoutReport', () => {
	it('WHEN the report runs it calls console.info with Checkouts:', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const tempDir = makeTempDir(tempDirs);
		const config = makeWorkspaceConfigFixture(tempDir);

		presentCheckoutReport(config, []);

		expect(infoSpy).toHaveBeenCalledWith('Checkouts:');
	});
});
