import { lang } from '../lang.svelte';

const en = {
	broadcast: {
		operation: 'Operation',
		operator: 'Operator',
		bLabel: 'b — type numbers (new line = new row)',
		exampleShapes: 'Example shapes for b',
		presetScalar: 'scalar',
		presetRow: 'row',
		presetColumn: 'column',
		presetMismatch: 'mismatch',
		stretchedTo: (shape: string) => ` → stretched to ${shape}`,
		hoverHint: 'Hover any element to see which values were combined.',
		stretchedCopyOf: (from: string) => `stretched copy of ${from} (not stored in memory)`,
		p1: 'NumPy lines the shapes up **from the right**. In each column the sizes must be equal, or one of them must be 1 (a missing dimension counts as 1). Size-1 dimensions are **stretched** to match.',
		p2: 'Dashed cells are stretched copies — a **conceptual** picture. NumPy does not copy anything: it reuses the same values by stepping through memory with stride 0.',
		p3: (resultDtype: string, aDtype: string, bDtype: string, suffix: string) =>
			`Result dtype \`${resultDtype}\` comes from combining \`${aDtype}\` and \`${bDtype}\`${suffix}.`,
		divisionSuffix: ' — true division always gives floats',
		comparisonSuffix: ' — comparisons give booleans'
	},
	vectorize: {
		operationOnX: 'Operation on each element x',
		animate: 'Animate loop vs vectorized',
		stop: 'Stop',
		pythonLoop: 'Python loop',
		oneAtATime: '— one element at a time',
		moreIterations: (n: number) => `… ${n} more iterations`,
		loopNote: (n: number) => `${n} separate Python operations, each on one number.`,
		vectorized: 'Vectorized',
		wholeArrayAtOnce: '— the whole array at once',
		waitingForLoop: 'waiting for the loop…',
		vectorizedNote: 'One NumPy call; the loop over elements happens inside compiled code.',
		measuring: 'Measuring…',
		measureSpeed: (n: string) => `Measure speed on ${n} elements`,
		barsAriaLabel: (loopMs: string, vecMs: string) => `Loop ${loopMs} ms, vectorized ${vecMs} ms`,
		loop: 'loop',
		vector: 'vectorized',
		fasterNote: (ratio: string) =>
			`≈ ${ratio}× faster here. Measured live in your browser (Python compiled to WebAssembly); exact numbers differ on a desktop Python, the gap is typically similar or larger.`,
		explainP1: (shape: string, n: number, code: string, ufunc: string) =>
			`Both versions compute the same values of shape \`${shape}\`. The loop runs Python code ${n} times; \`${code}\` hands the whole array to a NumPy **ufunc** (\`${ufunc}\`) that loops in compiled code.`,
		explainP2:
			'The animation is a conceptual model: NumPy does not literally process elements in this visual sequence (it may use SIMD instructions and other optimizations), but the result is the same.'
	},
	dtype: {
		convertWith: 'Convert with `a.astype(…)`',
		canStore: (min: string, max: string) => `It can store values from \`${min}\` to \`${max}\`.`,
		sameShape: (n: number, aItemsize: number, resultItemsize: number, aNbytes: number, resultNbytes: number) =>
			`Same shape, same number of elements (${n}); only the bytes per element change: \`${aItemsize}\` → \`${resultItemsize}\`, so \`nbytes\` goes from ${aNbytes} to ${resultNbytes}. \`astype\` returns a new array (a copy).`,
		valuesChanged: (n: number) => `**${n}** value${n === 1 ? '' : 's'} changed (dashed, marked ≠):`,
		noValueChanged: (dtype: string) => `No value changed — every element is exactly representable in \`${dtype}\`.`,
		floatToInt: 'Float → integer **truncates toward zero** (2.7 → 2, −1.5 → −1). nan and inf have no integer value.',
		wrapAround: 'Integers that do not fit **wrap around** (e.g. 300 in uint8 becomes 44 = 300 − 256). No error is raised by astype.',
		toBool: 'To bool: `0` becomes False, **any other value** becomes True.',
		fromBool: 'From bool: True → 1, False → 0.',
		intToFloat: 'Integer → float is exact for small values; very large integers can lose precision (float32 has ~7 significant digits, float64 ~16).',
		rounded: 'Fewer bits → values are **rounded** to the nearest representable number.',
		complexImaginary: 'Complex numbers get an imaginary part of 0.',
		int32Note:
			'Why is `a` int32? NumPy here runs on 32-bit WebAssembly, where the default integer is int32. On a typical 64-bit desktop, NumPy 2 creates int64 for the same code.',
		valueChangedTitle: 'value changed by the conversion'
	}
};

