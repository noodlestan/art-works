import { describe, expect, it } from 'vitest';

import { makeWorkspaceConfigFixture } from '../../test/helpers/context/makeWorkspaceConfigFixture.js';

import { createCheckout } from './createCheckout.js';
import { createCheckoutStore } from './createCheckoutStore.js';

describe('createCheckoutStore', () => {
	it('WHEN a checkout is added it stores the provided checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);

		store.addCheckout(c);

		const checkout = store.getAllCheckouts()[0];
		expect(checkout).toBeDefined();
		expect(checkout?.repo).toBe(repo);
		expect(checkout?.record.name).toBe('Foo Bar @ fix-test');
		expect(checkout?.record.location).toBe('fix-test');
	});

	it('WHEN a duplicate checkout is added it rejects it', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c1 = createCheckout(config, 'fix-test', repo, undefined, 'one');
		store.addCheckout(c1);

		const c2 = createCheckout(config, 'fix-test', repo, undefined, 'two');
		store.addCheckout(c2);

		const checkouts = store.getAllCheckouts();
		expect(checkouts.length).toBe(1);
		expect(checkouts[0]).toBeDefined();
		expect(checkouts[0]?.repo).toBe(repo);
		expect(checkouts[0]?.record.name).toBe('one');
	});

	it('WHEN a checkout exists, getCheckoutByName returns it by its full name', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };

		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const checkout = store.getCheckoutByName('Foo Bar @ fix-test');
		expect(checkout).toBeDefined();
		expect(checkout?.repo?.name).toBe('Foo Bar');
	});

	it('WHEN a checkout exists, getCheckoutForLocation returns it by its location', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };

		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const checkout = store.getCheckoutForLocation('fix-test');
		expect(checkout).toBeDefined();
		expect(checkout?.repo?.name).toBe('Foo Bar');
	});

	it('WHEN the repo name differs in case getCheckoutOfRepo still matches', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };

		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		expect(store.getCheckoutOfRepo('FOO BAR')).toBeDefined();
		expect(store.getCheckoutOfRepo('foo bar')).toBeDefined();
	});

	it('WHEN a checkout is updated it replaces the existing checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const updated = { ...c, exists: true };
		store.updateCheckout(updated);

		expect(store.getAllCheckouts().length).toBe(1);
		expect(store.getCheckoutForLocation('fix-test')).toBeDefined();
	});

	it('WHEN a checkout is updated it replaces by location', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c1 = createCheckout(config, 'fix-test', repo, undefined, 'one');
		store.addCheckout(c1);

		const c2 = createCheckout(config, 'fix-test', repo, undefined, 'two');
		store.updateCheckout(c2);

		const checkouts = store.getAllCheckouts();
		expect(checkouts.length).toBe(1);
		expect(checkouts[0].record.name).toBe('two');
		expect(checkouts[0].record.location).toBe('fix-test');
	});

	it('FOR an exact name pattern it returns the matching checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const results = store.getCheckoutsByPattern(['Foo Bar @ fix-test']);
		expect(results).toHaveLength(1);
		expect(results[0].record.location).toBe('fix-test');
	});

	it('FOR an exact location pattern it returns the matching checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const results = store.getCheckoutsByPattern(['fix-test']);
		expect(results).toHaveLength(1);
		expect(results[0].record.location).toBe('fix-test');
	});

	it('FOR an exact pattern with no match it warns and returns nothing', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const results = store.getCheckoutsByPattern(['nonexistent']);
		expect(results).toHaveLength(0);
	});

	it('FOR a wildcard name pattern it returns the matching checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const results = store.getCheckoutsByPattern(['* @ fix-test']);
		expect(results).toHaveLength(1);
		expect(results[0].record.location).toBe('fix-test');
	});

	it('FOR a wildcard location pattern it returns the matching checkouts', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);
		const c2 = createCheckout(config, 'fix-prod', repo);
		store.addCheckout(c2);

		const results = store.getCheckoutsByPattern(['fix-*']);
		expect(results).toHaveLength(2);
	});

	it('FOR mixed patterns it returns the deduplicated matches', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);
		const c2 = createCheckout(config, 'prod-test', repo);
		store.addCheckout(c2);

		const results = store.getCheckoutsByPattern(['fix-test', 'prod*']);
		expect(results).toHaveLength(2);
	});

	it('FOR a pattern differing in case it returns the matching checkout', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);

		const results = store.getCheckoutsByPattern(['FOO BAR @ FIX-TEST']);
		expect(results).toHaveLength(1);
		expect(results[0].record.location).toBe('fix-test');
	});

	it('FOR a wildcard matching two checkouts it returns both deduplicated', () => {
		const config = makeWorkspaceConfigFixture('.');
		const store = createCheckoutStore();
		const repo = { name: 'Foo Bar', remote: 'git@example.com:test.git' };
		const c = createCheckout(config, 'fix-test', repo);
		store.addCheckout(c);
		const c2 = createCheckout(config, 'fix-prod', repo);
		store.addCheckout(c2);

		const results = store.getCheckoutsByPattern(['fix-*']);
		expect(results).toHaveLength(2);
	});
});
