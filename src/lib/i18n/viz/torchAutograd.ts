import { lang } from '../lang.svelte';

/**
 * Indonesian/English copy for TorchView.svelte, TorchCode.svelte and AutogradView.svelte.
 * Kept in its own file (rather than strings.ts) so this translation work stays isolated
 * from other files being translated in parallel. Same shape as strings.ts's dictionary:
 * plain values for static copy, functions for interpolated copy.
 */

const en = {
	torch: {
		viewLabels: {
			tensor: 'ndarray vs Tensor',
			convert: 'Convert',
			ops: 'Operations',
			create: 'Create',
			device: 'Device'
		},
		viewAria: 'PyTorch view',
		runInColab: 'Run the PyTorch side in Colab',
		honestNote: (version: string) => ({
			strong: 'NumPy runs here for real; PyTorch does not run in the browser.',
			rest: `PyTorch code is shown next to it, and every PyTorch result stated here (dtypes, errors) was recorded with PyTorch ${version}.`
		}),
		npRuns: 'NumPy ndarray · runs here',
		tensorCaption: 't — the same numbers as a PyTorch Tensor',
		sameValues: 'Same values, same shape, same axes: a tensor is PyTorch’s n-dimensional array.',
		colNumpyLive: 'NumPy',
		live: '(live)',
		colTorchRecorded: 'PyTorch',
		recorded: '(recorded)',
		thisStep: 'this step',
		rowLabels: {
			shape: 'shape',
			ndim: 'ndim',
			elements: 'elements',
			dtype: 'dtype',
			bytesPerElement: 'bytes / element',
			device: 'device',
			gradients: 'gradients'
		},
		alwaysCpu: 'always CPU memory',
		notTracked: 'not tracked',
		whatDiffers: 'What differs',
		sameTypedDifferentDtype: (npDtype: string, torchDtype: string) =>
			`Same typed numbers, different dtype: NumPy made ${npDtype}, PyTorch makes ${torchDtype}.`,
		float32Note: (float: string) =>
			`PyTorch's default float is float32 (${float}); NumPy's is float64. Deep learning rarely needs float64 precision, and float32 is half the memory and much faster on GPUs.`,
		intAlwaysInt64: 'From Python integers PyTorch always makes int64.',
		complexNote: 'From Python complex numbers PyTorch makes complex64 (two float32s); NumPy makes complex128.',
		agreeDtype: (npDtype: string, torchDtype: string) => `Here both libraries agree on the dtype: ${npDtype} ↔ ${torchDtype}.`,
		int32DesktopNote:
			"NumPy's int32 is specific to this browser (32-bit WebAssembly). Desktop NumPy on a 64-bit system makes int64 — the same as PyTorch.",
		shapeIsTorchSize:
			'The shape is a torch.Size, which is a tuple (t.shape[0], t.size(1) and unpacking all work). numel() is NumPy’s size — in PyTorch, t.size() means the shape.',
		shareMemoryAria: 'a and t share one block of memory',
		oneSharedBlock: (bytes: string) => (bytes ? `one shared block · ${bytes}` : 'one shared block'),
		sharesMemoryWith: 'Shares memory',
		withA: 'with a: change a[0, 0] and t changes too. dtype is kept:',
		likeNumpyView: 'Like a NumPy view (chapter 08): two names, one block of numbers.',
		separateMemoryAria: 'a and t have separate memory',
		block1: 'block 1',
		block2Copy: 'block 2 (copy)',
		copiesTheData: 'Copies',
		copiesTheDataRest: 'the data: later changes to a do not reach t.',
		fromListNote: (int: string, float: string) =>
			`From a Python list PyTorch picks its own dtype (${int} for integers, ${float} for floats). From an ndarray it keeps the array's dtype.`,
		shareMemoryAria2: 't and the new array share memory',
		backToNumpy: 'Back to NumPy, again',
		sharingMemory: 'sharing memory',
		worksOnlyCpu: 'Works only for CPU tensors.',
		detachFirst: 'A tensor that requires grad must be detached first — otherwise PyTorch raises',
		useDetach: 'Use t.detach().numpy().',
		tryItWithPytorch: 'Try it with PyTorch',
		indexingNote: (ndim: number, alt: string) => `The snippet indexes with [0, 0]; with a ${ndim}-D array use ${alt}.`,
		a2dArray: 'a 2-D array',
		nIndices: (n: number) => `${n} indices`,
		operationAria: 'Operation',
		numpyRunsHere: 'NumPy · runs here',
		sameInPytorch: 'The same in PyTorch',
		numpyRaised: (type: string, message: string) => `NumPy raised ${type}: ${message}`,
		pytorchRaises: 'PyTorch raises',
		pytorchResultRecorded: 'PyTorch result',
		sameValuesShapeDtype: (shape: string, dtype: string) => `same values · shape ${shape} · dtype ${dtype}`,
		dtypeDiffers: (npDtype: string) => `dtype differs: NumPy gave ${npDtype}`,
		note: 'Note',
		creationFunctionAria: 'Creation function',
		randomNote: (torchCall: string) =>
			`Random values come from NumPy's generator. ${torchCall} draws different numbers — only the shape and dtype carry over.`,
		numpyHere: (dtype: string, desktop: string) => `· NumPy here: ${dtype}${desktop}`,
		desktopSuffix: (dtype: string) => ` (desktop: ${dtype})`,
		defaults: 'Defaults',
		floatDefaultNote: (defaultFloat: string) =>
			`PyTorch creates floating-point tensors as float32 by default (torch.get_default_dtype() → ${defaultFloat}); NumPy uses float64. Integer tensors are int64.`,
		sizesNote: 'PyTorch takes sizes as separate numbers (torch.zeros(2, 3)) or a tuple (torch.zeros((2, 3))); NumPy needs the tuple.',
		pickACreationFunction: 'Pick a creation function to see the tensor it makes.',
		devicesAria: "Where a tensor's numbers are stored",
		cpuTitle: 'CPU',
		cpuSub: '· main memory (RAM)',
		cpuBody: 'Where every tensor starts, and where NumPy arrays always live. ArrayLab runs everything here, in your browser.',
		gpuTitle: 'GPU',
		gpuSub: '· its own memory',
		gpuBody:
			'Only with an NVIDIA GPU (cuda) or an Apple-silicon Mac (mps). Not available in ArrayLab — nothing here pretends to be a GPU.',
		movingATensor: 'Moving a tensor',
		rulesOfThumb: 'Rules of thumb',
		rule1: '.to(device) returns a copy on the other device; the original stays where it was.',
		rule2: 'Tensors in one operation must be on the same device; mixing CPU and GPU tensors raises a RuntimeError.',
		rule3: 'NumPy only understands CPU memory: move back with .cpu() before .numpy().',
		rule4: 'In Colab: Runtime → Change runtime type → GPU, then torch.cuda.is_available() returns True.'
	},
	torchCode: {
		defaultTitle: 'PyTorch',
		notRunHere: 'not run here',
		notRunTitle: 'PyTorch does not run in the browser. Copy the code or open the Colab notebook to run it.',
		copyAria: 'Copy PyTorch code'
	},
	autograd: {
		leaves: 'Leaves',
		valueOf: (name: string, role: string) => `value of ${name} (${role})`,
		direction: 'Direction',
		forward: 'Forward',
		backward: 'Backward',
		stop: 'Stop',
		animateForward: 'Animate forward',
		animateBackward: 'Animate backward',
		graphAria: (backward: boolean) =>
			`Computational graph: m = w times x, pred = m plus b, diff = pred minus y, loss = diff squared. ${
				backward ? 'Gradients flow from loss back to the leaves.' : 'Values flow from the leaves to loss.'
			}`,
		trackedByAutograd: 'tracked by autograd',
		notTracked: 'not tracked',
		localDerivativeNote: 'on an edge = local derivative (chain-rule factor)',
		noGradFn: 'no grad_fn',
		forwardTitle: 'Forward: compute the loss',
		records: 'records',
		everyOpRemembers:
			'Every operation on a tensor that requires grad remembers how it was made (its grad_fn) — that record is the computational graph. Leaves have grad_fn = None.',
		backwardTitle: 'Backward: the chain rule, from loss to the leaves',
		lossGradStarts: 'loss.grad starts at',
		result: 'Result:',
		noGradient: 'Leaves without requires_grad get no gradient.',
		useTheGradients: 'Use the gradients',
		gradientSaysHow:
			'A gradient says how loss changes when a leaf grows. Stepping against it lowers the loss: w ← w − lr · w.grad.',
		learningRateAria: 'learning rate',
		takeAStep: 'Take a step',
		lossArrow: (before: string, after: string) => `loss ${before} → ${after}`,
		accumulatesNote: (before: string | number, after: string | number) =>
			`Real PyTorch adds new gradients to .grad on every backward() (e.g. w.grad goes ${before} → ${after} in the default example), so training loops reset them with optimizer.zero_grad().`,
		noLeafRequiresGrad: (err: string) =>
			`No leaf requires grad, so PyTorch records no graph and loss.backward() fails with ${err}. Tick requires_grad on w or b.`,
		sameInPytorch: 'The same in PyTorch',
		computesWithNumpy: (version: string) =>
			`ArrayLab computes these numbers with NumPy in float32, writing out the chain rule that loss.backward() applies (see Code that ran). The grad_fn names and error messages were recorded with PyTorch ${version}.`,
		runInColab: 'Run it with real PyTorch in Colab'
	}
};

