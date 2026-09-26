import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare, isSimpleSuffix } from './share';
import { DEFAULT_SCRATCH, DEFAULT_SETTINGS, type LabSettings } from './types';

const settings = (patch: (s: LabSettings) => void): LabSettings => {
	const s = structuredClone(DEFAULT_SETTINGS);
	patch(s);
	return s;
};
/** A link payload written by hand, as an attacker could. */
const raw = (payload: unknown) =>
	'#s=' + btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('share links', () => {
	it('round-trips the lab state and the editor code', () => {
		const s = settings((s) => {
			s.tool = 'views';
			s.source.text = '1 2\n3 4';
			s.views = { suffix: '[:, 1]', write: true };
			s.autograd.requiresGrad.x = true;
		});
		const shared = decodeShare('#s=' + encodeShare(s, 'import numpy as np\nprint("ä ✓")'));
		expect(shared?.settings).toEqual(s);
		expect(shared?.code).toBe('import numpy as np\nprint("ä ✓")');
		expect(shared?.unsafe).toEqual([]);
	});

	it('stores only what differs from the defaults', () => {
		expect(encodeShare(DEFAULT_SETTINGS, DEFAULT_SCRATCH)).toBe(encodeShare(DEFAULT_SETTINGS));
		expect(encodeShare(settings((s) => (s.tool = 'axis'))).length).toBeLessThan(40);
	});

	it('ignores links it cannot read', () => {
		expect(decodeShare('')).toBeNull();
		expect(decodeShare('#step-2')).toBeNull();
		expect(decodeShare('#s=%%%')).toBeNull();
		expect(decodeShare('#s=bm90IGpzb24')).toBeNull();
		expect(decodeShare(raw({ v: 99, s: {} }))).toBeNull();
	});

	it('drops unknown keys, wrong types and values the UI cannot produce', () => {
		const shared = decodeShare(
			raw({
				v: 1,
				s: {
					tool: 'shell',
					evil: 'x',
					dtype: { target: 'int32); import os; (' },
					source: { dtype: 'object', mode: 'literal', text: 5 },
					axis: { axis: '0); import os #', fn: 'eval' },
					combine: { parts: 1e9, axis: 1.5 },
					autograd: { values: { x: 'NaN' }, lr: Infinity },
					pandas: { axis: 7, accessor: 'at' }
				}
			})
		)!;
		const d = DEFAULT_SETTINGS;
		expect(shared.settings.tool).toBe(d.tool);
		expect(shared.settings).not.toHaveProperty('evil');
		expect(shared.settings.dtype.target).toBe(d.dtype.target);
		expect(shared.settings.source).toEqual(d.source);
		expect(shared.settings.axis).toEqual(d.axis);
		expect(shared.settings.combine.parts).toBe(d.combine.parts);
		expect(shared.settings.combine.axis).toBe(0);
		expect(shared.settings.autograd.values.x).toBe(d.autograd.values.x);
		expect(shared.settings.autograd.lr).toBe(d.autograd.lr);
		expect(shared.settings.pandas.axis).toBe(d.pandas.axis);
		expect(shared.settings.pandas.accessor).toBe(d.pandas.accessor);
	});

	it('keeps axis=None and a torch focus', () => {
		const s = settings((s) => {
			s.axis.axis = null;
			s.torch.focus = 'device';
		});
		expect(decodeShare('#s=' + encodeShare(s))?.settings).toEqual(s);
	});

	it('asks before running expressions that are not plain numbers or slices', () => {
		const s = settings((s) => {
			s.source = { ...s.source, mode: 'expr', expr: '__import__("os").getcwd()' };
			s.index.expr = 'a.__class__';
			s.views.suffix = '.tolist()';
			s.pandas.select = 'df.eval("1")';
		});
		expect(decodeShare('#s=' + encodeShare(s))?.unsafe).toEqual([
			'a = __import__("os").getcwd()',
			'a[a.__class__]',
			'b = a.tolist()',
			"df.loc[df.eval(\"1\")]"
		]);
	});

	it('treats the lab’s own presets as plain', () => {
		const s = settings((s) => {
			s.source = { ...s.source, mode: 'expr', expr: 'np.random.default_rng(0).integers(0, 10, size=(3, 4))' };
		});
		expect(decodeShare('#s=' + encodeShare(s))?.unsafe).toEqual([]);
		s.source.expr = 'np.random.default_rng(0).integers(0, 10, size=exec("1"))';
		expect(decodeShare('#s=' + encodeShare(s))?.unsafe).toHaveLength(1);
	});

	it('does not ask for the usual expressions', () => {
		const s = settings((s) => {
			s.source = { ...s.source, mode: 'expr', expr: 'np.arange(24).reshape(2, 3, 4)' };
			s.index.expr = 'a > 3';
			s.views.suffix = '[:, 1].T.reshape(-1, 1).copy()';
			s.pandas.select = "'r0':'r1', 'B'";
		});
		expect(decodeShare('#s=' + encodeShare(s))?.unsafe).toEqual([]);
	});

	it('recognizes simple view suffixes', () => {
		for (const ok of ['', '[0]', '[a > 2]', '[[0, 1]]', '.T.ravel()', '.transpose(1, 0)', '[::-1][0]']) {
			expect(isSimpleSuffix(ok), ok).toBe(true);
		}
		for (const bad of ['.tolist()', '[0].__class__', '[__import__("os")]', '.reshape(eval("3"))', '[0']) {
			expect(isSimpleSuffix(bad), bad).toBe(false);
		}
	});
});
