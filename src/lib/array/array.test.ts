import { describe, expect, it } from 'vitest';
import { literalToCode, parseLiteral } from './literal';
import { alignShapes } from './broadcast';
import { flatIndex, formatShape, unravel, axisRoles, reshapeSuggestions } from './normalize';
import { explainError } from './errors';

describe('parseLiteral', () => {
	it('parses rows into a 2-D array', () => {
		const r = parseLiteral('1 2 3\n4 5 6');
		expect(r.ok && r.shape).toEqual([2, 3]);
		if (r.ok) {
			expect(literalToCode('a', r.nested)).toBe(
				'a = np.array([[1, 2, 3],\n              [4, 5, 6]])'
			);
		}
	});
	it('parses a single line as 1-D and a single value as 0-d', () => {
		const one = parseLiteral('1, 2, 3');
		expect(one.ok && one.shape).toEqual([3]);
		const zero = parseLiteral(' 7 ');
		expect(zero.ok && zero.shape).toEqual([]);
		if (zero.ok) expect(literalToCode('b', zero.nested)).toBe('b = np.array(7)');
	});
	it('uses blank lines for 3-D layers and aligns like NumPy', () => {
		const r = parseLiteral('1 2\n3 4\n\n5 6\n7 10');
		expect(r.ok && r.shape).toEqual([2, 2, 2]);
		if (r.ok)
			expect(literalToCode('a', r.nested, 'float32')).toBe(
				'a = np.array([[[ 1,  2],\n               [ 3,  4]],\n\n              [[ 5,  6],\n               [ 7, 10]]], dtype=np.float32)'
			);
	});
	it('accepts booleans, nan, inf, complex and pasted lists', () => {
		const r = parseLiteral('[[true, nan], [-inf, 1+2j]]');
		expect(r.ok && r.nested).toEqual([
			['True', 'np.nan'],
			['-np.inf', '1+2j']
		]);
	});
	it('reports ragged rows and invalid tokens', () => {
		const r = parseLiteral('1 2 3\n4 5');
		expect(r.ok && r.shape).toBeNull();
		expect(r.ok && r.ragged).toMatch(/Row 2 has 2 values/);
		const bad = parseLiteral('1 2 x');
		expect(bad.ok).toBe(false);
		const inject = parseLiteral('__import__("os")');
		expect(inject.ok).toBe(false);
	});
});

describe('shape helpers', () => {
	it('round-trips C-order indices', () => {
		expect(flatIndex([1, 2], [2, 3])).toBe(5);
		expect(unravel(23, [2, 3, 4])).toEqual([1, 2, 3]);
	});
	it('formats tuples like Python', () => {
		expect(formatShape([])).toBe('()');
		expect(formatShape([3])).toBe('(3,)');
		expect(formatShape([2, 3])).toBe('(2, 3)');
	});
	it('names axes by structure', () => {
		expect(axisRoles(1)).toEqual(['elements']);
		expect(axisRoles(3)).toEqual(['blocks', 'rows', 'columns']);
	});
	it('suggests valid reshapes', () => {
		expect(reshapeSuggestions(6)).toEqual(['(6,)', '(2, 3)', '(3, 2)']);
	});
});

describe('alignShapes', () => {
	it('pads missing dimensions and stretches 1s', () => {
		const al = alignShapes([[2, 3], [3]]);
		expect(al.compatible).toBe(true);
		expect(al.resultShape).toEqual([2, 3]);
		expect(al.columns.map((c) => c.status)).toEqual(['missing', 'equal']);
		expect(alignShapes([[2, 1], [1, 3]]).resultShape).toEqual([2, 3]);
		expect(alignShapes([[4, 3], []]).resultShape).toEqual([4, 3]);
	});
	it('detects conflicts', () => {
		const al = alignShapes([[2, 3], [2]]);
		expect(al.compatible).toBe(false);
		expect(al.columns[1].status).toBe('conflict');
	});
});

describe('explainError', () => {
	it('explains broadcasting failures with an alignment diagram', () => {
		const e = explainError({
			type: 'ValueError',
			message: 'operands could not be broadcast together with shapes (2,3) (2,) ',
			line: 1
		});
		expect(e.title).toMatch(/cannot be broadcast/);
		expect(e.diagram).toContain('✕');
		expect(e.hint).toMatch(/reshape\(2, 1\)/);
	});
	it('explains reshape failures', () => {
		const e = explainError({
			type: 'ValueError',
			message: 'cannot reshape array of size 6 into shape (4,)',
			line: 1
		});
		expect(e.hint).toContain('(2, 3)');
	});
	it('falls back to a generic explanation', () => {
		expect(explainError({ type: 'KeyError', message: "'x'", line: 3 }).title).toBe(
			'Python raised a KeyError (line 3).'
		);
	});
});
