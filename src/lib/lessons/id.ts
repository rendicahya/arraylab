import type { ChapterText } from './types';

/**
 * Indonesian text for every chapter, keyed by chapter slug. Same structure and
 * order as the English chapters in ndarray.ts, shape.ts, etc. — only prose is
 * translated; code, patches and technical identifiers stay as they are.
 */
export const chapterTextId: Record<string, ChapterText> = {
	ndarray: {
		title: 'Mengenal ndarray',
		summary: 'Ketik angka, dapatkan array NumPy, lalu baca shape, ndim, dan size-nya.',
		topics: ['Membuat array', 'Array 1-D', 'Array 2-D', 'Dimensi lebih tinggi', 'shape · ndim · size'],
		steps: [
			{
				title: 'Ketik beberapa angka',
				body: [
					'Sebuah **ndarray** (array n-dimensi) adalah wadah NumPy untuk angka: sebuah grid persegi panjang di mana setiap elemen memiliki tipe yang sama.',
					'Ketik angka di kotak `a =`. ArrayLab menuliskan pemanggilan `np.array([...])` yang sesuai (lihat “Kode yang dijalankan” di bawah) dan NumPy sungguhan membangun array-nya.'
				],
				tasks: [
					{ text: 'Tambahkan baris ketiga: 7 8 9' },
					{ text: 'Buat satu baris lebih pendek — apa kata NumPy?' },
					{ text: 'Gunakan angka desimal di suatu tempat' }
				],
				remember: 'ndarray berbentuk persegi panjang dan berisi satu jenis elemen.'
			},
			{
				title: 'Array 1-D',
				body: [
					'Angka pada satu baris membentuk **array 1-D**: sebaris nilai dengan satu axis.',
					'Setiap elemen ditemukan dengan **satu indeks**, dimulai dari 0. Arahkan kursor ke sebuah sel untuk melihatnya.'
				],
				tasks: [{ text: 'Satu angka tunggal menjadi array 0-d (shape ())' }, { text: 'Array 1-D yang lebih panjang' }],
				remember: '1-D: shape memiliki satu entri, mis. (6,). Koma di akhir berarti “tuple dengan satu elemen”.'
			},
			{
				title: 'Array 2-D',
				body: [
					'Beberapa baris membentuk **array 2-D**. Sekarang setiap elemen membutuhkan **dua indeks**: `a[i, j]`.',
					'Untuk array 2-D, axis 0 melangkah antar baris (ke bawah) dan axis 1 melangkah antar kolom (menyamping). Angka di sekeliling grid adalah indeks-indeks tersebut.'
				],
				tasks: [{ text: 'Coba array yang tinggi: 4 baris × 2 kolom' }, { text: 'Satu kolom tunggal (shape (3, 1))' }],
				remember: 'Shape (baris, kolom) dari array 2-D menuliskan panjang axis 0, lalu axis 1.'
			},
			{
				title: 'Dimensi lebih tinggi',
				body: [
					'Pisahkan dua grid dengan **baris kosong** dan array menjadi **3-D**: tumpukan blok-blok 2-D.',
					'Sekarang ada tiga indeks. Axis 0 memilih blok, axis 1 memilih baris di dalamnya, axis 2 memilih kolom. Istilah seperti “baris” hanya masuk akal untuk dua axis terakhir — hitung axis dari luar ke dalam.'
				],
				tasks: [{ text: 'Buat array (2, 3, 4) dengan np.arange' }, { text: 'Array 4-D (2, 2, 2, 3)' }],
				remember: 'ndim bisa berapa saja. Setiap axis tambahan menambah satu indeks lagi.'
			},
			{
				title: 'shape, ndim, dan size',
				body: [
					'Tiga properti menjelaskan strukturnya — lihat di Inspektor pada sisi kanan:',
					'`shape` adalah tuple berisi **panjang setiap axis**. `ndim` adalah **berapa banyak axis** yang ada (panjang dari shape). `size` adalah **jumlah total elemen** (hasil kali dari shape).',
					'Shape dan size adalah dua hal berbeda: (2, 3, 4) dan (4, 6) sama-sama memiliki size 24.'
				],
				tasks: [{ text: 'Size sama, shape berbeda: (4, 6)' }, { text: 'Tanyakan langsung ke Python di editor' }],
				remember: 'shape = dimensi · ndim = len(shape) · size = hasil kali shape.'
			}
		]
	},
	shape: {
		title: 'Shape',
		summary: 'Susun ulang elemen yang sama: reshape, flatten, ravel, dan transpose.',
		topics: ['Memahami shape', 'reshape', 'flatten', 'ravel', 'transpose'],
		steps: [
			{
				title: 'Memahami shape',
				body: [
					'Shape mendaftar panjang axis dari yang **paling luar** ke yang **paling dalam**. Untuk `(3, 4)`: 3 baris, masing-masing berisi 4 nilai.',
					'NumPy menyimpan elemen dalam satu baris memori, dalam **urutan baca** (baris demi baris). Shape memberi tahu NumPy cara melipat baris itu menjadi sebuah grid.'
				],
				tasks: [{ text: 'Buka lipatannya menjadi urutan baca dengan ravel' }],
				remember: 'Shape = cara sebaris elemen dilipat. Label-label kecil menghitung urutan baca.'
			},
			{
				title: 'reshape',
				body: [
					'`reshape` melipat **elemen yang sama dalam urutan yang sama** menjadi shape baru. Ikuti label-label kecil: mereka tetap 0, 1, 2, … dalam urutan baca.',
					'Shape baru harus memuat jumlah elemen yang persis sama. Gunakan `-1` untuk satu dimensi agar NumPy yang menghitungnya.'
				],
				tasks: [
					{ text: 'reshape(2, 6)' },
					{ text: 'reshape(3, -1) — biarkan NumPy menyimpulkannya' },
					{ text: 'Jadi 3-D: reshape(2, 2, 3)' },
					{ text: 'Shape yang tidak mungkin: (5, 3)' }
				],
				remember: 'reshape mengubah shape, tidak pernah mengubah urutan atau jumlah elemen.'
			},
			{
				title: 'flatten dan ravel',
				body: [
					'Keduanya mengubah array apa pun menjadi **1-D**, dalam urutan baca.',
					'`flatten()` selalu membuat **copy**. `ravel()` mengembalikan **view** jika memungkinkan — hasilnya berbagi memori dengan `a`, sehingga tidak ada data yang disalin. Perhatikan label “view / copy”.'
				],
				tasks: [{ text: 'Beralih ke ravel' }, { text: 'Buktikan perbedaannya lewat kode' }],
				remember: 'View berbagi memori dengan aslinya; copy tidak.'
			},
			{
				title: 'transpose',
				body: [
					'`a.T` menukar axis: elemen `a[i, j]` berpindah ke `result[j, i]`, dan shape `(2, 3)` menjadi `(3, 2)`.',
					'Berbeda dengan reshape, **urutan baca berubah**. Tekan “Putar urutan baca” dan lihat dari mana setiap elemen berasal. NumPy tidak memindahkan data apa pun — ia mengembalikan view dengan strides yang ditukar, itulah sebabnya hasilnya tidak C-contiguous.'
				],
				tasks: [
					{ text: 'Bandingkan dengan reshape(3, 2) — shape sama, susunan berbeda' },
					{ text: 'Transpose sebuah array 3-D' },
					{ text: 'Pilih urutan axis: transpose(1, 0, 2)' }
				],
				remember: 'reshape mempertahankan urutan baca; transpose menyusun ulang axis.'
			}
		]
	},
	axis: {
		title: 'Axis',
		summary: 'Apa arti sebenarnya axis=0 dan axis=1 — dan bagaimana reduksi meruntuhkan sebuah axis.',
		topics: ['Axis 0', 'Axis 1', 'Axis pada dimensi lebih tinggi', 'Reduksi', 'sum · mean · max · min'],
		steps: [
			{
				title: 'Axis 0',
				body: [
					'`np.sum(a, axis=0)` menjumlahkan nilai **sepanjang axis 0**: ia berjalan menyusuri indeks pertama sementara indeks lainnya tetap.',
					'Untuk array 2-D, itu berarti setiap kolom dijumlahkan. Panah menunjukkan arah peruntuhan; sel dengan label yang sama berakhir di elemen hasil yang sama. Arahkan kursor ke sebuah hasil untuk melihat jumlahnya.'
				],
				tasks: [{ text: 'Tambahkan baris dan lihat jumlahnya bertambah' }],
				remember: 'axis=0 meruntuhkan axis pertama; axis itu menghilang dari shape: (2, 3) → (3,).'
			},
			{
				title: 'Axis 1',
				body: [
					'`axis=1` berjalan sepanjang **indeks kedua**. Dalam 2-D itu berarti menyamping sepanjang tiap baris, sehingga kamu mendapat satu nilai per baris.',
					'Shape kehilangan axis 1: `(2, 3)` → `(2,)`.'
				],
				tasks: [
					{ text: 'axis=None: semuanya sekaligus' },
					{ text: 'Axis negatif dihitung dari akhir: axis=-1 adalah axis terakhir' }
				],
				remember: 'Axis yang kamu berikan adalah axis yang menghilang.'
			},
			{
				title: 'sum, mean, max, min',
				body: [
					'Setiap **reduksi** mengikuti aturan axis yang sama — hanya cara nilai digabungkan yang berbeda.',
					'`mean` mengembalikan float. `argmax` mengembalikan *di mana* nilai maksimum berada, bukan nilai maksimumnya sendiri.'
				],
				tasks: [{ text: 'max sepanjang axis 1' }, { text: 'min sepanjang axis 0' }, { text: 'argmax sepanjang axis 1' }]
			},
			{
				title: 'keepdims',
				body: [
					'Dengan `keepdims=True`, axis yang direduksi tetap ada di shape dengan panjang 1: `(2, 3)` → `(1, 3)`.',
					'Ini membuat hasilnya tetap selaras dengan `a`, sehingga operasi seperti `a - a.mean(axis=0, keepdims=True)` bisa broadcast dengan benar.'
				],
				tasks: [{ text: 'Coba axis=1 dengan keepdims' }, { text: 'Pusatkan (center) setiap kolom lewat kode' }]
			},
			{
				title: 'Axis pada dimensi lebih tinggi',
				body: [
					'Dalam 3-D, axis 0 berjalan **antar blok**, axis 1 menyusuri baris tiap blok, axis 2 sepanjang tiap baris.',
					'Coba tiap axis. Setiap kali, hanya indeks yang dipilih yang berubah di dalam sebuah kelompok — dan axis itu hilang dari shape hasil. Inilah sebabnya aturan “axis 0 = baris” dapat menyesatkan.'
				],
				tasks: [{ text: 'axis=1' }, { text: 'axis=2' }, { text: 'axis=None' }],
				remember: 'Mereduksi axis k menghapus entri k dari shape: (2, 3, 4) dengan axis=1 → (2, 4).'
			}
		]
	},
	indexing: {
		title: 'Indexing & Slicing',
		summary: 'Pilih elemen tunggal, baris, kolom, rentang, dan mask — dan lihat persis apa yang kamu pilih.',
		topics: ['Indexing skalar', 'Memilih baris', 'Memilih kolom', 'Slicing', 'Boolean indexing'],
		steps: [
			{
				title: 'Indexing skalar',
				body: [
					'`a[i, j]` memberi satu elemen: baris `i`, kolom `j`, keduanya dihitung dari 0.',
					'Klik sel mana pun untuk mengindeksnya. Angka negatif dihitung dari akhir: `a[-1, -1]` adalah elemen terakhir.'
				],
				tasks: [{ text: 'Elemen terakhir' }, { text: 'Indeks yang tidak ada' }],
				remember: 'Satu integer per axis → satu elemen tunggal (sebuah skalar, bukan array).'
			},
			{
				title: 'Memilih baris',
				body: [
					'Berikan indeks lebih sedikit daripada jumlah axis dan sisanya diambil seluruhnya. `a[1]` sama dengan `a[1, :]`: seluruh baris 1.',
					'Integer tersebut menghilangkan axis 0 dari hasilnya, sehingga satu baris dari array 2-D menjadi 1-D.'
				],
				tasks: [{ text: 'Tulis secara eksplisit: a[1, :]' }, { text: 'Pertahankan tetap 2-D dengan sebuah slice: a[1:2]' }]
			},
			{
				title: 'Memilih kolom',
				body: [
					'`:` berarti “semuanya sepanjang axis ini”. `a[:, 2]` mempertahankan semua baris dan memilih kolom 2.',
					'Hasilnya 1-D dengan shape `(3,)`, bukan sebuah kolom dengan shape `(3, 1)`. Memilih tidak sama dengan mempertahankan tata letak.'
				],
				tasks: [{ text: 'Pertahankan shape kolom: a[:, 2:3]' }, { text: 'Atau tambahkan sebuah axis: a[:, 2, None]' }]
			},
			{
				title: 'Slicing',
				body: [
					'Sebuah slice `start:stop:step` mempertahankan sebuah rentang. `stop` **tidak termasuk**; bagian yang dihilangkan berarti “dari awal”, “sampai akhir”, “step 1”.',
					'Slice dasar mengembalikan sebuah **view**: hasilnya berbagi memori dengan `a`.'
				],
				tasks: [
					{ text: 'Setiap kolom lainnya (selang-seling): a[:, ::2]' },
					{ text: 'Balik urutan baris: a[::-1]' },
					{ text: 'Slicing sebuah array 3-D' }
				],
				remember: 'Integer menghilangkan sebuah axis; slice mempertahankannya.'
			},
			{
				title: 'Boolean indexing',
				body: [
					'Sebuah kondisi seperti `a > 5` menghasilkan sebuah **mask**: array berisi True/False dengan shape yang sama seperti `a`.',
					'`a[a > 5]` mempertahankan elemen-elemen di mana mask-nya True. Hasilnya selalu **1-D** (dalam urutan baca) dan berupa **copy**.'
				],
				tasks: [
					{ text: 'Angka genap: a[a % 2 == 0]' },
					{ text: 'Gabungkan kondisi: (a > 2) & (a < 9)' },
					{ text: 'Indexing dengan array integer (“fancy indexing”)' }
				]
			}
		]
	},
	dtype: {
		title: 'dtype',
		summary: 'Setiap elemen memiliki tipe yang sama. Lihat apa yang dilakukan konversi terhadap nilai dan memori.',
		topics: ['Integer', 'Bilangan pecahan (float)', 'Boolean', 'Konversi dtype', 'itemsize · nbytes'],
		steps: [
			{
				title: 'dtype integer',
				body: [
					'NumPy memilih dtype **integer** untuk bilangan bulat. Angka pada namanya adalah lebar bit: `int32` menggunakan 32 bit = 4 byte per elemen.',
					'Di browser ini NumPy berjalan di atas WebAssembly 32-bit, sehingga integer bawaannya adalah `int32`. Pada desktop 64-bit yang umum, NumPy 2 akan memilih `int64` untuk kode yang sama. ArrayLab menunjukkan apa yang benar-benar dilakukan NumPy di sini, bukan berpura-pura.'
				],
				tasks: [{ text: 'Persempit menjadi int8 (1 byte masing-masing)' }, { text: 'Minta int64 saat membuat array' }],
				remember: 'dtype dibagikan oleh semua elemen dan menentukan berapa banyak memori yang digunakan masing-masing.'
			},
			{
				title: 'Bilangan pecahan (float)',
				body: [
					'Titik desimal mana pun membuat NumPy memilih dtype **float** — untuk seluruh array.',
					'Mengonversi float ke integer **memotong ke arah nol** (truncate). Mengonversi ke float yang lebih kecil membulatkan ke nilai representable terdekat.'
				],
				tasks: [{ text: 'float16: lebih sedikit bit, presisi lebih rendah' }, { text: 'Campur integer dan float — dtype mana yang menang?' }]
			},
			{
				title: 'Boolean',
				body: [
					'`bool` menyimpan True/False dalam 1 byte masing-masing. Mengonversi angka ke bool menghasilkan **False untuk 0 dan True untuk selain itu**.',
					'Perbandingan seperti `a > 2` juga menghasilkan array bool — mask yang digunakan dalam boolean indexing.'
				],
				tasks: [{ text: 'Ketik True/False secara langsung' }]
			},
			{
				title: 'Konversi dan overflow',
				body: [
					'`astype` mengonversi ke dtype lain dan mengembalikan array baru. Jika sebuah nilai tidak muat, integer akan **wrap around** secara diam-diam: 300 sebagai `uint8` menjadi 44 (300 − 256), −1 menjadi 255.',
					'Nilai yang berubah digambar putus-putus dan ditandai ≠.'
				],
				tasks: [{ text: 'int16 memiliki ruang yang cukup untuk nilai-nilai ini' }, { text: 'Membuat (bukan mengonversi) nilai di luar jangkauan memunculkan error' }]
			},
			{
				title: 'itemsize dan nbytes',
				body: [
					'`itemsize` adalah byte per elemen, `nbytes` adalah totalnya: `nbytes = size × itemsize`.',
					'Strip byte di bawah setiap array menunjukkan ini secara langsung. Nilai yang sama, dtype berbeda → memori berbeda.'
				],
				tasks: [{ text: 'complex128: 16 byte masing-masing' }, { text: 'uint8: 1 byte masing-masing' }],
				remember: 'Memilih dtype adalah trade-off antara rentang nilai, presisi, dan memori.'
			}
		]
	},
	broadcasting: {
		title: 'Broadcasting',
		summary: 'Menggabungkan array dengan shape berbeda: selaraskan dari kanan, regangkan angka 1-nya.',
		topics: ['Broadcasting skalar', 'Broadcasting vektor', 'Penyelarasan shape', 'Shape yang kompatibel', 'Shape yang tidak kompatibel'],
		steps: [
			{
				title: 'Broadcasting skalar',
				body: [
					'`a + 10` menambahkan 10 ke setiap elemen. Skalar tersebut memiliki shape `()` — NumPy memperlakukannya seolah-olah diregangkan ke shape `a`.',
					'Arahkan kursor ke sebuah sel hasil untuk melihat dua nilai mana yang digabungkan.'
				],
				tasks: [{ text: 'Ganti dengan perkalian' }, { text: 'Bandingkan: a > 3' }]
			},
			{
				title: 'Broadcasting vektor',
				body: [
					'Array 1-D dengan panjang 3 dapat ditambahkan ke array `(2, 3)`: array itu digunakan ulang untuk **setiap baris**.',
					'Sel putus-putus adalah salinan hasil regangan. Itu hanya bersifat konseptual — NumPy tidak pernah benar-benar menyalin data, ia hanya membaca nilai yang sama lagi.'
				],
				tasks: [{ text: 'Skalakan setiap kolom secara berbeda' }]
			},
			{
				title: 'Penyelarasan shape',
				body: [
					'Aturannya: tulis shape-shape itu **rata kanan**. Bandingkan kolom demi kolom: ukurannya harus **sama**, atau salah satunya harus **1**. Dimensi yang tidak ada dihitung sebagai 1.',
					'Sebuah kolom `(2, 1)` melawan `(2, 3)`: angka 1 diregangkan menjadi 3, sehingga setiap baris mendapat nilainya sendiri.'
				],
				tasks: [{ text: 'Kembali ke vektor baris (3,)' }],
				remember: 'Selaraskan dari kanan. Sama atau 1 — jika tidak, akan gagal.'
			},
			{
				title: 'Shape yang kompatibel',
				body: [
					'Kedua operand bisa meregang. Sebuah kolom `(3, 1)` ditambah sebuah baris `(4,)` menghasilkan tabel `(3, 4)` — setiap kombinasi dari keduanya.',
					'Pola “outer” ini muncul di mana-mana: tabel jarak, tabel perkalian, perbandingan berpasangan.'
				],
				tasks: [{ text: 'Tabel penjumlahan' }]
			},
			{
				title: 'Shape yang tidak kompatibel',
				body: [
					'`(2, 3)` dan `(2,)` gagal: setelah diselaraskan dari kanan, 3 bertemu 2 dan tidak satu pun bernilai 1.',
					'Baca error dari NumPy bersama tabel penyelarasannya. Untuk menggunakan `b` per baris, jadikan ia sebuah kolom: shape `(2, 1)`.'
				],
				tasks: [{ text: 'Perbaiki: jadikan b sebuah kolom (satu nilai per baris)' }, { text: 'Perbaiki lewat kode dengan np.newaxis' }]
			}
		]
	},
	vectorization: {
		title: 'Vektorisasi',
		summary: 'Ganti loop Python dengan operasi pada seluruh array — hasil sama, kerja jauh lebih sedikit.',
		topics: ['Loop Python', 'Operasi element-wise', 'ufunc NumPy', 'Berpikir secara vektorisasi'],
		steps: [
			{
				title: 'Loop Python',
				body: [
					'Versi loop menyentuh satu elemen pada satu waktu: ambil `x`, hitung, tambahkan (append). Tekan “Animasikan” untuk melihatnya.',
					'Versi vektorisasi, `a * 2`, menjelaskan seluruh operasi dalam satu ekspresi. Keduanya menghasilkan array yang sama.'
				],
				tasks: [{ text: 'Ganti dengan menambahkan 10' }]
			},
			{
				title: 'Operasi element-wise',
				body: [
					'Operasi aritmetika antara array dan angka (atau dua array dengan shape yang sama) diterapkan **elemen demi elemen**, apa pun shape-nya.',
					'Di sini array-nya 2-D, dan `a ** 2` tetap saja mengkuadratkan setiap elemen.'
				],
				tasks: [{ text: 'Nilai absolut' }, { text: 'Perbandingan: a > 2 menghasilkan boolean' }]
			},
			{
				title: 'ufunc NumPy',
				body: [
					'Operator seperti `+`, `*`, dan `>` memanggil **universal functions** (ufunc) seperti `np.add`, `np.multiply`, `np.greater`. Fungsi seperti `np.sqrt` dan `np.exp` juga merupakan ufunc.',
					'Sebuah ufunc melakukan loop atas elemen-elemennya dalam kode yang sudah dikompilasi, sehingga satu pemanggilan menangani seluruh array.'
				],
				tasks: [{ text: 'Operator sebenarnya adalah ufunc yang menyamar' }]
			},
			{
				title: 'Berpikir secara vektorisasi',
				body: [
					'Tekan **Ukur kecepatan**: operasi yang sama pada 100.000 elemen, loop vs vektorisasi, diukur waktunya langsung di browsermu.',
					'Berpikir secara vektorisasi berarti menjelaskan *apa* yang terjadi pada seluruh array (`(a - a.mean()) / a.std()`), bukan *bagaimana* mengunjungi setiap elemen.'
				],
				tasks: [{ text: 'Standardisasi sebuah array tanpa loop' }],
				remember: 'Jika kamu menulis for-loop atas elemen-elemen array, biasanya ada ekspresi NumPy untuk itu.'
			}
		]
	},
	views: {
		title: 'View vs copy',
		summary: 'Operasi mana yang berbagi memori dengan array aslinya — dan apa yang terjadi saat kamu menulis ke dalamnya.',
		topics: ['b = a', 'Slice adalah view', 'Fancy & boolean indexing menghasilkan copy', 'reshape, T, ravel', 'Kapan harus copy'],
		steps: [
			{
				title: 'b = a bukanlah copy',
				body: [
					'`b = a` tidak menyalin apa pun. Ini hanya memberi array yang **sama** sebuah nama kedua: `b is a` bernilai True.',
					'Centang **tulis ke b**: `b[...] = 99` menulis ke setiap elemen `b`. Lalu lihat `a`.'
				],
				tasks: [{ text: 'Tulis ke b' }, { text: 'Buat copy sungguhan: b = a.copy()' }],
				remember: 'Assignment tidak pernah menyalin: b = a adalah satu array dengan dua nama.'
			},
			{
				title: 'Slice adalah view',
				body: [
					'Slice dasar seperti `a[:, 1]` membuat sebuah **view**: objek array baru yang melihat ke dalam memori `a`. Tidak ada angka yang disalin.',
					'Baris memori menunjukkan caranya: `b` mengambil setiap elemen ke-3 dari memori `a`. Langkah itu adalah `b.strides`.'
				],
				tasks: [
					{ text: 'Tulis ke b' },
					{ text: 'Sebuah baris: a[0]' },
					{ text: 'Setiap kolom lainnya: a[:, ::2]' },
					{ text: 'Terbalik: a[::-1] (step negatif)' }
				],
				remember: 'Slicing dasar (integer dan start:stop:step) menghasilkan sebuah view: menulis ke dalamnya mengubah a.'
			},
			{
				title: 'Fancy & boolean indexing menghasilkan copy',
				body: [
					'Indexing dengan sebuah **list** posisi atau sebuah **boolean mask** selalu menghasilkan sebuah **copy**. Elemen-elemen yang dipilih tidak memiliki step yang teratur dalam memori, sehingga NumPy mengumpulkannya ke memori baru.',
					'Di sini `b[...] = 99` hanya mengubah `b`.'
				],
				tasks: [
					{ text: 'Sebuah boolean mask: a[a > 2]' },
					{ text: 'Baris yang sama lewat sebuah slice: a[0:2]' },
					{ text: 'Tapi a[mask] = … memang menulis ke dalam a' }
				],
				remember: 'Memilih dengan list atau mask menghasilkan copy. Meng-assign dengan a[mask] = … menulis ke dalam a.'
			},
			{
				title: 'reshape, T, ravel',
				body: [
					'`a.T`, `a.reshape(…)`, dan `a.ravel()` mengembalikan **view** kapan pun memungkinkan: mereka hanya mengubah shape dan strides.',
					'`a.flatten()` selalu menyalin. Dan `a.T.ravel()` harus menyalin: membaca hasil transpose baris demi baris bukan urutan memorinya.'
				],
				tasks: [
					{ text: 'a.reshape(3, 2)' },
					{ text: 'a.ravel(): sebuah view' },
					{ text: 'a.flatten(): selalu sebuah copy' },
					{ text: 'a.T.ravel(): harus menyalin' }
				],
				remember: 'Perubahan shape berupa view jika memungkinkan. np.shares_memory(a, b) memberitahumu dengan pasti.'
			},
			{
				title: 'Kapan harus copy',
				body: [
					'View itu cepat dan hemat memori, tapi perubahan lewat satu nama akan muncul lewat nama yang lain. Panggil `.copy()` saat kamu butuh array yang independen.',
					'PyTorch bekerja dengan cara yang sama: slicing sebuah tensor menghasilkan view, dan `torch.from_numpy` berbagi memori dengan array-nya (bab 10).'
				],
				tasks: [{ text: 'Tanpa .copy()' }, { text: 'Sebuah fungsi yang mengubah inputnya' }],
				remember: 'Butuh array yang independen? Gunakan .copy().'
			}
		]
	},
	combining: {
		title: 'Menggabungkan array',
		summary: 'Gabungkan array dengan concatenate dan stack, tambahkan axis dengan np.newaxis, dan potong-potong dengan split.',
		topics: ['concatenate', 'Shape yang cocok', 'stack & np.newaxis', 'split'],
		steps: [
			{
				title: 'concatenate',
				body: [
					'`np.concatenate([a, b], axis=0)` menaruh `b` **di bawah** `a`. Array-array digabung sepanjang axis yang sudah mereka miliki, sehingga ndim tetap sama.',
					'Sepanjang axis 0 ukurannya dijumlahkan (2 + 2 = 4). Arahkan kursor ke sebuah sel hasil untuk melihat asalnya.'
				],
				tasks: [{ text: 'Berdampingan: axis=1' }, { text: 'Tambahkan hanya satu baris' }, { text: 'Tambahkan satu kolom' }],
				remember: 'concatenate mempertahankan ndim: ukuran dijumlahkan sepanjang axis-nya, setiap axis lain harus cocok.'
			},
			{
				title: 'Shape yang cocok',
				body: [
					'Hanya axis yang digabung yang boleh berbeda. Sebuah baris berisi 3 elemen cocok **di bawah** `a` (axis 0), tapi tidak **di samping**nya (axis 1).',
					'`b` yang 1-D sama sekali tidak cocok dengan `a` yang 2-D: beri dulu axis yang hilang itu dengan `np.newaxis`.'
				],
				tasks: [
					{ text: 'Baris yang sama di samping a: axis=1' },
					{ text: 'b yang 1-D: shape (3,)' },
					{ text: 'Perbaiki dengan np.newaxis' }
				],
				remember: 'concatenate tidak pernah melakukan padding atau broadcasting: shape yang tidak cocok adalah sebuah error.'
			},
			{
				title: 'stack & np.newaxis',
				body: [
					'`np.stack([a, b])` menaruh `a` dan `b` pada sebuah axis **baru**: dua array (2, 3) menjadi satu array (2, 2, 3).',
					'Ini sama dengan concatenate setelah memberi setiap array axis itu terlebih dulu (`a[np.newaxis]` memiliki shape (1, 2, 3)). `axis` menentukan di mana axis baru itu diletakkan.'
				],
				tasks: [
					{ text: 'Axis baru di akhir: axis=2' },
					{ text: 'Di tengah: axis=1' },
					{ text: 'Shape yang berbeda tidak bisa di-stack' },
					{ text: 'stack = newaxis + concatenate' }
				],
				remember: 'stack menambahkan sebuah axis (ndim + 1); concatenate mempertahankan ndim.'
			},
			{
				title: 'split',
				body: [
					'`np.split(a, 3, axis=1)` memotong `a` menjadi 3 bagian sama besar sepanjang axis 1 dan mengembalikan sebuah **list** array.',
					'Bagian-bagian itu adalah **view** dari `a` (bab 08). Menggabungkannya kembali dengan `np.concatenate` membuat array baru.'
				],
				tasks: [{ text: 'Dua bagian' }, { text: 'Pisahkan barisnya: axis=0' }, { text: '4 bagian tidak muat ke dalam 6 kolom' }],
				remember: 'split mengembalikan view; bagian-bagiannya harus sama besar (np.array_split memperbolehkan yang tidak rata).'
			}
		]
	},
	'numpy-to-pytorch': {
		title: 'NumPy → PyTorch',
		summary: 'ndarray vs Tensor: konversi, kemiripan, dan perbedaan.',
		topics: ['ndarray vs Tensor', 'Konversi antar keduanya', 'Kemiripan', 'Perbedaan'],
		steps: [
			{
				title: 'ndarray vs Tensor',
				body: [
					'Sebuah **Tensor** PyTorch adalah array n-dimensi, sama seperti **ndarray** NumPy: grid yang sama, shape yang sama, axis yang sama. Semua yang dipelajari di bab 01–07 tetap berlaku.',
					'Tabel ini menaruh setiap properti NumPy berdampingan dengan penulisannya di PyTorch. Kolom NumPy dihitung secara langsung. PyTorch tidak bisa berjalan di browser, jadi kolomnya menunjukkan apa yang dikembalikan PyTorch sungguhan untuk data yang sama (hasil rekaman).'
				],
				tasks: [{ text: 'Ketik angka desimal — bandingkan dtype-nya' }, { text: 'Sebuah array 3-D' }],
				remember: 'Tensor adalah array n-dimensi dengan dua kemampuan ekstra: sebuah device dan pelacakan gradien.'
			},
			{
				title: 'Konversi antar keduanya',
				body: [
					'`torch.from_numpy(a)` membungkus **memori yang sama** dengan `a` — tidak ada yang disalin. `torch.tensor(a)` membuat sebuah **copy**. `t.numpy()` kembali ke NumPy, lagi-lagi tanpa menyalin.',
					'Berbagi memori itu cepat, tapi perubahan di satu sisi akan muncul di sisi lain — persis seperti view NumPy pada bab 08.'
				],
				tasks: [{ text: 'Mulai dari sebuah fungsi NumPy' }, { text: 'Angka desimal' }],
				remember: '`from_numpy` dan `.numpy()` berbagi memori; `torch.tensor` menyalin.'
			},
			{
				title: 'Kemiripan',
				body: [
					'Sebagian besar operasi NumPy memiliki kembaran di PyTorch dengan makna yang sama: indexing, reshaping, aritmetika, reduksi. Pilih sebuah operasi: NumPy menghitungnya secara langsung, dan penulisan PyTorch-nya ditampilkan di sampingnya.',
					'Sebuah reduksi tetap meruntuhkan satu axis. PyTorch menyebut axis itu **dim**: `a.sum(axis=0)` adalah `t.sum(dim=0)`.'
				],
				tasks: [{ text: 'Indexing: baris pertama' }, { text: 'reshape(-1)' }, { text: 'Aritmetika: × 2' }]
			},
			{
				title: 'Perbedaan',
				body: [
					'Beberapa hasil berbeda. PyTorch menolak `t.mean()` pada tensor integer, menjumlahkan integer menghasilkan int64, dan membagi integer menghasilkan float32, bukan float64.',
					'Beberapa nama berbeda: `astype` → `.to()`, `copy` → `clone`, `np.concatenate` → `torch.cat`, `np.expand_dims` → `unsqueeze`. Dan di PyTorch, `t.size()` adalah **shape**-nya; `t.numel()` menghitung elemen.'
				],
				tasks: [
					{ text: 'Dengan angka desimal, mean berfungsi' },
					{ text: 'Pembagian: ÷ 2' },
					{ text: '`copy` → `clone`' },
					{ text: '`np.concatenate` → `torch.cat`' }
				],
				remember: 'Ide yang sama, beberapa nama baru — dan PyTorch lebih menyukai float32.'
			}
		]
	},
	'pytorch-tensor': {
		title: 'PyTorch Tensor',
		summary: 'Pembuatan tensor, shape, dtype, numel, dan device.',
		topics: ['Membuat tensor', 'Shape', 'dtype', 'numel', 'device'],
		steps: [
			{
				title: 'Membuat tensor',
				body: [
					'PyTorch memiliki fungsi pembuatan yang sudah kamu kenal dari NumPy: `zeros`, `ones`, `full`, `arange`, `linspace`, `eye`, dan fungsi acak. Pilih salah satu: NumPy membangun array-nya di sini, dan pemanggilan PyTorch-nya ditampilkan di sampingnya.',
					'Perhatikan dtype-nya: PyTorch membuat **float32** di mana NumPy membuat float64.'
				],
				tasks: [
					{ text: '`torch.arange(12).reshape(3, 4)`' },
					{ text: '`torch.eye(3)`' },
					{ text: 'Acak: `torch.rand(2, 3)`' }
				]
			},
			{
				title: 'Shape',
				body: [
					'`t.shape` adalah sebuah `torch.Size`, yang merupakan sebuah tuple: `t.shape[0]` dan `rows, cols = t.shape` berfungsi. `t.size()` mengembalikan hal yang sama, dan `t.size(1)` mengembalikan panjang satu dim.',
					'dim 0 adalah axis paling luar, persis seperti axis 0 di NumPy.'
				],
				tasks: [{ text: 'Sebuah tensor 2-D' }, { text: 'Sebuah kolom' }]
			},
			{
				title: 'dtype',
				body: [
					'Setiap tensor memiliki satu dtype, seperti `torch.float32` atau `torch.int64`. `t.element_size()` adalah jumlah byte per elemen (NumPy: `itemsize`).',
					'Konversi dengan `t.to(torch.float64)` atau jalan pintas `t.float()` (float32), `t.double()` (float64), `t.long()` (int64), dan `t.int()` (int32).'
				],
				tasks: [{ text: 'Minta float64 secara eksplisit' }, { text: 'Integer kecil: int8' }, { text: 'Boolean' }]
			},
			{
				title: 'numel',
				body: [
					'`t.numel()` menghitung elemen: hasil kali dari shape. Ini adalah `size`-nya NumPy.',
					'Hati-hati: `len(t)` hanya panjang dim 0, dan `t.size()` adalah shape-nya.'
				],
				tasks: [{ text: 'Shape (4, 6): numel yang sama' }, { text: 'Shape (24,)' }],
				remember: 'numel = hasil kali dari shape; reshape mempertahankan numel.'
			},
			{
				title: 'device',
				body: [
					'Sebuah tensor juga tahu **di mana** angka-angkanya disimpan: `t.device`. Tensor baru berada di CPU. `t.to("cuda")` menyalin data ke memori GPU sendiri, tempat operasi bisa berjalan jauh lebih cepat.',
					'ArrayLab berjalan di CPU-mu, di dalam browser, dan tidak memiliki GPU — diagramnya hanyalah gambaran konseptual. Jalankan notebook-nya di Colab dengan runtime GPU untuk mencobanya secara nyata.'
				],
				remember: 'Semua tensor dalam satu operasi harus berada pada device yang sama.'
			}
		]
	},
	autograd: {
		title: 'Autograd',
		summary: 'requires_grad, graf komputasi, backward, dan gradien.',
		topics: ['requires_grad', 'Komputasi forward', 'Graf komputasi', 'backward', 'Gradien'],
		steps: [
			{
				title: 'requires_grad',
				body: [
					'Melatih sebuah model berarti bertanya: bagaimana seharusnya setiap weight berubah agar loss mengecil? **Autograd** menjawab itu secara otomatis.',
					'Kamu menandai tensor yang ingin kamu ambil gradiennya dengan `requires_grad=True`. Di sini weight `w` dan bias `b` dilacak; input `x` dan target `y` hanyalah data.'
				],
				tasks: [{ text: 'Lacak `x` juga' }, { text: 'Jangan lacak apa pun' }]
			},
			{
				title: 'Komputasi forward',
				body: [
					'Forward pass menghitung loss satu operasi pada satu waktu: `m = w * x`, `pred = m + b`, `diff = pred - y`, `loss = diff ** 2`.',
					'Tekan **Animasikan forward**, lalu ubah nilai sebuah leaf: semua yang ada di bawahnya (downstream) ikut diperbarui.'
				],
				tasks: [{ text: 'Buat prediksinya tepat: b = 4' }, { text: 'Input yang berbeda: x = 5' }]
			},
			{
				title: 'Graf komputasi',
				body: [
					'Saat menghitung, PyTorch mencatat bagaimana setiap hasil yang dilacak dibuat — `grad_fn`-nya: `MulBackward0`, `AddBackward0`, `SubBackward0`, `PowBackward0`. Bersama-sama, catatan-catatan ini adalah **graf komputasi**.',
					'Leaf tidak memiliki `grad_fn`. Bagian yang tidak bergantung pada leaf yang dilacak (digambar putus-putus) sama sekali tidak dicatat.'
				],
				tasks: [{ text: 'Lacak hanya `b`' }, { text: 'Jangan lacak apa pun: tidak ada graf' }]
			},
			{
				title: 'backward',
				body: [
					'`loss.backward()` menyusuri graf ke belakang. Setiap node mengalikan gradien yang diterimanya dengan **turunan lokalnya** lalu meneruskan hasil kalinya — aturan rantai (chain rule).',
					'Tekan **Animasikan backward** dan ikuti daftar di bawah graf: setiap faktor dituliskan.'
				],
				tasks: [{ text: 'Ubah x menjadi 5' }, { text: 'Lacak `x` juga' }]
			},
			{
				title: 'Gradien',
				body: [
					'Setelah `backward()`, setiap leaf yang dilacak memiliki `.grad`: seberapa cepat loss berubah saat leaf itu bertambah. `w.grad` yang negatif berarti menambah `w` akan menurunkan loss.',
					'Gradient descent melangkah berlawanan arah gradien: `w ← w − lr · w.grad`. Tekan **Ambil satu langkah** beberapa kali dan lihat loss-nya mengecil.'
				],
				tasks: [
					{ text: 'Langkah yang terlalu besar: lr = 0.25 (lalu ambil beberapa langkah)' },
					{ text: 'Kembali ke lr = 0.05' }
				],
				remember: '`backward()` mengisi `.grad`; sebuah optimizer menggunakan `.grad` untuk memperbarui weight.'
			}
		]
	},
	'numpy-to-pandas': {
		title: 'NumPy → pandas',
		summary: 'DataFrame adalah array dengan label: dtype per kolom, axis, loc vs iloc, alignment.',
		topics: ['DataFrame = array + label', 'dtype per kolom', 'axis di pandas', 'loc vs iloc', 'Alignment vs broadcasting'],
		steps: [
			{
				title: 'DataFrame = array + label',
				body: [
					'Sebuah **DataFrame** pandas adalah array 2-D dengan **label**: `df.index` menamai baris, `df.columns` menamai kolom. Nilai-nilainya adalah ndarray yang sudah kamu kenal — `df.to_numpy()` mengembalikannya.',
					'Ubah label-labelnya, atau angka-angka di atas. pandas berjalan sungguhan di sini (diunduh sekali, ± 5 MB).'
				],
				tasks: [
					{ text: 'Beri label siswa dan mata pelajaran' },
					{ text: 'Tanpa label: pandas menomorinya 0, 1, 2 …' },
					{ text: 'Array 1-D menjadi satu kolom' },
					{ text: 'Copy-on-Write: ubah kolom yang sudah kamu ambil' }
				],
				remember: 'DataFrame = nilai 2-D + label baris (index) + label kolom (columns).'
			},
			{
				title: 'dtype per kolom',
				body: [
					'Sebuah ndarray memiliki **satu** dtype. Sebuah DataFrame memiliki **satu dtype per kolom** — teks, integer, float, dan boolean berdampingan. Setiap kolom disimpan sebagai array 1-D-nya sendiri.',
					'Nilai yang hilang mengubah dtype: masukkan `None` ke sebuah kolom dan perhatikan dtype-nya serta array-array di bawah.'
				],
				tasks: [
					{ text: 'Usia yang hilang: int64 → float64' },
					{ text: 'Boolean yang hilang: bool → object' },
					{ text: 'Nama yang hilang: str tetap str' }
				],
				remember: 'Integer tidak bisa menampung NaN, sehingga satu nilai yang hilang mengubah kolom int menjadi float64.'
			},
			{
				title: 'axis di pandas',
				body: [
					'`df.sum(axis=0)` meruntuhkan axis 0 — aturan yang sama seperti `np.sum(a, axis=0)`. Untuk sebuah DataFrame itu berarti satu nilai **per kolom**; `axis=1` memberi satu nilai **per baris**.',
					'Dua perbedaan dari NumPy: hasilnya adalah sebuah **Series yang mempertahankan label**, dan nilai yang hilang (`NaN`) **dilewati**.'
				],
				tasks: [
					{ text: 'axis=1: satu nilai per baris' },
					{ text: 'mean' },
					{ text: 'Tambahkan sebuah NaN — pandas melewatinya, NumPy tidak' }
				],
				remember: 'Aturan axis yang sama seperti NumPy; hasilnya mempertahankan label dan NaN dilewati (skipna=True).'
			},
			{
				title: 'loc vs iloc',
				body: [
					'`df.loc[…]` memilih berdasarkan **label**; `df.iloc[…]` memilih berdasarkan **posisi**, persis seperti indexing NumPy. Baris dulu, baru kolom. Klik sebuah nilai untuk memilihnya.',
					"Perhatikan slice-nya: slice **label** menyertakan ujungnya, slice **posisi** tidak menyertakannya. Dan `df['B']` biasa memilih sebuah **kolom** — di NumPy, `a[1]` memilih sebuah baris."
				],
				tasks: [
					{ text: 'Nilai yang sama lewat posisi' },
					{ text: "Slice label 'r0':'r1' menyertakan r1" },
					{ text: 'Slice posisi 0:1 berhenti sebelum 1' },
					{ text: "df['B'] adalah sebuah kolom" },
					{ text: 'Baris berlabel 10, 20, 30: loc[10] vs iloc[0]' },
					{ text: 'Sebuah label yang tidak ada' }
				],
				remember: '.loc: label, ujung disertakan. .iloc: posisi, ujung tidak disertakan — seperti NumPy.'
			},
			{
				title: 'Alignment vs broadcasting',
				body: [
					'NumPy menggabungkan array **berdasarkan posisi** (dan melakukan broadcast pada shape). pandas terlebih dulu **menyelaraskan berdasarkan label**: `s1 + s2` menjumlahkan nilai-nilai yang labelnya cocok, di mana pun posisinya.',
					'Sebuah label yang hanya ada pada satu sisi mendapat `NaN` — pandas tidak akan diam-diam memasangkannya dengan yang lain.'
				],
				tasks: [
					{ text: 'Label yang sama, urutan diacak' },
					{ text: 'Tentukan arti “hilang”: fill_value=0' },
					{ text: 'Panjang berbeda: NumPy menyerah, pandas menyelaraskan' }
				],
				remember: 'NumPy memasangkan berdasarkan posisi, pandas berdasarkan label. Label yang tidak cocok menghasilkan NaN.'
			}
		]
	}
};