const id = {
	broadcast: {
		operation: 'Operasi',
		operator: 'Operator',
		bLabel: 'b — ketik angka (baris baru = baris baru)',
		exampleShapes: 'Contoh shape untuk b',
		presetScalar: 'skalar',
		presetRow: 'baris',
		presetColumn: 'kolom',
		presetMismatch: 'tidak cocok',
		stretchedTo: (shape: string) => ` → diregangkan menjadi ${shape}`,
		hoverHint: 'Arahkan kursor ke elemen mana pun untuk melihat nilai mana yang digabungkan.',
		stretchedCopyOf: (from: string) => `salinan hasil regangan dari ${from} (tidak disimpan di memori)`,
		p1: 'NumPy menyelaraskan shape-shape itu **dari kanan**. Di setiap kolom, ukurannya harus sama, atau salah satunya harus 1 (dimensi yang hilang dihitung sebagai 1). Dimensi berukuran 1 **diregangkan** agar cocok.',
		p2: 'Sel putus-putus adalah salinan hasil regangan — sebuah gambaran **konseptual**. NumPy tidak menyalin apa pun: ia membaca ulang nilai yang sama dengan melangkah lewat memori dengan stride 0.',
		p3: (resultDtype: string, aDtype: string, bDtype: string, suffix: string) =>
			`dtype hasil \`${resultDtype}\` berasal dari menggabungkan \`${aDtype}\` dan \`${bDtype}\`${suffix}.`,
		divisionSuffix: ' — pembagian sungguhan selalu menghasilkan float',
		comparisonSuffix: ' — perbandingan menghasilkan boolean'
	},
	vectorize: {
		operationOnX: 'Operasi pada setiap elemen x',
		animate: 'Animasikan loop vs vektorisasi',
		stop: 'Berhenti',
		pythonLoop: 'Loop Python',
		oneAtATime: '— satu elemen pada satu waktu',
		moreIterations: (n: number) => `… ${n} iterasi lagi`,
		loopNote: (n: number) => `${n} operasi Python terpisah, masing-masing pada satu angka.`,
		vectorized: 'Vektorisasi',
		wholeArrayAtOnce: '— seluruh array sekaligus',
		waitingForLoop: 'menunggu loop…',
		vectorizedNote: 'Satu pemanggilan NumPy; loop atas elemen-elemen terjadi di dalam kode yang sudah dikompilasi.',
		measuring: 'Mengukur…',
		measureSpeed: (n: string) => `Ukur kecepatan pada ${n} elemen`,
		barsAriaLabel: (loopMs: string, vecMs: string) => `Loop ${loopMs} ms, vektorisasi ${vecMs} ms`,
		loop: 'loop',
		vector: 'vektorisasi',
		fasterNote: (ratio: string) =>
			`≈ ${ratio}× lebih cepat di sini. Diukur langsung di browsermu (Python dikompilasi ke WebAssembly); angka pastinya berbeda di Python desktop, tapi selisihnya biasanya serupa atau lebih besar.`,
		explainP1: (shape: string, n: number, code: string, ufunc: string) =>
			`Kedua versi menghitung nilai yang sama dengan shape \`${shape}\`. Loop menjalankan kode Python ${n} kali; \`${code}\` menyerahkan seluruh array ke sebuah **ufunc** NumPy (\`${ufunc}\`) yang melakukan loop di dalam kode yang sudah dikompilasi.`,
		explainP2:
			'Animasi ini adalah model konseptual: NumPy tidak benar-benar memproses elemen dalam urutan visual ini (ia bisa menggunakan instruksi SIMD dan optimisasi lain), tapi hasilnya tetap sama.'
	},
	dtype: {
		convertWith: 'Konversi dengan `a.astype(…)`',
		canStore: (min: string, max: string) => `Dapat menyimpan nilai dari \`${min}\` sampai \`${max}\`.`,
		sameShape: (n: number, aItemsize: number, resultItemsize: number, aNbytes: number, resultNbytes: number) =>
			`Shape sama, jumlah elemen sama (${n}); hanya byte per elemen yang berubah: \`${aItemsize}\` → \`${resultItemsize}\`, sehingga \`nbytes\` berubah dari ${aNbytes} menjadi ${resultNbytes}. \`astype\` mengembalikan array baru (sebuah copy).`,
		valuesChanged: (n: number) => `**${n}** nilai berubah (putus-putus, ditandai ≠):`,
		noValueChanged: (dtype: string) => `Tidak ada nilai yang berubah — setiap elemen dapat direpresentasikan persis dalam \`${dtype}\`.`,
		floatToInt: 'Float → integer **memotong ke arah nol** (2.7 → 2, −1.5 → −1). nan dan inf tidak memiliki nilai integer.',
		wrapAround: 'Integer yang tidak muat akan **wrap around** (mis. 300 dalam uint8 menjadi 44 = 300 − 256). astype tidak memunculkan error.',
		toBool: 'Ke bool: `0` menjadi False, **nilai lainnya** menjadi True.',
		fromBool: 'Dari bool: True → 1, False → 0.',
		intToFloat: 'Integer → float bersifat presisi untuk nilai kecil; integer yang sangat besar bisa kehilangan presisi (float32 punya ~7 digit signifikan, float64 ~16).',
		rounded: 'Bit lebih sedikit → nilai **dibulatkan** ke nilai representable terdekat.',
		complexImaginary: 'Bilangan kompleks mendapat bagian imajiner 0.',
		int32Note:
			'Mengapa `a` bertipe int32? NumPy di sini berjalan di atas WebAssembly 32-bit, di mana integer bawaannya adalah int32. Pada desktop 64-bit yang umum, NumPy 2 membuat int64 untuk kode yang sama.',
		valueChangedTitle: 'nilai berubah karena konversi'
	}
};

