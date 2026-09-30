import { lang } from '../lang.svelte';

/**
 * Translations for ViewsView.svelte, CombineView.svelte and CodeResultView.svelte.
 * Same t()-style convention as ../strings.ts, kept in its own file so it can be
 * edited independently of the shared UI-chrome dictionary.
 */

const en = {
	views: {
		exprAria: 'What follows a, e.g. [:, 1] or .T (empty: b = a)',
		nothing: '(nothing)',
		apply: 'Apply',
		writeIntoB: 'then write into b:',
		presetsAria: 'Ways to make b from a',
		presetNote: {
			same: 'same',
			slice: 'slice',
			reshape: 'reshape',
			list: 'list',
			mask: 'mask',
			copy: 'copy',
			row: 'row',
			column: 'column',
			transpose: 'transpose',
			ravel: 'ravel',
			flatten: 'flatten',
			tThenRavel: 'T then ravel',
			block: 'block'
		} as Record<string, string>,
		beforeWrite: ' · before the write',
		scalarOf: (type: string) => `scalar · ${type}`,
		shapeOf: (shape: string, dtype: string) => `${shape} · ${dtype}`,
		sharesMemoryTitle: (v: string) => `np.shares_memory(a, b) → ${v}`,
		tag: { same: 'the same array (b is a)', view: 'view of a', scalar: 'scalar (copied value)', copy: 'copy' },
		memoryLabel: 'Memory',
		memoryHeading: (itemsize: number) => `Memory · one row of bytes, ${itemsize} per element`,
		whoAB: 'a, b',
		whoAViewedByB: 'a (b looks into it)',
		who: 'a',
		stripAriaA: "a's elements in memory order",
		sharedWith: (pos: string) => `shared with b position ${pos}`,
		copiedTo: (pos: string) => `copied to b position ${pos}`,
		stripAriaB: "b's own memory",
		separateBlock: 'separate block',
		toMoveAlong: 'to move along',
		axisOfB: (ax: number) => `axis ${ax} of b:`,
		inAMemory: "in a’s memory.",
		afterWrite: 'After the write',
		afterAssign: (code: string) => `after ${code}`,
		after: 'after',
		elementsChanged: (n: number) => `${n} element${n === 1 ? '' : 's'} changed`,
		unchanged: 'unchanged',
		sameMemoryAs: (where: string) => `the same memory as ${where}`,
		copiedInto: (where: string) => `copied into ${where}`,
		isWhere: (where: string) => `is ${where}`,
		copiedFrom: (where: string) => `copied from ${where}`,
		changedByWrite: 'changed by writing into b',
		explainSame: (write: boolean) =>
			'`b = a` copies **nothing**: `b` is a second name for the same array (`b is a` → True).' +
			(write ? ' Writing into `b` is writing into `a`.' : ''),
		explainView:
			'`b` is a **view**: a new array object that looks into `a`’s memory (`np.shares_memory(a, b)` → True). Nothing was copied — only a new shape and strides.',
		explainViewWrite: (n: number) => `Writing into \`b\` changed **${n}** element${n === 1 ? '' : 's'} of \`a\` (dashed).`,
		explainViewNoWrite: 'Tick **write into b** to see what that means for `a`.',
		explainScalar: (write: boolean) =>
			'One integer per axis gives a single element: a NumPy scalar, not an array. Its value is **copied out**, so it is not linked to `a`' +
			(write ? ' — and a scalar cannot be written into' : '') +
			'.',
		explainCopyIntro: '`b` is a **copy** with its own memory (`np.shares_memory(a, b)` → False).',
		explainCopyWrite: (write: boolean) => (write ? 'Writing into b left a unchanged.' : 'Writing into b will not change a.'),
		needIndependent: 'Need an independent array?'
	},
	combine: {
		operationAria: 'Operation',
		opTitles: {
			concatenate: 'Join along an existing axis',
			stack: 'Join along a new axis',
			split: 'Cut a into equal pieces'
		} as Record<string, string>,
		axisLabel: 'axis',
		lastAxisTitle: 'the last axis',
		piecesLabel: 'pieces',
		bInputLabel: 'b — type numbers (new line = new row, [[…]] for one row)',
		presetsAria: 'Example shapes for b',
		presetLabels: {
			'same shape': 'same shape',
			'one row': 'one row',
			'one column': 'one column',
			'1-D': '1-D',
			shorter: 'shorter'
		} as Record<string, string>,
		planAria: 'Shapes along each axis',
		newMemoryTitle: 'np.concatenate and np.stack always write into new memory',
		newMemoryTag: 'new memory (copy)',
		cutAlong: (axis: number) => ` · cut along axis ${axis}`,
		sharesMemoryTitle: (i: number) => `np.shares_memory(parts[${i}], a)`,
		viewOfA: 'view of a',
		copy: 'copy',
		newBadge: 'new',
		explainConcatenate: (k: number, a: number, b: number, ndim: number) =>
			`\`np.concatenate\` joins along an **existing** axis: along axis ${k} the sizes add up (${a} + ${b}); every other axis must already match. ndim stays ${ndim}.`,
		explainConcatenateMuted: 'Hover a result cell to see where it came from. The result is new memory: changing it does not change `a` or `b`.',
		explainStack: (k: number, ndimA: number, ndimResult: number) =>
			`\`np.stack\` joins along a **new** axis ${k}: ndim goes from ${ndimA} to ${ndimResult}. It is the same as giving each array that axis first and then concatenating:`,
		explainStackExpand: (k: number, expanded: string) => `each input becomes \`${expanded}\`.`,
		explainStackNewaxis: '`np.expand_dims(a, 0)` is the same as `a[np.newaxis]`.',
		explainSplit: (n: number, axis: number) => `\`np.split\` cuts \`a\` into ${n} equal pieces along axis ${axis} and returns a **list**. The pieces are **views**: they share memory with \`a\` (chapter 08).`,
		explainSplitMuted: 'Pieces must be equal. For uneven pieces use `np.array_split`.'
	},
	codeResult: {
		stopped: 'Stopped.',
		stoppedRest: 'Press Run to start again.',
		emptyTitle: 'Write NumPy (or pandas) code in the editor below and press Run',
		emptyOr: 'or',
		emptyBody:
			'Arrays and DataFrames you create appear here. The variables from the tools (`a`, `b`, `result`) live in the same Python session, so you can use them directly.',
		variablesAria: 'Arrays in this session',
		variables: 'Variables',
		lastExpression: 'Last expression',
		type: 'type:'
	}
};