const id: typeof en = {
	torch: {
		viewLabels: {
			tensor: 'ndarray vs Tensor',
			convert: 'Konversi',
			ops: 'Operasi',
			create: 'Buat',
			device: 'Device'
		},
		viewAria: 'Tampilan PyTorch',
		runInColab: 'Jalankan sisi PyTorch di Colab',
		honestNote: (version: string) => ({
			strong: 'NumPy berjalan sungguhan di sini; PyTorch tidak berjalan di browser.',
			rest: `Kode PyTorch ditampilkan di sampingnya, dan setiap hasil PyTorch yang dinyatakan di sini (dtype, error) direkam dengan PyTorch ${version}.`
		}),
		npRuns: 'ndarray NumPy · berjalan di sini',
		tensorCaption: 't — angka yang sama sebagai Tensor PyTorch',
		sameValues: 'Nilai sama, shape sama, axis sama: tensor adalah array n-dimensi milik PyTorch.',
		colNumpyLive: 'NumPy',
		live: '(langsung)',
		colTorchRecorded: 'PyTorch',
		recorded: '(rekaman)',
		thisStep: 'langkah ini',
		rowLabels: {
			shape: 'shape',
			ndim: 'ndim',
			elements: 'elemen',
			dtype: 'dtype',
			bytesPerElement: 'byte / elemen',
			device: 'device',
			gradients: 'gradien'
		},
		alwaysCpu: 'selalu di memori CPU',
		notTracked: 'tidak dilacak',
		whatDiffers: 'Apa yang berbeda',
		sameTypedDifferentDtype: (npDtype: string, torchDtype: string) =>
			`Angka yang diketik sama, dtype berbeda: NumPy membuat ${npDtype}, PyTorch membuat ${torchDtype}.`,
		float32Note: (float: string) =>
			`Float bawaan PyTorch adalah float32 (${float}); NumPy adalah float64. Deep learning jarang membutuhkan presisi float64, dan float32 setengah dari memorinya serta jauh lebih cepat di GPU.`,
		intAlwaysInt64: 'Dari integer Python, PyTorch selalu membuat int64.',
		complexNote: 'Dari bilangan kompleks Python, PyTorch membuat complex64 (dua float32); NumPy membuat complex128.',
		agreeDtype: (npDtype: string, torchDtype: string) => `Di sini kedua library sepakat soal dtype-nya: ${npDtype} ↔ ${torchDtype}.`,
		int32DesktopNote:
			'int32 milik NumPy khusus untuk browser ini (WebAssembly 32-bit). NumPy desktop pada sistem 64-bit membuat int64 — sama seperti PyTorch.',
		shapeIsTorchSize:
			'shape-nya adalah torch.Size, yang merupakan sebuah tuple (t.shape[0], t.size(1), dan unpacking semuanya berfungsi). numel() adalah size-nya NumPy — di PyTorch, t.size() berarti shape.',
		shareMemoryAria: 'a dan t berbagi satu blok memori',
		oneSharedBlock: (bytes: string) => (bytes ? `satu blok bersama · ${bytes}` : 'satu blok bersama'),
		sharesMemoryWith: 'Berbagi memori',
		withA: 'dengan a: ubah a[0, 0] dan t ikut berubah. dtype-nya tetap dipertahankan:',
		likeNumpyView: 'Seperti view NumPy (bab 08): dua nama, satu blok angka.',
		separateMemoryAria: 'a dan t memiliki memori terpisah',
		block1: 'blok 1',
		block2Copy: 'blok 2 (copy)',
		copiesTheData: 'Menyalin',
		copiesTheDataRest: 'datanya: perubahan pada a nantinya tidak sampai ke t.',
		fromListNote: (int: string, float: string) =>
			`Dari sebuah list Python, PyTorch memilih dtype-nya sendiri (${int} untuk integer, ${float} untuk desimal). Dari sebuah ndarray, ia mempertahankan dtype array-nya.`,
		shareMemoryAria2: 't dan array baru berbagi memori',
		backToNumpy: 'Kembali ke NumPy, lagi-lagi',
		sharingMemory: 'berbagi memori',
		worksOnlyCpu: 'Hanya berfungsi untuk tensor CPU.',
		detachFirst: 'Tensor yang membutuhkan grad harus di-detach dulu — jika tidak, PyTorch memunculkan',
		useDetach: 'Gunakan t.detach().numpy().',
		tryItWithPytorch: 'Coba dengan PyTorch',
		indexingNote: (ndim: number, alt: string) => `Cuplikan ini mengindeks dengan [0, 0]; untuk array ${ndim}-D gunakan ${alt}.`,
		a2dArray: 'array 2-D',
		nIndices: (n: number) => `${n} indeks`,
		operationAria: 'Operasi',
		numpyRunsHere: 'NumPy · berjalan di sini',
		sameInPytorch: 'Hal yang sama di PyTorch',
		numpyRaised: (type: string, message: string) => `NumPy memunculkan ${type}: ${message}`,
		pytorchRaises: 'PyTorch memunculkan',
		pytorchResultRecorded: 'Hasil PyTorch',
		sameValuesShapeDtype: (shape: string, dtype: string) => `nilai sama · shape ${shape} · dtype ${dtype}`,
		dtypeDiffers: (npDtype: string) => `dtype berbeda: NumPy memberi ${npDtype}`,
		note: 'Catatan',
		creationFunctionAria: 'Fungsi pembuatan',
		randomNote: (torchCall: string) =>
			`Nilai acak berasal dari generator NumPy. ${torchCall} mengambil angka yang berbeda — hanya shape dan dtype yang ikut terbawa.`,
		numpyHere: (dtype: string, desktop: string) => `· NumPy di sini: ${dtype}${desktop}`,
		desktopSuffix: (dtype: string) => ` (desktop: ${dtype})`,
		defaults: 'Nilai bawaan',
		floatDefaultNote: (defaultFloat: string) =>
			`PyTorch membuat tensor bilangan desimal sebagai float32 secara bawaan (torch.get_default_dtype() → ${defaultFloat}); NumPy menggunakan float64. Tensor integer adalah int64.`,
		sizesNote: 'PyTorch menerima ukuran sebagai angka terpisah (torch.zeros(2, 3)) atau sebuah tuple (torch.zeros((2, 3))); NumPy membutuhkan tuple.',
		pickACreationFunction: 'Pilih sebuah fungsi pembuatan untuk melihat tensor yang dihasilkannya.',
		devicesAria: 'Tempat angka-angka tensor disimpan',
		cpuTitle: 'CPU',
		cpuSub: '· memori utama (RAM)',
		cpuBody: 'Tempat setiap tensor memulai, dan tempat array NumPy selalu berada. ArrayLab menjalankan semuanya di sini, di browsermu.',
		gpuTitle: 'GPU',
		gpuSub: '· memorinya sendiri',
		gpuBody:
			'Hanya dengan GPU NVIDIA (cuda) atau Mac Apple-silicon (mps). Tidak tersedia di ArrayLab — tidak ada apa pun di sini yang berpura-pura menjadi GPU.',
		movingATensor: 'Memindahkan sebuah tensor',
		rulesOfThumb: 'Aturan praktis',
		rule1: '.to(device) mengembalikan sebuah copy pada device lain; yang asli tetap di tempatnya.',
		rule2: 'Tensor dalam satu operasi harus berada pada device yang sama; mencampur tensor CPU dan GPU memunculkan RuntimeError.',
		rule3: 'NumPy hanya memahami memori CPU: pindahkan kembali dengan .cpu() sebelum .numpy().',
		rule4: 'Di Colab: Runtime → Change runtime type → GPU, lalu torch.cuda.is_available() mengembalikan True.'
	},
	torchCode: {
		defaultTitle: 'PyTorch',
		notRunHere: 'tidak dijalankan di sini',
		notRunTitle: 'PyTorch tidak berjalan di browser. Salin kodenya atau buka notebook Colab untuk menjalankannya.',
		copyAria: 'Salin kode PyTorch'
	},
	autograd: {
		leaves: 'Leaf',
		valueOf: (name: string, role: string) => `nilai ${name} (${role})`,
		direction: 'Arah',
		forward: 'Forward',
		backward: 'Backward',
		stop: 'Hentikan',
		animateForward: 'Animasikan forward',
		animateBackward: 'Animasikan backward',
		graphAria: (backward: boolean) =>
			`Graf komputasi: m = w kali x, pred = m plus b, diff = pred minus y, loss = diff kuadrat. ${
				backward ? 'Gradien mengalir dari loss kembali ke leaf.' : 'Nilai mengalir dari leaf ke loss.'
			}`,
		trackedByAutograd: 'dilacak oleh autograd',
		notTracked: 'tidak dilacak',
		localDerivativeNote: 'pada sebuah edge = turunan lokal (faktor chain rule)',
		noGradFn: 'tanpa grad_fn',
		forwardTitle: 'Forward: menghitung loss',
		records: 'mencatat',
		everyOpRemembers:
			'Setiap operasi pada tensor yang membutuhkan grad mengingat bagaimana ia dibuat (grad_fn-nya) — catatan itulah graf komputasi. Leaf memiliki grad_fn = None.',
		backwardTitle: 'Backward: chain rule, dari loss ke leaf',
		lossGradStarts: 'loss.grad dimulai pada',
		result: 'Hasil:',
		noGradient: 'Leaf tanpa requires_grad tidak mendapat gradien.',
		useTheGradients: 'Menggunakan gradien',
		gradientSaysHow:
			'Sebuah gradien menyatakan bagaimana loss berubah saat sebuah leaf bertambah. Melangkah berlawanan arahnya menurunkan loss: w ← w − lr · w.grad.',
		learningRateAria: 'learning rate',
		takeAStep: 'Ambil satu langkah',
		lossArrow: (before: string, after: string) => `loss ${before} → ${after}`,
		accumulatesNote: (before: string | number, after: string | number) =>
			`PyTorch sungguhan menambahkan gradien baru ke .grad pada setiap backward() (mis. w.grad berubah dari ${before} → ${after} pada contoh bawaan), sehingga loop pelatihan mengatur ulang dengan optimizer.zero_grad().`,
		noLeafRequiresGrad: (err: string) =>
			`Tidak ada leaf yang membutuhkan grad, sehingga PyTorch tidak mencatat graf apa pun dan loss.backward() gagal dengan ${err}. Centang requires_grad pada w atau b.`,
		sameInPytorch: 'Hal yang sama di PyTorch',
		computesWithNumpy: (version: string) =>
			`ArrayLab menghitung angka-angka ini dengan NumPy dalam float32, menuliskan chain rule yang diterapkan loss.backward() (lihat Kode yang dijalankan). Nama grad_fn dan pesan error direkam dengan PyTorch ${version}.`,
		runInColab: 'Jalankan dengan PyTorch sungguhan di Colab'
	}
};

export function tTorch() {
	return lang.current === 'id' ? id.torch : en.torch;
}
export function tTorchCode() {
	return lang.current === 'id' ? id.torchCode : en.torchCode;
}
export function tAutograd() {
	return lang.current === 'id' ? id.autograd : en.autograd;
}
