# ArrayLab

**Explore arrays. Understand tensors.**

ArrayLab is a free, interactive lab for learning how NumPy arrays work. Instead of reading about `shape`, `axis` or
broadcasting, you type a few numbers, watch them turn into a real NumPy array, and _see_ what each operation does to it.

### 👉 [Open ArrayLab](https://rendicahya.github.io/arraylab/)

It runs entirely in your browser. There's nothing to install, no account to create, and your code never leaves your
computer.

---

## Who is it for?

- **Students** learning NumPy for data science, machine learning, computer vision or deep learning, especially if
  `axis=0` or broadcasting has ever felt like magic.
- **Teachers** who want to demonstrate array concepts live in class. Fullscreen mode lets the lab fill the projector.
- **Anyone** who knows a little Python and wants a clearer mental picture of what NumPy is doing.

You don't need to write any code to get started.

## How to use it

1. **Type some numbers.** For example:

   ```text
   1 2 3
   4 5 6
   ```

   ArrayLab turns them into `np.array([[1, 2, 3], [4, 5, 6]])` and draws the array as a grid.

2. **Read the Inspector.** It shows the array's `shape`, `ndim`, `size`, `dtype`, `itemsize` and `nbytes`.

3. **Pick a tool and change things.** Switch the axis, edit an index, try a new shape. The picture updates right away,
   and the matching NumPy code is shown underneath so you can connect what you see with how you'd write it.

4. **Follow a chapter** if you'd like a guided path. Each step has small “Try this” experiments you can run with one
   click.

5. **Write your own code** in the editor when you're ready, then press **Run** (or <kbd>Ctrl</kbd>/<kbd>⌘</kbd> +
   <kbd>Enter</kbd>). Any arrays you create are visualized too.

## Tools

| Tool          | What you can explore                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| **Array**     | The array itself, its shape and which axis is which                                   |
| **Axis**      | `sum`, `mean`, `max`, `min`, `argmax` … along an axis, and which elements are combined |
| **Index**     | Single elements, rows, columns, slices, boolean masks and fancy indexing               |
| **Reshape**   | `reshape`, `transpose`, `flatten` and `ravel`, including whether you get a view or a copy |
| **Broadcast** | How two arrays of different shapes are lined up and stretched to fit together          |
| **Vectorize** | A Python loop compared side by side with the same operation done on the whole array   |
| **dtype**     | Converting between data types and what happens to the values and the memory           |
| **Your code** | Free-form NumPy code, with every array you create visualized                          |

## Chapters

| #   | Chapter                | You'll learn                                                                  |
| --- | ---------------------- | ----------------------------------------------------------------------------- |
| 01  | Meet the ndarray       | Creating 1-D, 2-D and higher-dimensional arrays; `shape`, `ndim` and `size`    |
| 02  | Shape                  | `reshape`, `flatten`, `ravel` and `transpose`                                  |
| 03  | Axis                   | What `axis=0` and `axis=1` really mean, and how reductions collapse an axis    |
| 04  | Indexing & Slicing     | Picking elements, rows, columns, ranges and masks                             |
| 05  | dtype                  | Integers, floats, booleans, conversion, overflow, `itemsize` and `nbytes`      |
| 06  | Broadcasting           | Aligning shapes from the right, compatible and incompatible shapes            |
| 07  | Vectorization          | Replacing Python loops with whole-array operations                            |
| 08  | NumPy → PyTorch        | _Coming soon_                                                                 |
| 09  | PyTorch Tensor         | _Coming soon_                                                                 |
| 10  | Autograd               | _Coming soon_                                                                 |

## Good to know

- **It's real NumPy.** ArrayLab runs actual Python and NumPy in your browser using [Pyodide](https://pyodide.org).
  Every value, shape, dtype and error message comes from NumPy itself. Nothing is simulated.
- **The first load takes a few seconds** while Python and NumPy download (several megabytes). After that your browser caches
  them, so later visits are faster.
- **Mistakes are part of learning.** When NumPy raises an error, ArrayLab explains it in plain language. For
  broadcasting errors, for example, it shows exactly which dimensions don't match. The original Python error is always
  shown too.
- **Integers are `int32` here.** The browser version of Python is 32-bit, so NumPy's default integer type is `int32`.
  On most desktop computers it's `int64`. ArrayLab points this out when it matters.
- **Big arrays are shown as a preview.** For very large arrays, ArrayLab shows part of the array and clearly says how
  much is hidden.
- **Light and dark themes.** ArrayLab follows your system setting, and you can switch with the button at the top right.
  Your choice is remembered.
- **PyTorch is coming later.** PyTorch doesn't run in the browser yet, so the PyTorch chapters are placeholders.
  ArrayLab won't pretend otherwise.
- **Browser support:** use an up-to-date browser. ArrayLab works on phones, but a laptop, desktop or tablet is
  more comfortable.

---

## For developers

ArrayLab is a static [SvelteKit](https://svelte.dev/docs/kit) site with no backend. Python runs in a Web Worker
through Pyodide, the editor is [CodeMirror 6](https://codemirror.net), and all visualizations are plain Svelte, HTML and
SVG.

```sh
npm install
npm run dev        # http://localhost:5173/arraylab/
npm run check      # svelte-check / TypeScript
npm test           # unit tests + real Pyodide/NumPy integration tests (downloads NumPy once)
npm run build      # static site in build/, base path /arraylab
npm run preview
```

The site is built for the GitHub Pages path `/arraylab`. Set `BASE_PATH=''` to build it for a domain root instead.

Every push to `main` type-checks, tests, builds and deploys the site to GitHub Pages
(`.github/workflows/deploy.yml`).

```text
src/lib/
  runtime/        Pyodide worker, executor (UI side), extractor.py (Python side), protocol types
  array/          normalized ArrayInfo types, literal parser, shape/index math, broadcasting rule, error explanations
  lab/            Lab state, code generation for each tool, step player
  visualization/  ArrayGrid, ShapeView, AxisView, IndexView, ReshapeView, BroadcastView, VectorizeView, DtypeView, …
  lessons/        chapter content (data only)
  components/     shell, inspector, code editor, lesson panel, theme & fullscreen toggles
src/routes/       /, /lab/, /learn/[slug]/ (all prerendered)
```

Highlighting is based on what NumPy actually did. ArrayLab applies the same operation to an array of element ids, so
the highlighted cells always match what NumPy selected or moved.

## License

[MIT](LICENSE)
