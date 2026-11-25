import { describe, expect, it } from 'vitest';

import { makeWorkspaceConfigFixture } from '../../test/helpers/context/makeWorkspaceConfigFixture.js';

import { createCheckout } from './createCheckout.js';

describe('createCheckout', () => {
	it('GIVEN no overrides it applies the factory defaults', () => {
		const config = makeWorkspaceConfigFixture('.');
		const checkout = createCheckout(config, 'target');

		expect(checkout.path).toBe('checkouts/target');
		expect(checkout.repo).toBe(undefined);
		expect(checkout.record.repository).toBe(undefined);
		expect(checkout.record.name).toBe('target');
		expect(checkout.record.location).toBe('target');
		expect(checkout.record.branch).toBe('main');
	});

	it('WHEN a repo is provided it creates a checkout based on the repo', () => {
		const config = makeWorkspaceConfigFixture('.');
		const repo = { name: 'Foo Bar', remote: 'git@example.com:foo-bar.git' };
		const checkout = createCheckout(config, 'fix-test', repo);

		expect(checkout.path).toBe('checkouts/fix-test');
		expect(checkout.repo).toBe(repo);
		expect(checkout.record.repository).toBe('Foo Bar');
		expect(checkout.record.name).toBe('Foo Bar @ fix-test');
		expect(checkout.record.location).toBe('fix-test');
		expect(checkout.record.branch).toBe('main');
	});

	it('WHEN a branch is provided it creates a checkout with that branch', () => {
		const config = makeWorkspaceConfigFixture('.');
		const repo = { name: 'Foo Bar', remote: 'git@example.com:foo-bar.git' };
		const checkout = createCheckout(config, 'fix-test', repo, 'branch-name');

		expect(checkout.path).toBe('checkouts/fix-test');
		expect(checkout.record.name).toBe('Foo Bar @ fix-test');
		expect(checkout.record.location).toBe('fix-test');
		expect(checkout.record.branch).toBe('branch-name');
	});

	it('WHEN repo, target and custom name are provided it creates the checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const repo = { name: 'Foo Bar', remote: 'git@example.com:foo-bar.git' };
		const checkout = createCheckout(config, 'fix-test', repo, undefined, 'Checkout Name');

		expect(checkout.path).toBe('checkouts/fix-test');
		expect(checkout.repo).toBe(repo);
		expect(checkout.record.name).toBe('Checkout Name');
		expect(checkout.record.location).toBe('fix-test');
		expect(checkout.record.branch).toBe('main');
	});
});
