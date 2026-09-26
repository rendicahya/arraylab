import { describe, expect, it } from 'vitest';
import { fitLabels, isSimpleSelection, parseLabels, parseSeries, pyLabels } from './codegen';

describe('pandas labels', () => {
	it('parses words as text labels and whole numbers as number labels', () => {
		expect(parseLabels('r0 r1, Ana')).toEqual({ ok: true, value: ['r0', 'r1', 'Ana'] });
		expect(parseLabels('10 20')).toEqual({ ok: true, value: [10, 20] });
		expect(pyLabels(['r0', 10])).toBe("['r0', 10]");
		expect(parseLabels('')).toEqual({ ok: true, value: [] });
	});

	it('rejects labels that are not safe literals, and repeats', () => {
		expect(parseLabels("a'); import os").ok).toBe(false);
		expect(parseLabels('A A').ok).toBe(false);
	});

	it('fits labels to the number of rows or columns by continuing the pattern', () => {
		expect(fitLabels(['A', 'B', 'C'], 2, 'columns')).toEqual(['A', 'B']);
		expect(fitLabels(['A', 'B'], 4, 'columns')).toEqual(['A', 'B', 'C', 'D']);
		expect(fitLabels(['r0', 'r1'], 3, 'index')).toEqual(['r0', 'r1', 'r2']);
		expect(fitLabels([10, 20], 4, 'index')).toEqual([10, 20, 30, 40]);
		expect(fitLabels([], 5, 'index')).toEqual([]);
	});
});

describe('pandas Series input', () => {
	it('parses label:value pairs', () => {
		expect(parseSeries('a:1 b=2.5, c:nan')).toEqual({ ok: true, value: { labels: ['a', 'b', 'c'], values: ['1', '2.5', 'np.nan'] } });
	});
	it('explains bad input', () => {
		expect(parseSeries('a 1').ok).toBe(false);
		expect(parseSeries('a:x').ok).toBe(false);
		expect(parseSeries('a:1 a:2').ok).toBe(false);
		expect(parseSeries('').ok).toBe(false);
	});
});

describe('selections that run as you type', () => {
	it('accepts labels, positions, slices and masks', () => {
		for (const expr of ["'r0', 'B'", '0:1, 0:2', "['A', 'C']", "df['A'] > 2", ":, 'B'", '-1']) {
			expect(isSimpleSelection(expr), expr).toBe(true);
		}
	});
	it('waits for Apply on anything else', () => {
		for (const expr of ['__import__("os")', "df.drop('A')", 'print(1)']) {
			expect(isSimpleSelection(expr), expr).toBe(false);
		}
	});
});
