import { alignShapes } from './broadcast';
import { formatShape, reshapeSuggestions } from './normalize';

/** Minimal error shape shared with the runtime protocol. */
export type PythonError = { type: string; message: string; line: number | null };

export type Explanation = {
	title: string;
	details: string[];
	/** Monospace block, e.g. a shape alignment table. */
	diagram?: string;
	hint?: string;
};

export type ErrorLang = 'en' | 'id';

function parseTuple(text: string): number[] {
	return text
		.replace(/[()]/g, '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map(Number);
}

/**
 * Translate a Python/NumPy error into an educational explanation.
 * The original error is always shown alongside; this never replaces it.
 */
export function explainError(err: PythonError, lang: ErrorLang = 'en'): Explanation {
	const id = lang === 'id';
	const { type, message } = err;
	const at = err.line ? (id ? ` (baris ${err.line})` : ` (line ${err.line})`) : '';

	let m = message.match(/operands could not be broadcast together with shapes ((?:\([\d,]*\)\s*)+)/);
	if (m) {
		const shapes = [...m[1].matchAll(/\(([\d,]*)\)/g)].map((x) => parseTuple(x[1]));
		const names = shapes.map((_, i) => String.fromCharCode(65 + i));
		const al = alignShapes(shapes);
		const width = al.columns.length;
		const cell = (v: string) => v.padStart(4);
		const rows = shapes.map(
			(s, i) =>
				`${names[i]} ${formatShape(s).padEnd(12)}` +
				al.columns.map((_, pos) => cell(String(s[s.length - width + pos] ?? ''))).join('')
		);
		const verdict = ' '.repeat(14) + al.columns.map((c) => cell(c.status === 'conflict' ? '✕' : '✓')).join('');
		const bad = al.columns.find((c) => c.status === 'conflict');
		const [A, B] = shapes;
		let hint = id
			? 'Ubah salah satu array agar setiap dimensi yang tidak cocok menjadi 1 atau sama.'
			: 'Change one of the arrays so every mismatched dimension becomes 1 or equal.';
		if (A && B && B.length === 1 && A.length === 2 && B[0] === A[0]) {
			hint = id
				? `B cocok dengan dimensi pertama A. Jadikan ia sebuah kolom: b.reshape(${B[0]}, 1) atau b[:, np.newaxis] (shape (${B[0]}, 1)).`
				: `B matches A's first dimension. Make it a column: b.reshape(${B[0]}, 1) or b[:, np.newaxis] (shape (${B[0]}, 1)).`;
		} else if (A && B && B.length === 1 && A.length >= 1) {
			hint = id
				? `Coba beri B shape ${formatShape([A[A.length - 1]])} agar cocok dengan dimensi terakhir A.`
				: `Try giving B shape ${formatShape([A[A.length - 1]])} so it matches A's last dimension.`;
		}
		return {
			title: id ? 'Array-array ini tidak bisa di-broadcast bersama.' : 'These arrays cannot be broadcast together.',
			details: [
				id
					? 'NumPy membandingkan shape dari kanan. Setiap pasangan dimensi harus sama, atau salah satunya harus 1.'
					: 'NumPy compares shapes from the right. Each pair of dimensions must be equal, or one of them must be 1.',
				bad
					? id
						? `${bad.dims.filter((d) => d !== null).join(' vs ')}: ukuran berbeda dan tidak satu pun bernilai 1.`
						: `${bad.dims.filter((d) => d !== null).join(' vs ')}: different sizes and neither is 1.`
					: ''
			].filter(Boolean),
			diagram: [...rows, verdict].join('\n'),
			hint
		};
	}

	m = message.match(/cannot reshape array of size (\d+) into shape (\([^)]*\))/);
	if (m) {
		const size = Number(m[1]);
		const target = parseTuple(m[2]);
		const known = target.filter((d) => d !== -1).reduce((a, b) => a * b, 1);
		return {
			title: id ? `${size} elemen tidak bisa disusun sebagai ${m[2]}.` : `${size} elements cannot be arranged as ${m[2]}.`,
			details: [
				id
					? 'reshape tidak pernah menambah atau menghapus elemen: hasil kali shape baru harus sama dengan size-nya.'
					: 'reshape never adds or drops elements: the product of the new shape must equal the size.',
				target.includes(-1)
					? id
						? `Dengan -1, NumPy menyimpulkan dimensi itu sebagai ${size} ÷ ${known}, yang bukan bilangan bulat.`
						: `With -1, NumPy infers that dimension as ${size} ÷ ${known}, which is not a whole number.`
					: id
						? `${target.join(' × ')} = ${known}, tapi array-nya memiliki ${size} elemen.`
						: `${target.join(' × ')} = ${known}, but the array has ${size} elements.`
			],
			hint: id
				? `Shape yang cocok untuk ${size} elemen antara lain ${reshapeSuggestions(size).join(', ')}.`
				: `Shapes that work for ${size} elements include ${reshapeSuggestions(size).join(', ')}.`
		};
	}

	if (/inhomogeneous shape/.test(message)) {
		return {
			title: id ? 'Baris-barisnya memiliki panjang yang berbeda.' : 'The rows have different lengths.',
			details: [
				id
					? 'Sebuah ndarray berbentuk persegi panjang: setiap baris membutuhkan jumlah nilai yang sama (dan setiap lapisan jumlah baris yang sama).'
					: 'An ndarray is rectangular: every row needs the same number of values (and every layer the same number of rows).',
				message.match(/detected shape was ([^.]*)/)?.[0] ?? ''
			].filter(Boolean),
			hint: id ? 'Tambahkan atau hapus nilai agar semua baris cocok.' : 'Add or remove values so all rows match.'
		};
	}

	m = message.match(/index (-?\d+) is out of bounds for axis (\d+) with size (\d+)/);
	if (m) {
		const n = Number(m[3]);
		return {
			title: id ? `Indeks ${m[1]} tidak ada sepanjang axis ${m[2]}.` : `Index ${m[1]} does not exist along axis ${m[2]}.`,
			details: [
				id
					? `Axis ${m[2]} memiliki panjang ${n}, sehingga posisi yang valid adalah 0 sampai ${n - 1} (atau -${n} sampai -1 dihitung dari akhir).`
					: `Axis ${m[2]} has length ${n}, so valid positions are 0 to ${n - 1} (or -${n} to -1 counting from the end).`,
				id ? 'Indexing dimulai dari 0, bukan 1.' : 'Indexing starts at 0, not 1.'
			],
			hint: id ? `Coba indeks antara 0 dan ${n - 1}.` : `Try an index between 0 and ${n - 1}.`
		};
	}

	m = message.match(/too many indices for array: array is (\d+)-dimensional, but (\d+) were indexed/);
	if (m) {
		return {
			title: id
				? `Terlalu banyak indeks: array memiliki ${m[1]} axis, kamu memberi ${m[2]}.`
				: `Too many indices: the array has ${m[1]} ${Number(m[1]) === 1 ? 'axis' : 'axes'}, you gave ${m[2]}.`,
			details: [
				id
					? 'Setiap indeks yang dipisahkan koma memilih sepanjang satu axis, jadi kamu bisa memberi paling banyak sejumlah ndim.'
					: 'Each comma-separated index selects along one axis, so you can give at most ndim of them.'
			]
		};
	}

	m = message.match(/axis (-?\d+) is out of bounds for array of dimension (\d+)/);
	if (m) {
		const nd = Number(m[2]);
		return {
			title: id ? `Axis ${m[1]} tidak ada untuk array ${nd}-D.` : `Axis ${m[1]} does not exist for a ${nd}-D array.`,
			details: [
				nd === 0
					? id
						? 'Array 0-d sama sekali tidak memiliki axis.'
						: 'A 0-d array has no axes at all.'
					: id
						? `Array ${nd}-D memiliki axis 0 sampai ${nd - 1} (atau -${nd} sampai -1 dihitung dari akhir).`
						: `A ${nd}-D array has axes 0 to ${nd - 1} (or -${nd} to -1 counting from the end).`
			]
		};
	}

	m = message.match(
		/boolean index did not match indexed array along (?:axis|dimension) (\d+); size of (?:axis|dimension) is (\d+) but size of corresponding boolean (?:axis|dimension) is (\d+)/
	);
	if (m) {
		return {
			title: id ? 'Boolean mask memiliki shape yang salah.' : 'The boolean mask has the wrong shape.',
			details: [
				id
					? `Sepanjang axis ${m[1]} array memiliki ${m[2]} elemen tapi mask-nya memiliki ${m[3]}.`
					: `Along axis ${m[1]} the array has ${m[2]} elements but the mask has ${m[3]}.`,
				id
					? 'Sebuah mask membutuhkan satu True/False untuk setiap elemen yang dipilihnya — biasanya shape yang sama dengan array-nya, mis. a > 2.'
					: 'A mask needs one True/False per element it selects from — usually the same shape as the array, e.g. a > 2.'
			]
		};
	}

	m = message.match(/Python integer (-?\d+) out of bounds for (\w+)/);
	if (m) {
		return {
			title: id ? `${m[1]} tidak muat dalam ${m[2]}.` : `${m[1]} does not fit in ${m[2]}.`,
			details: [
				id
					? `Setiap dtype memiliki rentang yang tetap. np.iinfo(np.${m[2]}) menunjukkan nilai terkecil dan terbesar yang bisa disimpan ${m[2]}.`
					: `Every dtype has a fixed range. np.iinfo(np.${m[2]}) shows the smallest and largest values ${m[2]} can store.`
			],
			hint: id
				? 'Pilih dtype yang lebih lebar (mis. int32 atau int64) atau dtype float.'
				: 'Choose a wider dtype (e.g. int32 or int64) or a float dtype.'
		};
	}

	m = message.match(/Cannot cast ufunc '(\w+)' output from dtype\('(\w+)'\) to dtype\('(\w+)'\)/);
	if (m) {
		return {
			title: id
				? `Hasil ${m[2]} tidak bisa disimpan kembali ke array ${m[3]}.`
				: `The ${m[2]} result cannot be stored back into a ${m[3]} array.`,
			details: [
				id
					? `Operasi in-place (seperti +=) menulis ke array yang sudah ada, yang tetap mempertahankan dtype ${m[3]}. NumPy menolak untuk diam-diam membuang informasi.`
					: `In-place operations (like +=) write into the existing array, which keeps its dtype ${m[3]}. NumPy refuses to silently drop information.`
			],
			hint: id
				? `Gunakan a = a ${m[1] === 'add' ? '+' : '…'} … (membuat array baru) atau konversi dulu dengan a.astype(np.${m[2]}).`
				: `Use a = a ${m[1] === 'add' ? '+' : '…'} … (creates a new array) or convert first with a.astype(np.${m[2]}).`
		};
	}

	// ---- combining arrays ----
	m = message.match(
		/must have same number of dimensions, but the array at index (\d+) has (\d+) dimension\(s\) and the array at index (\d+) has (\d+) dimension\(s\)/
	);
	if (m) {
		return {
			title: id
				? `Array ${m[2]}-D dan ${m[4]}-D tidak bisa digabungkan (concatenate).`
				: `A ${m[2]}-D and a ${m[4]}-D array cannot be concatenated.`,
			details: [
				id
					? 'np.concatenate menggabungkan sepanjang axis yang sudah dimiliki kedua array, jadi mereka membutuhkan jumlah axis yang sama.'
					: 'np.concatenate joins along an axis both arrays already have, so they need the same number of axes.',
				id
					? `Array ${m[1]} memiliki ${m[2]} axis, array ${m[3]} memiliki ${m[4]}.`
					: `Array ${m[1]} has ${m[2]} axes, array ${m[3]} has ${m[4]}.`
			],
			hint: id
				? 'Beri array yang lebih kecil axis yang hilang: b[np.newaxis] membuat baris 1-D menjadi 2-D (shape (1, n)); b[:, np.newaxis] membuatnya menjadi kolom (n, 1).'
				: 'Give the smaller one the missing axis: b[np.newaxis] makes a 1-D row 2-D (shape (1, n)); b[:, np.newaxis] makes it a column (n, 1).'
		};
	}

	m = message.match(
		/all the input array dimensions except for the concatenation axis must match exactly, but along dimension (\d+), the array at index (\d+) has size (\d+) and the array at index (\d+) has size (\d+)/
	);
	if (m) {
		return {
			title: id ? `Array-array tidak cocok sepanjang axis ${m[1]}.` : `The arrays do not fit together along axis ${m[1]}.`,
			details: [
				id
					? 'Hanya axis yang kamu gabungkan yang boleh memiliki ukuran berbeda; setiap axis lain harus cocok persis.'
					: 'Only the axis you concatenate along may have different sizes; every other axis must match exactly.',
				id ? `Sepanjang axis ${m[1]}: ${m[3]} vs ${m[5]}.` : `Along axis ${m[1]}: ${m[3]} vs ${m[5]}.`
			],
			hint: id
				? `Gabungkan sepanjang axis ${m[1]} sebagai gantinya, atau ubah shape salah satu array.`
				: `Concatenate along axis ${m[1]} instead, or change the shape of one array.`
		};
	}

	if (/all input arrays must have the same shape/.test(message)) {
		return {
			title: id ? 'np.stack membutuhkan array dengan shape yang persis sama.' : 'np.stack needs arrays of exactly the same shape.',
			details: [
				id
					? 'stack menaruh array-array berdampingan sepanjang axis baru: masing-masing menjadi satu irisan, sehingga semua irisan harus memiliki shape yang sama.'
					: 'stack puts the arrays side by side along a new axis: each one becomes one slice, so all slices must have the same shape.'
			],
			hint: id
				? 'Untuk menggabungkan array yang ukurannya berbeda sepanjang satu axis, gunakan np.concatenate sepanjang axis itu.'
				: 'To join arrays whose sizes differ along one axis, use np.concatenate along that axis.'
		};
	}

	if (/array split does not result in an equal division/.test(message)) {
		return {
			title: id ? 'np.split tidak bisa memotong axis ini menjadi bagian yang sama besar.' : 'np.split cannot cut this axis into equal pieces.',
			details: [
				id
					? 'np.split(a, n, axis=k) membutuhkan panjang axis k yang habis dibagi n.'
					: 'np.split(a, n, axis=k) needs the length of axis k to be divisible by n.'
			],
			hint: id
				? 'Pilih angka yang habis membagi panjang axis-nya, atau gunakan np.array_split, yang memperbolehkan bagian dengan ukuran berbeda.'
				: 'Choose a number that divides the axis length, or use np.array_split, which allows pieces of different sizes.'
		};
	}

	m = message.match(/'(numpy\.\w+)' object does not support item assignment/);
	if (m) {
		return {
			title: id ? `Satu elemen tunggal (${m[1]}) tidak bisa ditulisi.` : `A single element (${m[1]}) cannot be written into.`,
			details: [
				id
					? 'Sebuah integer untuk setiap axis menghasilkan skalar NumPy: nilainya disalin keluar dari array. Ini bukan view, sehingga tidak ada apa pun untuk ditulis kembali.'
					: 'An integer for every axis gives a NumPy scalar: its value is copied out of the array. It is not a view, so there is nothing to write back into.'
			],
			hint: id
				? 'Untuk mengubah elemen di dalam array itu sendiri, assign lewat array-nya: a[0, 1] = 99.'
				: 'To change the element in the array itself, assign through the array: a[0, 1] = 99.'
		};
	}

	// ---- pandas ----
	m = message.match(/Shape of passed values is \((\d+), (\d+)\), indices imply \((\d+), (\d+)\)/);
	if (m) {
		return {
			title: id ? 'Jumlah label tidak cocok dengan array-nya.' : 'The number of labels does not match the array.',
			details: [
				id
					? `Array memiliki ${m[1]} baris dan ${m[2]} kolom, tapi label-labelnya menjelaskan ${m[3]} baris dan ${m[4]} kolom.`
					: `The array has ${m[1]} rows and ${m[2]} columns, but the labels describe ${m[3]} rows and ${m[4]} columns.`,
				id
					? 'DataFrame membutuhkan tepat satu label baris per baris dan satu label kolom per kolom.'
					: 'A DataFrame needs exactly one row label per row and one column label per column.'
			],
			hint: id
				? 'Tambahkan atau hapus label — atau biarkan kosong untuk mendapatkan posisi bawaan 0, 1, 2 …'
				: 'Add or remove labels — or leave them empty to get the default positions 0, 1, 2 …'
		};
	}

	m = message.match(/Must pass 2-d input\. shape=(\([^)]*\))/);
	if (m) {
		return {
			title: id
				? `DataFrame tidak bisa menampung array ${parseTuple(m[1]).length}-D.`
				: `A DataFrame cannot hold a ${parseTuple(m[1]).length}-D array.`,
			details: [
				id
					? `Array memiliki shape ${m[1]}. DataFrame adalah tabel 2-D: berikan array 1-D (satu kolom) atau array 2-D.`
					: `The array has shape ${m[1]}. A DataFrame is a 2-D table: pass a 1-D array (one column) or a 2-D array.`
			],
			hint: id ? 'Ubah shape array menjadi 2-D dulu, mis. a.reshape(-1, a.shape[-1]).' : 'Reshape the array to 2-D first, e.g. a.reshape(-1, a.shape[-1]).'
		};
	}

	if (type === 'KeyError') {
		return {
			title: id ? `Tidak ada key atau label ${message}${at}.` : `There is no key or label ${message}${at}.`,
			details: [
				id
					? "Sebuah dict memunculkan KeyError untuk key yang tidak ada. pandas memunculkannya saat .loc[…] atau df[…] tidak menemukan sebuah label: label harus cocok persis (label teks bersifat case-sensitive, dan 0 tidak sama dengan '0')."
					: "A dict raises KeyError for a missing key. pandas raises it when .loc[…] or df[…] cannot find a label: the label must exist exactly (text labels are case-sensitive, and 0 is not the same as '0').",
				id
					? 'Untuk memilih baris atau kolom berdasarkan posisi (0, 1, 2 …) gunakan .iloc[…] sebagai gantinya.'
					: 'To select rows or columns by position (0, 1, 2 …) use .iloc[…] instead.'
			]
		};
	}

	if (/single positional indexer is out-of-bounds/.test(message)) {
		return {
			title: id ? 'Posisi itu tidak ada.' : 'That position does not exist.',
			details: [
				id
					? '.iloc menghitung posisi dari 0, jadi baris terakhir ada pada posisi (jumlah baris − 1).'
					: '.iloc counts positions from 0, so the last row is at position (number of rows − 1).'
			]
		};
	}

	if (/iLocation based boolean indexing cannot use an indexable as a mask/.test(message)) {
		return {
			title: id ? '.iloc tidak menerima Series boolean.' : '.iloc does not take a boolean Series.',
			details: [
				id ? '.iloc hanya bekerja dengan posisi, sedangkan Series membawa label.' : '.iloc works with positions only, and a Series carries labels.',
				id
					? "Gunakan .loc dengan mask-nya (df.loc[df['A'] > 2]), atau ubah menjadi array biasa: df.iloc[(df['A'] > 2).to_numpy()]."
					: "Use .loc with the mask (df.loc[df['A'] > 2]), or turn it into a plain array: df.iloc[(df['A'] > 2).to_numpy()]."
			]
		};
	}

	if (type === 'ModuleNotFoundError' && /torch/.test(message)) {
		return {
			title: id ? 'PyTorch tidak tersedia di runtime browser ini.' : 'PyTorch is not available in this browser runtime.',
			details: [
				id
					? 'ArrayLab menjalankan Python sungguhan di browsermu dengan Pyodide, yang menyediakan NumPy tapi bukan PyTorch.'
					: 'ArrayLab runs real Python in your browser with Pyodide, which ships NumPy but not PyTorch.',
				id
					? 'Daripada mensimulasikan PyTorch, ArrayLab hanya mengajarkannya begitu build yang kompatibel dengan browser sungguhan tersedia.'
					: 'Rather than simulating PyTorch, ArrayLab only teaches it once a real browser-compatible build is available.'
			]
		};
	}

	if (type === 'ModuleNotFoundError') {
		return {
			title: id ? 'Modul itu tidak tersedia di sini.' : 'That module is not available here.',
			details: [
				id
					? 'Lab ini menjalankan Python dengan NumPy dan pandas (plus paket lain yang disediakan Pyodide). Modul ini tidak tersedia.'
					: 'This lab runs Python with NumPy and pandas (plus the other packages Pyodide ships). This one is not available.'
			]
		};
	}

	if (type === 'SyntaxError' || type === 'IndentationError') {
		return {
			title: id ? `Python tidak bisa membaca kodenya${at}.` : `Python could not read the code${at}.`,
			details: [
				id ? 'Ini adalah masalah sintaks — kodenya tidak pernah dijalankan.' : 'This is a syntax problem — the code never ran.',
				id
					? 'Cari koma, kurung, atau titik dua yang hilang, atau indentasi yang tidak konsisten.'
					: 'Look for a missing comma, bracket, parenthesis or colon, or inconsistent indentation.'
			]
		};
	}

	m = message.match(/name '(\w+)' is not defined/);
	if (m) {
		return {
			title: id ? `“${m[1]}” belum didefinisikan${at}.` : `“${m[1]}” has not been defined${at}.`,
			details: [
				m[1] === 'torch'
					? id
						? 'PyTorch tidak tersedia di runtime browser ini.'
						: 'PyTorch is not available in this browser runtime.'
					: id
						? `Buat ${m[1]} terlebih dulu (mis. ${m[1]} = np.array([1, 2, 3])), atau periksa ejaannya. Nama bersifat case-sensitive.`
						: `Create ${m[1]} first (e.g. ${m[1]} = np.array([1, 2, 3])), or check the spelling. Names are case-sensitive.`
			]
		};
	}

	if (type === 'ZeroDivisionError') {
		return {
			title: id ? 'Pembagian dengan nol menggunakan angka Python biasa.' : 'Division by zero with plain Python numbers.',
			details: [
				id
					? 'int/float Python memunculkan error. Array NumPy justru menghasilkan inf atau nan disertai peringatan.'
					: 'Python ints/floats raise an error. NumPy arrays instead produce inf or nan with a warning.'
			]
		};
	}

	return {
		title: id ? `Python memunculkan ${type}${at}.` : `Python raised ${/^[AEIOU]/.test(type) ? 'an' : 'a'} ${type}${at}.`,
		details: [
			id
				? 'Baca pesan aslinya di bawah; baris terakhir biasanya menyebutkan apa yang salah.'
				: 'Read the original message below; the last line usually says what went wrong.'
		]
	};
}
