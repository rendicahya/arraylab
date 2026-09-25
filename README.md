# ArrayLab

**Explore arrays. Understand tensors.**

ArrayLab is an interactive, frontend-only learning lab for NumPy arrays. Type numbers, watch them become a real
`np.ndarray`, and _see_ what NumPy does when you reduce along an axis, index, reshape, broadcast, vectorize or change a
dtype.

Live: <https://rendicahya.github.io/arraylab/>

## What's inside

- **Real NumPy in the browser.** Python + NumPy run in a Web Worker via [Pyodide](https://pyodide.org). Every value,
  shape, dtype, error message and view/copy flag comes from NumPy itself — nothing is simulated.
- **Visual tools** — Array, Axis (reductions), Index, Reshape, Broadcast, Vectorize, dtype and _Your code_ (free
  editor). Highlighting uses provenance maps: the same NumPy operation is applied to an array of element ids, so
  what's highlighted matches what NumPy actually selected or moved.
- **Inspector** with `shape`, `ndim`, `size`, `dtype`, `itemsize`, `nbytes` and memory layout.
- **Chapters 01–07** (ndarray → vectorization) with steps and one-click “Try this” experiments.
  Chapters 08–10 (PyTorch) are planned as phase 2: Pyodide doesn't ship PyTorch, and ArrayLab doesn't fake it.
- **Educational error messages** (broadcasting, reshape, index, axis, dtype overflow, …), always shown alongside the
  original Python error.
- Light/dark themes (system default, persisted override), a real Fullscreen API mode for classrooms, and a
  responsive layout.

> Note: Pyodide is 32-bit WebAssembly, so NumPy's default integer here is `int32`. Desktop NumPy 2 on 64-bit systems
> uses `int64`. ArrayLab points this out instead of hiding it.

## Development

```sh
npm install
npm run dev        # http://localhost:5173/arraylab/
npm run check      # svelte-check / TypeScript
npm test           # unit tests + real Pyodide/NumPy integration tests (downloads NumPy once)
npm run build      # static site in build/, base path /arraylab
npm run preview
```

The app is built for the GitHub Pages project path `/arraylab`. Set `BASE_PATH=''` to build for a domain root.

## Deployment

`.github/workflows/deploy.yml` type-checks, tests, builds and deploys to GitHub Pages on every push to `main`.
In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** (one-time).

## Structure

```text
src/lib/
  runtime/        Pyodide worker, executor (UI side), extractor.py (Python side), protocol types
  array/          normalized ArrayInfo types, literal parser, shape/index math, broadcasting rule, error explanations
  lab/            Lab state, code generation for each tool, step player
  visualization/  ArrayGrid, ShapeView, AxisView, IndexView, ReshapeView, BroadcastView, VectorizeView, DtypeView, …
  lessons/        chapter content (data only)
  components/     shell, inspector, code editor (CodeMirror 6), lesson panel, theme & fullscreen toggles
src/routes/       /, /lab/, /learn/[slug]/ — all prerendered
```

## License

MIT
