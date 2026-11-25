import { describe, expect, it } from 'vitest';

import { runWithConcurrency } from './runWithConcurrency.js';

describe('runWithConcurrency', () => {
	it('WHEN there are more items than the limit it runs all tasks within the limit', async () => {
		const items = [1, 2, 3, 4];
		const completed: number[] = [];
		let activeTasks = 0;
		let maximumActiveTasks = 0;

		await runWithConcurrency(items, 2, async item => {
			activeTasks += 1;
			maximumActiveTasks = Math.max(maximumActiveTasks, activeTasks);
			await Promise.resolve();
			completed.push(item);
			activeTasks -= 1;
		});

		expect(maximumActiveTasks).toBe(2);
		expect(completed.sort()).toEqual(items);
	});
});
