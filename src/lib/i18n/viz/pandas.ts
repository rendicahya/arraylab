import { lang } from '../lang.svelte';

/**
 * Text for the pandas tool views (src/lib/visualization/pandas/*.svelte).
 * Own dictionary, separate from src/lib/i18n/strings.ts, so this file can be
 * edited independently. Technical terms (DataFrame, Series, loc/iloc, dtype,
 * label, NaN, RangeIndex) stay in English, matching src/lib/lessons/id.ts.
 */
const dict = {
	en: {
		pandasView: {
			viewFrame: 'DataFrame',
			viewDtypes: 'dtype per column',
			viewAxis: 'axis',
			viewSelect: 'loc / iloc',
			viewAlign: 'Alignment',
			ariaLabel: 'pandas view',
			cachedTitle: 'pandas is downloaded the first time this tool runs (≈ 5 MB), then cached.',
			realPandas: (version: string) => `real pandas ${version} · runs here`
		},
		frameBasics: {
			labelsAria: 'Labels',
			indexLabel: 'index · row labels',
			columnsLabel: 'columns · column labels',
			placeholder: 'empty → 0, 1, 2 …',
			hint: "Words become text labels ('r0'), whole numbers become number labels (10).",
			addsLabels: 'adds labels',
			dropsThem: 'drops them',
			p1: (shape: string) =>
				`A DataFrame is a 2-D array of values with labels on both axes: df.index names the rows and df.columns names the columns (the shaded boxes). The labels are not values — df.to_numpy() returns only the ${shape} array.`,
			p2d1: (n: number) => `A 1-D array of ${n} values becomes ${n} rows × 1 column. A DataFrame is always 2-D.`,
			p2dn: (shape: string) => `Same shape as a: ${shape}. Axis 0 of a is now labeled by the index, axis 1 by the columns.`,
			p3range:
				'Without row labels pandas numbers the rows 0, 1, 2 … (a RangeIndex). Then labels and positions are the same numbers — until you sort or filter the rows. Step 4 (loc / iloc) shows why that matters.',
			p3labeled: 'The small grey numbers are positions. Every row and column has both a label and a position.',
			sharesMemory: 'values shares memory with a.',
			copied:
				'pandas 3 copied a: np.shares_memory(values, a) is False, so changing a later does not change df.',
			hoverHint: 'Hover a value: it is the same element in all three.'
		},
		pandasDtypes: {
			putNoneIn: (row: number) => `Put None in row ${row} of`,
			nothing: 'nothing',
			frameCaption: (shape: string) => `DataFrame ${shape} · a dtype per column`,
			noneTypedHere: 'None was typed here',
			wasWithoutMissing: (dtype: string) => `was ${dtype} without the missing value`,
			p1: (list: string) =>
				`An ndarray has one dtype. A DataFrame has one dtype per column (${list}): each column is stored as its own 1-D array. Text columns have the dtype str in pandas 3 (older pandas showed object).`,
			p2: (allDtype: string, numDtype: string) =>
				`df.to_numpy() has to put everything in one array, so it falls back to ${allDtype} — Python objects, slow and without vectorized math. Select the numeric columns first and you get a real ${numDtype} array (int64 and float64 meet at float64).`,
			missingIn: (col: string) => `Missing value in ${col}:`,
			staysSame: (dtype: string, shown: string) => `the dtype stays ${dtype}; the missing value is shown as ${shown}.`,
			changed: (before: string, after: string) => `${before} → ${after}.`,
			intToFloat:
				'Integers have no “missing” value, so pandas stores the column as floats and uses NaN (a float) for the gap.',
			boolToObject: 'A bool column cannot hold None, so pandas falls back to object: a column of Python objects.',
			prompt: 'Put a missing value into a column and watch its dtype.'
		},
		pandasAxis: {
			function: 'Function',
			settingsAria: 'Reduction settings',
			hoverPrompt: 'Hover a value to see which values were combined.',
			nanSkipped: (n: number) => `(${n} NaN skipped)`,
			feedsResult: (label: string) => `feeds result[${label}]`,
			p1rows: (axis: number) =>
				`axis=${axis} works exactly like NumPy's: it collapses axis ${axis}, so the rows are combined and you get one value per column.`,
			p1cols: (axis: number) =>
				`axis=${axis} works exactly like NumPy's: it collapses axis ${axis}, so the columns are combined and you get one value per row.`,
			p1axisName: (name: string) => `pandas also accepts the axis by name: axis='${name}'.`,
			columnWord: 'column',
			rowWord: 'row',
			p2: (labelKind: string, list: string) =>
				`The difference: the result is a Series labeled by the ${labelKind} labels (${list}). NumPy would return a bare array and you would have to remember which number belongs to which ${labelKind}.`,
			nanSkippedNote: 'NaN is skipped. pandas reductions ignore missing values by default (skipna=True).',
			numpyDoesNot: (fn: string, axis: number, values: string) =>
				`NumPy does not: np.${fn}(df.to_numpy(), axis=${axis}) gives [${values}].`,
			meanIsFloat: 'The mean is a float even for integer columns, like in NumPy.'
		},
		pandasSelect: {
			accessorColHelp: 'Columns by label (or rows by a mask / slice)',
			accessorLocHelp: 'Rows, columns by label',
			accessorIlocHelp: 'Rows, columns by position',
			selectWith: 'Select with',
			selectionAria: (accessor: string) => `Selection inside ${accessor}[ ]`,
			apply: 'Apply',
			examplesAria: 'Example selections',
			clickToSelect: 'click a value to select it',
			selected: 'selected',
			scalar: 'a single value (scalar)',
			scalarShort: 'scalar',
			series: 'a Series',
			dataFrame: 'a DataFrame',
			locSelectsByLabel: '.loc selects by label: the names in the shaded boxes. Rows first, then columns.',
			labelSliceIncludes: (a: string, b: string) =>
				`A label slice includes its end: ${a}:${b} contains both rows. There is no “one past the end” label to stop at.`,
			ilocSelectsByPosition:
				'.iloc selects by position (the small grey numbers), exactly like NumPy indexing: df.iloc[i, j] ↔ df.to_numpy()[i, j].',
			positionSliceExcludes: 'A position slice excludes its end, like Python and NumPy: 0:1 is only position 0.',
			plainDfSelectsColumns:
				"Plain df[…] selects columns by label — unlike NumPy, where a[0] is the first row. A boolean mask (df[df['A'] > 2]) or a slice (df[0:1]) selects rows instead.",
			selectedCount: (n: number, total: number, kind: string, extra: string) => `Selected ${n} of ${total} values → ${kind}${extra}.`,
			oneAxisFixed: 'One axis was fixed by a single label or position, so one set of labels remains.',
			oneLabelPerAxis: 'One label (or position) per axis picks one value.',
			intLabelsWarn: (label: string) =>
				`The row labels are numbers. df.loc[${label}] means the label ${label}, df.iloc[0] the first position — and df.loc[0] is a KeyError unless some row is labeled 0.`
		},
		pandasAlign: {
			twoSeriesAria: 'Two Series',
			s1Label: 's1 · label:value',
			opLabel: 'op',
			s2Label: 's2 · label:value',
			byLabelHeading: 'pandas · matched by label',
			byPositionHeading: 'NumPy · matched by position',
			notInS1: 'not in s1',
			notInS2: 'not in s2',
			cannotCombine: (a: number, b: number) => `NumPy cannot combine lengths ${a} and ${b}: they do not broadcast.`,
			linesUpWithMatch: (label: string) =>
				`pandas lines the two Series up by label before computing: s1[${label}] meets s2[${label}], whatever their positions. The result has the union of the labels.`,
			linesUpNoMatch: 'pandas lines the two Series up by label before computing. The result has the union of the labels.',
			withFillValue:
				'With fill_value=0 a label that exists on only one side is combined with 0 instead — no NaN, but only because you said what “missing” should mean.',
			unmatchedNaN: (labels: string, verb: string, dtype: string) =>
				`${labels} ${verb} on only one side, so the result there is NaN (and the dtype becomes ${dtype}). Nothing is silently paired with the wrong value.`,
			exists: 'exists',
			exist: 'exist',
			everyLabelExists: 'Every label exists in both Series, so every value has a partner.',
			lengthsDiffer: (a: number, b: number) => `NumPy only has positions, and arrays of lengths ${a} and ${b} cannot be combined at all.`,
			pairsByPosition: (n: number) =>
				`NumPy pairs by position, so ${n} of the pairs combine values with different labels (⚠ rows) — a silent mistake that alignment prevents.`,
			sameOrder: 'The labels are in the same order, so here position and label agree and both give the same numbers.',
			broadcastingNote:
				'Broadcasting (chapter 06) is about shapes; alignment is about labels. pandas aligns first, then computes like NumPy.'
		}
	},
	id: {
		pandasView: {
			viewFrame: 'DataFrame',
			viewDtypes: 'dtype per kolom',
			viewAxis: 'axis',
			viewSelect: 'loc / iloc',
			viewAlign: 'Alignment',
			ariaLabel: 'tampilan pandas',
			cachedTitle: 'pandas diunduh saat alat ini pertama kali dijalankan (± 5 MB), lalu disimpan dalam cache.',
			realPandas: (version: string) => `pandas asli ${version} · berjalan di sini`
		},
		frameBasics: {
			labelsAria: 'Label',
			indexLabel: 'index · label baris',
			columnsLabel: 'columns · label kolom',
			placeholder: 'kosong → 0, 1, 2 …',
			hint: "Kata menjadi label teks ('r0'), bilangan bulat menjadi label angka (10).",
			addsLabels: 'menambahkan label',
			dropsThem: 'menghapusnya',
			p1: (shape: string) =>
				`Sebuah DataFrame adalah array 2-D berisi nilai dengan label pada kedua axis: df.index menamai baris dan df.columns menamai kolom (kotak yang diarsir). Label bukanlah nilai — df.to_numpy() hanya mengembalikan array ${shape}.`,
			p2d1: (n: number) => `Array 1-D berisi ${n} nilai menjadi ${n} baris × 1 kolom. DataFrame selalu 2-D.`,
			p2dn: (shape: string) => `Shape sama dengan a: ${shape}. Axis 0 dari a sekarang dilabeli oleh index, axis 1 oleh columns.`,
			p3range:
				'Tanpa label baris, pandas menomori barisnya 0, 1, 2 … (sebuah RangeIndex). Maka label dan posisi adalah angka yang sama — sampai kamu mengurutkan atau menyaring barisnya. Langkah 4 (loc / iloc) menunjukkan mengapa itu penting.',
			p3labeled: 'Angka abu-abu kecil adalah posisi. Setiap baris dan kolom memiliki label sekaligus posisi.',
			sharesMemory: 'values berbagi memori dengan a.',
			copied:
				'pandas 3 menyalin a: np.shares_memory(values, a) bernilai False, sehingga mengubah a nanti tidak mengubah df.',
			hoverHint: 'Arahkan kursor ke sebuah nilai: itu adalah elemen yang sama di ketiganya.'
		},
		pandasDtypes: {
			putNoneIn: (row: number) => `Masukkan None ke baris ${row} pada`,
			nothing: 'tidak ada',
			frameCaption: (shape: string) => `DataFrame ${shape} · satu dtype per kolom`,
			noneTypedHere: 'None diketik di sini',
			wasWithoutMissing: (dtype: string) => `sebelumnya ${dtype} tanpa nilai yang hilang`,
			p1: (list: string) =>
				`Sebuah ndarray memiliki satu dtype. Sebuah DataFrame memiliki satu dtype per kolom (${list}): setiap kolom disimpan sebagai array 1-D-nya sendiri. Kolom teks memiliki dtype str di pandas 3 (pandas versi lama menampilkan object).`,
			p2: (allDtype: string, numDtype: string) =>
				`df.to_numpy() harus menaruh semuanya dalam satu array, sehingga ia berpindah ke ${allDtype} — objek Python, lambat dan tanpa perhitungan vektorisasi. Pilih dulu kolom numeriknya dan kamu mendapat array ${numDtype} sungguhan (int64 dan float64 bertemu di float64).`,
			missingIn: (col: string) => `Nilai hilang pada ${col}:`,
			staysSame: (dtype: string, shown: string) => `dtype-nya tetap ${dtype}; nilai yang hilang ditampilkan sebagai ${shown}.`,
			changed: (before: string, after: string) => `${before} → ${after}.`,
			intToFloat:
				'Integer tidak memiliki nilai “hilang”, sehingga pandas menyimpan kolomnya sebagai float dan menggunakan NaN (sebuah float) untuk celah itu.',
			boolToObject: 'Kolom bool tidak bisa menampung None, sehingga pandas berpindah ke object: kolom berisi objek Python.',
			prompt: 'Masukkan nilai yang hilang ke sebuah kolom dan perhatikan dtype-nya.'
		},
		pandasAxis: {
			function: 'Fungsi',
			settingsAria: 'Pengaturan reduksi',
			hoverPrompt: 'Arahkan kursor ke sebuah nilai untuk melihat nilai mana saja yang digabungkan.',
			nanSkipped: (n: number) => `(${n} NaN dilewati)`,
			feedsResult: (label: string) => `mengalir ke result[${label}]`,
			p1rows: (axis: number) =>
				`axis=${axis} bekerja persis seperti punya NumPy: ia meruntuhkan axis ${axis}, sehingga baris-barisnya digabungkan dan kamu mendapat satu nilai per kolom.`,
			p1cols: (axis: number) =>
				`axis=${axis} bekerja persis seperti punya NumPy: ia meruntuhkan axis ${axis}, sehingga kolom-kolomnya digabungkan dan kamu mendapat satu nilai per baris.`,
			p1axisName: (name: string) => `pandas juga menerima axis berdasarkan nama: axis='${name}'.`,
			columnWord: 'kolom',
			rowWord: 'baris',
			p2: (labelKind: string, list: string) =>
				`Perbedaannya: hasilnya adalah sebuah Series yang dilabeli oleh label ${labelKind} (${list}). NumPy akan mengembalikan array polos dan kamu harus mengingat angka mana milik ${labelKind} yang mana.`,
			nanSkippedNote: 'NaN dilewati. Reduksi pandas secara default mengabaikan nilai yang hilang (skipna=True).',
			numpyDoesNot: (fn: string, axis: number, values: string) =>
				`NumPy tidak: np.${fn}(df.to_numpy(), axis=${axis}) memberikan [${values}].`,
			meanIsFloat: 'mean tetap berupa float bahkan untuk kolom integer, seperti di NumPy.'
		},
		pandasSelect: {
			accessorColHelp: 'Kolom berdasarkan label (atau baris lewat mask / slice)',
			accessorLocHelp: 'Baris, kolom berdasarkan label',
			accessorIlocHelp: 'Baris, kolom berdasarkan posisi',
			selectWith: 'Pilih dengan',
			selectionAria: (accessor: string) => `Seleksi di dalam ${accessor}[ ]`,
			apply: 'Terapkan',
			examplesAria: 'Contoh seleksi',
			clickToSelect: 'klik sebuah nilai untuk memilihnya',
			selected: 'terpilih',
			scalar: 'satu nilai tunggal (skalar)',
			scalarShort: 'skalar',
			series: 'sebuah Series',
			dataFrame: 'sebuah DataFrame',
			locSelectsByLabel: '.loc memilih berdasarkan label: nama-nama pada kotak yang diarsir. Baris dulu, baru kolom.',
			labelSliceIncludes: (a: string, b: string) =>
				`Slice label menyertakan ujungnya: ${a}:${b} memuat kedua baris. Tidak ada label “satu setelah akhir” untuk berhenti.`,
			ilocSelectsByPosition:
				'.iloc memilih berdasarkan posisi (angka abu-abu kecil), persis seperti indexing NumPy: df.iloc[i, j] ↔ df.to_numpy()[i, j].',
			positionSliceExcludes: 'Slice posisi tidak menyertakan ujungnya, seperti Python dan NumPy: 0:1 hanya posisi 0.',
			plainDfSelectsColumns:
				"df[…] biasa memilih kolom berdasarkan label — berbeda dengan NumPy, di mana a[0] adalah baris pertama. Sebuah boolean mask (df[df['A'] > 2]) atau sebuah slice (df[0:1]) memilih baris sebagai gantinya.",
			selectedCount: (n: number, total: number, kind: string, extra: string) => `Terpilih ${n} dari ${total} nilai → ${kind}${extra}.`,
			oneAxisFixed: 'Satu axis ditetapkan oleh satu label atau posisi, sehingga satu set label tersisa.',
			oneLabelPerAxis: 'Satu label (atau posisi) per axis memilih satu nilai.',
			intLabelsWarn: (label: string) =>
				`Label barisnya berupa angka. df.loc[${label}] berarti label ${label}, df.iloc[0] berarti posisi pertama — dan df.loc[0] akan menjadi KeyError kecuali ada baris berlabel 0.`
		},
		pandasAlign: {
			twoSeriesAria: 'Dua Series',
			s1Label: 's1 · label:nilai',
			opLabel: 'operasi',
			s2Label: 's2 · label:nilai',
			byLabelHeading: 'pandas · dicocokkan berdasarkan label',
			byPositionHeading: 'NumPy · dicocokkan berdasarkan posisi',
			notInS1: 'tidak ada di s1',
			notInS2: 'tidak ada di s2',
			cannotCombine: (a: number, b: number) => `NumPy tidak bisa menggabungkan panjang ${a} dan ${b}: keduanya tidak dapat di-broadcast.`,
			linesUpWithMatch: (label: string) =>
				`pandas menyelaraskan kedua Series berdasarkan label sebelum menghitung: s1[${label}] bertemu s2[${label}], di mana pun posisinya. Hasilnya memiliki gabungan (union) dari label-labelnya.`,
			linesUpNoMatch: 'pandas menyelaraskan kedua Series berdasarkan label sebelum menghitung. Hasilnya memiliki gabungan (union) dari label-labelnya.',
			withFillValue:
				'Dengan fill_value=0, label yang hanya ada pada satu sisi digabungkan dengan 0 sebagai gantinya — tidak ada NaN, tapi hanya karena kamu menentukan sendiri arti “hilang”.',
			unmatchedNaN: (labels: string, _verb: string, dtype: string) =>
				`${labels} hanya ada pada satu sisi, sehingga hasilnya di sana adalah NaN (dan dtype-nya menjadi ${dtype}). Tidak ada yang diam-diam dipasangkan dengan nilai yang salah.`,
			exists: '',
			exist: '',
			everyLabelExists: 'Setiap label ada di kedua Series, sehingga setiap nilai memiliki pasangan.',
			lengthsDiffer: (a: number, b: number) => `NumPy hanya memiliki posisi, dan array dengan panjang ${a} dan ${b} sama sekali tidak bisa digabungkan.`,
			pairsByPosition: (n: number) =>
				`NumPy memasangkan berdasarkan posisi, sehingga ${n} dari pasangan itu menggabungkan nilai dengan label berbeda (baris ⚠) — kesalahan diam-diam yang dicegah oleh alignment.`,
			sameOrder: 'Label-labelnya berada dalam urutan yang sama, sehingga di sini posisi dan label sepakat dan keduanya memberi angka yang sama.',
			broadcastingNote:
				'Broadcasting (bab 06) berkaitan dengan shape; alignment berkaitan dengan label. pandas menyelaraskan dulu, baru menghitung seperti NumPy.'
		}
	}
} as const;

export function tv<K extends keyof (typeof dict)['en']>(section: K): (typeof dict)['en'][K] {
	return (dict[lang.current] as (typeof dict)['en'])[section];
}
