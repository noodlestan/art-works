import { describe, expect, it } from 'vitest';

import { makeWorkspaceConfigFixture } from '../test/helpers/context/makeWorkspaceConfigFixture.js';

import { defineConfig } from './index.js';

describe('defineConfig', () => {
	it('WHEN a config is defined it returns the input config unchanged', () => {
		const config = makeWorkspaceConfigFixture('.');

		expect(defineConfig(config)).toEqual(config);
	});
});