const id = {
	views: {
		exprAria: 'Apa yang mengikuti a, mis. [:, 1] atau .T (kosong: b = a)',
		nothing: '(tidak ada)',
		apply: 'Terapkan',
		writeIntoB: 'lalu tulis ke b:',
		presetsAria: 'Cara membuat b dari a',
		presetNote: {
			same: 'sama',
			slice: 'slice',
			reshape: 'reshape',
			list: 'list',
			mask: 'mask',
			copy: 'copy',
			row: 'baris',
			column: 'kolom',
			transpose: 'transpose',
			ravel: 'ravel',
			flatten: 'flatten',
			tThenRavel: 'T lalu ravel',
			block: 'blok'
		} as Record<string, string>,
		beforeWrite: ' · sebelum penulisan',
		scalarOf: (type: string) => `skalar · ${type}`,
		shapeOf: (shape: string, dtype: string) => `${shape} · ${dtype}`,
		sharesMemoryTitle: (v: string) => `np.shares_memory(a, b) → ${v}`,
		tag: { same: 'array yang sama (b is a)', view: 'view dari a', scalar: 'skalar (nilai disalin)', copy: 'copy' },
		memoryLabel: 'Memori',
		memoryHeading: (itemsize: number) => `Memori · satu baris byte, ${itemsize} per elemen`,
		whoAB: 'a, b',
		whoAViewedByB: 'a (b melihat ke dalamnya)',
		who: 'a',
		stripAriaA: 'elemen a dalam urutan memori',
		sharedWith: (pos: string) => `berbagi dengan posisi b ${pos}`,
		copiedTo: (pos: string) => `disalin ke posisi b ${pos}`,
		stripAriaB: 'memori milik b sendiri',
		separateBlock: 'blok terpisah',
		toMoveAlong: 'untuk melangkah sepanjang',
		axisOfB: (ax: number) => `axis ${ax} dari b:`,
		inAMemory: 'dalam memori a.',
		afterWrite: 'Setelah penulisan',
		afterAssign: (code: string) => `setelah ${code}`,
		after: 'setelah',
		elementsChanged: (n: number) => `${n} elemen berubah`,
		unchanged: 'tidak berubah',
		sameMemoryAs: (where: string) => `memori yang sama dengan ${where}`,
		copiedInto: (where: string) => `disalin ke ${where}`,
		isWhere: (where: string) => `adalah ${where}`,
		copiedFrom: (where: string) => `disalin dari ${where}`,
		changedByWrite: 'berubah karena menulis ke b',
		explainSame: (write: boolean) =>
			'`b = a` tidak menyalin **apa pun**: `b` adalah nama kedua untuk array yang sama (`b is a` → True).' +
			(write ? ' Menulis ke `b` berarti menulis ke `a`.' : ''),
		explainView:
			'`b` adalah **view**: objek array baru yang melihat ke dalam memori `a` (`np.shares_memory(a, b)` → True). Tidak ada yang disalin — hanya shape dan strides baru.',
		explainViewWrite: (n: number) => `Menulis ke \`b\` mengubah **${n}** elemen dari \`a\` (digambar putus-putus).`,
		explainViewNoWrite: 'Centang **tulis ke b** untuk melihat artinya bagi `a`.',
		explainScalar: (write: boolean) =>
			'Satu integer per axis menghasilkan satu elemen tunggal: sebuah skalar NumPy, bukan array. Nilainya **disalin keluar**, sehingga tidak terhubung dengan `a`' +
			(write ? ' — dan skalar tidak bisa ditulisi' : '') +
			'.',
		explainCopyIntro: '`b` adalah **copy** dengan memorinya sendiri (`np.shares_memory(a, b)` → False).',
		explainCopyWrite: (write: boolean) => (write ? 'Menulis ke b tidak mengubah a.' : 'Menulis ke b tidak akan mengubah a.'),
		needIndependent: 'Butuh array yang independen?'
	},
	combine: {
		operationAria: 'Operasi',
		opTitles: {
			concatenate: 'Gabungkan sepanjang axis yang sudah ada',
			stack: 'Gabungkan sepanjang axis baru',
			split: 'Potong a menjadi bagian sama besar'
		} as Record<string, string>,
		axisLabel: 'axis',
		lastAxisTitle: 'axis terakhir',
		piecesLabel: 'bagian',
		bInputLabel: 'b — ketik angka (baris baru = baris baru, [[…]] untuk satu baris)',
		presetsAria: 'Contoh shape untuk b',
		presetLabels: {
			'same shape': 'shape sama',
			'one row': 'satu baris',
			'one column': 'satu kolom',
			'1-D': '1-D',
			shorter: 'lebih pendek'
		} as Record<string, string>,
		planAria: 'Shape di setiap axis',
		newMemoryTitle: 'np.concatenate dan np.stack selalu menulis ke memori baru',
		newMemoryTag: 'memori baru (copy)',
		cutAlong: (axis: number) => ` · dipotong sepanjang axis ${axis}`,
		sharesMemoryTitle: (i: number) => `np.shares_memory(parts[${i}], a)`,
		viewOfA: 'view dari a',
		copy: 'copy',
		newBadge: 'baru',
		explainConcatenate: (k: number, a: number, b: number, ndim: number) =>
			`\`np.concatenate\` menggabungkan sepanjang axis yang **sudah ada**: sepanjang axis ${k} ukurannya dijumlahkan (${a} + ${b}); setiap axis lain harus sudah cocok. ndim tetap ${ndim}.`,
		explainConcatenateMuted: 'Arahkan kursor ke sebuah sel hasil untuk melihat asalnya. Hasilnya memori baru: mengubahnya tidak mengubah `a` atau `b`.',
		explainStack: (k: number, ndimA: number, ndimResult: number) =>
			`\`np.stack\` menggabungkan sepanjang axis **baru** ${k}: ndim berubah dari ${ndimA} menjadi ${ndimResult}. Ini sama dengan memberi setiap array axis itu terlebih dulu lalu menggabungkannya:`,
		explainStackExpand: (k: number, expanded: string) => `setiap input menjadi \`${expanded}\`.`,
		explainStackNewaxis: '`np.expand_dims(a, 0)` sama dengan `a[np.newaxis]`.',
		explainSplit: (n: number, axis: number) =>
			`\`np.split\` memotong \`a\` menjadi ${n} bagian sama besar sepanjang axis ${axis} dan mengembalikan sebuah **list**. Bagian-bagiannya adalah **view**: mereka berbagi memori dengan \`a\` (bab 08).`,
		explainSplitMuted: 'Bagian-bagiannya harus sama besar. Untuk bagian yang tidak rata gunakan `np.array_split`.'
	},
	codeResult: {
		stopped: 'Dihentikan.',
		stoppedRest: 'Tekan Jalankan untuk memulai lagi.',
		emptyTitle: 'Tulis kode NumPy (atau pandas) di editor di bawah dan tekan Jalankan',
		emptyOr: 'atau',
		emptyBody:
			'Array dan DataFrame yang kamu buat muncul di sini. Variabel dari alat-alat (`a`, `b`, `result`) hidup dalam sesi Python yang sama, jadi kamu bisa langsung memakainya.',
		variablesAria: 'Array dalam sesi ini',
		variables: 'Variabel',
		lastExpression: 'Ekspresi terakhir',
		type: 'tipe:'
	}
};

export function tViews() {
	return lang.current === 'id' ? id.views : en.views;
}
export function tCombine() {
	return lang.current === 'id' ? id.combine : en.combine;
}
export function tCodeResult() {
	return lang.current === 'id' ? id.codeResult : en.codeResult;
}