export function tBroadcast() {
	return lang.current === 'id' ? id.broadcast : en.broadcast;
}
export function tVectorize() {
	return lang.current === 'id' ? id.vectorize : en.vectorize;
}
export function tDtype() {
	return lang.current === 'id' ? id.dtype : en.dtype;
}

/** Bilingual version of array/inspect.ts's describeDtype (kept local to avoid touching a shared file). */
export function describeDtypeLocalized(dtype: string): string {
	const idLang = lang.current === 'id';
	if (dtype === 'bool') return idLang ? 'nilai True/False' : 'True/False values';
	const m = dtype.match(/^(u?int|float|complex)(\d+)$/);
	if (!m) return dtype;
	const bits = Number(m[2]);
	const kind = idLang
		? m[1] === 'uint'
			? 'integer tak bertanda'
			: m[1] === 'int'
				? 'integer bertanda'
				: m[1] === 'float'
					? 'bilangan titik-mengambang'
					: 'bilangan kompleks'
		: m[1] === 'uint'
			? 'unsigned integer'
			: m[1] === 'int'
				? 'signed integer'
				: m[1] === 'float'
					? 'floating-point number'
					: 'complex number';
	const byteWord = idLang ? 'byte' : `byte${bits === 8 ? '' : 's'}`;
	return idLang ? `${kind} ${bits}-bit (${bits / 8} ${byteWord} masing-masing)` : `${bits}-bit ${kind} (${bits / 8} ${byteWord} each)`;
}
