# ArrayLab

ArrayLab is a frontend-only interactive learning environment for understanding NumPy arrays and PyTorch tensors through direct manipulation, visualization, and executable code.

Repository:

```text
git@github.com:rendicahya/arraylab.git
```

Production deployment:

```text
https://rendicahya.github.io/arraylab/
```

The primary goal is **conceptual understanding through interaction**, not merely providing a Python REPL.

Users should be able to enter numbers, immediately see them represented as arrays/tensors, inspect their properties, perform operations, and visually understand what NumPy/PyTorch is doing.

---

# Core Philosophy

ArrayLab follows these principles:

1. **Visual first**

   * Arrays and tensors are visual objects.
   * Whenever possible, show the structure of an operation visually.
   * Do not rely solely on textual output.

2. **Concept before syntax**

   * Users should be able to explore arrays without knowing much Python.
   * Python/NumPy code should reinforce the visual concept rather than be a prerequisite.

3. **Learn by manipulation**

   * Users should be able to change values, dimensions, shapes, axes, and operations and immediately see the result.

4. **Real NumPy/PyTorch semantics**

   * Do not implement fake or simplified NumPy semantics when the real library can be used.
   * Explanations and visualizations must correspond to actual behavior.

5. **Progressive learning**

   * Start with ndarray fundamentals.
   * Gradually introduce more advanced concepts.
   * PyTorch should build naturally on the user's understanding of NumPy.

6. **Keep the interface approachable**

   * Avoid making ArrayLab look like a complicated IDE.
   * The application is a learning laboratory, not a general-purpose development environment.

---

# Product Identity

Product name:

```text
ArrayLab
```

Suggested tagline:

```text
Explore arrays. Understand tensors.
```

ArrayLab should feel like an interactive laboratory rather than a conventional coding IDE.

The visual identity should communicate:

* numerical computing
* experimentation
* exploration
* clarity
* technical sophistication
* education

---

# Target Audience

Primary users are students learning numerical computing, machine learning, computer vision, and deep learning.

The initial educational progression is:

```text
Python basics needed for NumPy
        ↓
NumPy ndarray
        ↓
shape / ndim / size
        ↓
axis
        ↓
indexing & slicing
        ↓
dtype
        ↓
reshape / transpose
        ↓
broadcasting
        ↓
vectorization
        ↓
NumPy ↔ PyTorch
        ↓
PyTorch Tensor
        ↓
device / CPU / GPU
        ↓
autograd
        ↓
computational graph
```

Do not introduce advanced concepts prematurely.

---

# Technology Direction

ArrayLab is a static frontend application intended to be deployed on GitHub Pages.

Preferred stack:

* SvelteKit
* TypeScript
* static adapter
* Pyodide for executing Python and NumPy in the browser
* CodeMirror or another appropriate browser-based code editor
* SVG/HTML Canvas/CSS for visualizations when appropriate
* PyTorch browser-compatible technology may be introduced later

The application must remain frontend-only unless explicitly decided otherwise.

Do not introduce:

* backend servers
* database
* authentication
* server API
* cloud infrastructure

unless explicitly requested.

---

# GitHub Pages Deployment

The repository is:

```text
git@github.com:rendicahya/arraylab.git
```

The application is deployed as a GitHub Pages project site:

```text
https://rendicahya.github.io/arraylab/
```

The repository name is:

```text
arraylab
```

Therefore the application must be configured with the appropriate base path:

```text
/arraylab/
```

All routing and static asset handling must work correctly when the application is hosted under:

```text
https://rendicahya.github.io/arraylab/
```

and NOT only when hosted at the domain root.

Be particularly careful with:

* SvelteKit `paths.base`
* asset URLs
* favicon paths
* dynamically loaded assets
* Pyodide assets
* CodeMirror assets if applicable
* client-side navigation
* deep links
* GitHub Pages static deployment

Do not hardcode:

```text
/
```

as the application root when constructing application asset URLs.

Use SvelteKit's path/base mechanisms appropriately.

---

# Static Deployment Requirements

The production application must work without a server.

Do not rely on:

* server-side rendering that requires a runtime server
* server endpoints
* server-only modules
* runtime secrets
* server filesystem
* server sessions
* API routes

The final build should produce static assets suitable for GitHub Pages.

Always test the production build before considering deployment work complete.

---

# Application Shell

The application should have a persistent, minimal application shell.

Conceptually:

```text
┌──────────────────────────────────────────────────────────┐
│ ArrayLab                              🌙  ⛶              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                     Application                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

The top-level UI should contain:

* ArrayLab branding
* dark/light mode toggle
* fullscreen toggle

Additional navigation controls may be added later.

Do not clutter the top bar.

---

# Dark / Light Mode

ArrayLab must provide a visible toggle for:

```text
☀ Light
🌙 Dark
```

The exact iconography can be implemented with an appropriate icon library or simple SVG.

Requirements:

* Both themes must be designed intentionally.
* Do not merely invert colors.
* Text must remain readable.
* Code editor must match the active theme where supported.
* Array visualizations must remain understandable in both themes.
* Borders and grid lines must remain visible in both themes.
* Highlighted axes/cells must not depend on color alone.
* The selected theme should persist across page reloads.

Prefer:

```text
system preference
        ↓
initial theme
        ↓
user can override
        ↓
persist preference
```

Use browser APIs such as `prefers-color-scheme` where appropriate.

Avoid flash of the wrong theme during initial page load when practical.

Do not add a heavy theme-management dependency unless it provides substantial value.

---

# Fullscreen Mode

ArrayLab must provide a fullscreen toggle.

Purpose:

The application is intended for both individual learning and classroom demonstrations. Fullscreen mode should allow the interactive playground to occupy the entire browser viewport.

The control should clearly communicate:

```text
Enter fullscreen
Exit fullscreen
```

Use the browser Fullscreen API when available:

```ts
document.documentElement.requestFullscreen()
```

and:

```ts
document.exitFullscreen()
```

Handle browsers where fullscreen is unavailable.

The UI should react to fullscreen state changes, including cases where the user exits fullscreen using the browser/OS controls.

Do not fake fullscreen by merely changing CSS dimensions when the browser Fullscreen API is available.

The application should remain usable in fullscreen mode:

* preserve the main navigation/header
* keep important controls accessible
* avoid unnecessary browser-like chrome
* make the visualization area take advantage of available space

---

# Responsive Layout

Desktop is the primary target because ArrayLab will often be used in teaching and demonstrations.

The application should nevertheless remain usable on smaller screens.

Suggested desktop layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Header                                                   │
├───────────────┬──────────────────────────┬───────────────┤
│               │                          │               │
│ Lesson /      │ Array Visualization      │ Inspector     │
│ Controls      │                          │               │
│               │                          │               │
├───────────────┴──────────────────────────┴───────────────┤
│ Code / Operations / Explanation                           │
└──────────────────────────────────────────────────────────┘
```

Do not force this exact layout if usability testing suggests a better arrangement.

On smaller screens, panels may stack.

---

# Execution Architecture

Conceptually:

```text
User
 │
 ├── Visual Array Input
 │
 └── Python Code
        │
        ▼
┌─────────────────────┐
│ Python Runtime      │
│                     │
│ Pyodide             │
│ + NumPy             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Execution / State   │
│ Extraction Layer    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Array/Tensor Model  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Svelte UI           │
│                     │
│ ArrayGrid           │
│ Inspector           │
│ Shape View          │
│ Axis View           │
│ Broadcast View      │
│ etc.                │
└─────────────────────┘
```

Keep computation and visualization separate.

The visualization layer should not need to know how Python execution works.

The execution layer should not contain UI-specific rendering logic.

---

# Project Structure

Prefer a structure similar to:

```text
src/
├── lib/
│   ├── runtime/
│   │   ├── pyodide.ts
│   │   ├── executor.ts
│   │   └── extractor.ts
│   │
│   ├── array/
│   │   ├── types.ts
│   │   ├── inspect.ts
│   │   └── normalize.ts
│   │
│   ├── visualization/
│   │   ├── ArrayGrid.svelte
│   │   ├── ShapeView.svelte
│   │   ├── AxisView.svelte
│   │   ├── BroadcastView.svelte
│   │   └── ...
│   │
│   ├── lessons/
│   │   ├── ndarray.ts
│   │   ├── shape.ts
│   │   ├── axis.ts
│   │   ├── indexing.ts
│   │   ├── dtype.ts
│   │   ├── broadcasting.ts
│   │   └── vectorization.ts
│   │
│   └── components/
│       ├── CodeEditor.svelte
│       ├── OutputPanel.svelte
│       ├── Inspector.svelte
│       ├── LessonPanel.svelte
│       ├── ThemeToggle.svelte
│       ├── FullscreenToggle.svelte
│       └── ...
│
└── routes/
    ├── +page.svelte
    └── playground/
        └── +page.svelte
```

This is a guideline, not a rigid requirement.

Prefer simple structures over premature abstraction.

---

# Array Data Model

The visualization layer should use a normalized representation of arrays rather than directly depending on Python objects.

At minimum:

```ts
type ArrayInfo = {
  name?: string;
  values: unknown;
  shape: number[];
  ndim: number;
  size: number;
  dtype?: string;
  itemsize?: number;
  nbytes?: number;
  backend: "numpy" | "torch";
};
```

For PyTorch:

```ts
type TensorInfo = ArrayInfo & {
  backend: "torch";
  device?: string;
  requiresGrad?: boolean;
  gradFn?: string | null;
};
```

Extend this model only when a real feature requires it.

Do not duplicate the entire NumPy/PyTorch object model in TypeScript.

---

# Input Experience

A key feature of ArrayLab is allowing users to create arrays without writing Python first.

For example:

```text
1 2 3
4 5 6
```

should immediately become:

```python
np.array([
    [1, 2, 3],
    [4, 5, 6]
])
```

and be visualized:

```text
┌───┬───┬───┐
│ 1 │ 2 │ 3 │
├───┼───┼───┤
│ 4 │ 5 │ 6 │
└───┴───┴───┘

shape = (2, 3)
ndim  = 2
size  = 6
```

This interaction is central to the application.

Do not force users into the code editor for basic exploration.

---

# Visualization Principles

Whenever an operation has a meaningful structural interpretation, visualize that structure.

## Shape

For:

```python
a.shape
```

show:

```text
shape = (2, 3, 4)

2 × 3 × 4
```

Explain which dimension corresponds to which structural level.

## Axis

For:

```python
np.sum(a, axis=0)
```

highlight the dimension being reduced.

For example:

```text
↓   ↓   ↓
1   2   3
4   5   6
```

Then show the resulting values.

The user should understand what `axis=0` means visually.

## Indexing

For:

```python
a[0, 1]
```

highlight the selected element.

For:

```python
a[:, 1]
```

highlight the selected column.

For:

```python
a[0, :]
```

highlight the selected row.

## Broadcasting

Broadcasting should be visualized as shape alignment and expansion.

Example:

```text
A: (2, 3)
B:    (3)
       ↓
B: (2, 3)
```

Then show the resulting element-wise operation.

Do not describe broadcasting only with prose.

## Vectorization

When comparing loops and vectorized operations, show the conceptual difference:

```text
loop:

1 → ×2 → 2
2 → ×2 → 4
3 → ×2 → 6

vectorized:

[1 2 3] × 2 → [2 4 6]
```

Do not imply that NumPy literally performs operations in exactly this visual sequence internally. The visualization is a conceptual model.

---

# Inspector

The Inspector is one of ArrayLab's central UI components.

For NumPy:

```text
shape       (2, 3)
ndim        2
size        6
dtype       int64
itemsize    8 bytes
nbytes      48 bytes
```

For PyTorch:

```text
shape          (2, 3)
ndim           2
numel          6
dtype          torch.int64
device         cpu
requires_grad  false
```

The Inspector should make properties easy to discover.

Avoid hiding important properties behind multiple layers of navigation.

---

# Educational Chapters

Initial chapters:

## 01 — Meet the ndarray

* Creating arrays
* 1D arrays
* 2D arrays
* Higher-dimensional arrays
* shape
* ndim
* size

## 02 — Shape

* Understanding shape
* reshape
* flatten
* ravel
* transpose

## 03 — Axis

* Axis 0
* Axis 1
* Higher-dimensional axes
* Reduction
* sum
* mean
* max
* min

## 04 — Indexing & Slicing

* Scalar indexing
* Row selection
* Column selection
* Slicing
* Boolean indexing

## 05 — dtype

* Integer
* Floating point
* Boolean
* dtype conversion
* itemsize
* nbytes

## 06 — Broadcasting

* Scalar broadcasting
* Vector broadcasting
* Shape alignment
* Compatible shapes
* Incompatible shapes

## 07 — Vectorization

* Python loops
* Element-wise operations
* NumPy ufuncs
* Vectorized thinking

## 08 — View vs copy

* b = a (no copy)
* Slices are views (strides)
* Fancy & boolean indexing copy
* reshape / T / ravel vs flatten
* When to copy

## 09 — Combining arrays

* concatenate
* Shapes that fit
* stack & np.newaxis
* split (returns views)

## 10 — NumPy → PyTorch

* ndarray vs Tensor
* Converting between them
* Similarities
* Differences

## 11 — PyTorch Tensor

* Tensor creation
* Shape
* dtype
* numel
* device

## 12 — Autograd

* requires_grad
* forward computation
* computational graph
* backward
* gradients

## 13 — NumPy → pandas

* DataFrame = 2-D array + labels (index, columns)
* dtype per column (missing values change dtypes)
* axis in pandas (labeled results, NaN skipped)
* loc vs iloc (labels vs positions, slice ends)
* alignment vs broadcasting

pandas runs for real in Pyodide (loaded lazily only when code imports it). Keep this chapter a bridge from NumPy;
do not grow it into a general pandas course (groupby, merge, I/O) unless explicitly requested.

---

# UX Guidelines

ArrayLab should feel like an interactive laboratory.

Prefer:

```text
Do something
      ↓
See result
      ↓
Inspect
      ↓
Understand
      ↓
Try again
```

over:

```text
Read explanation
      ↓
Click Next
      ↓
Read explanation
      ↓
Click Next
```

Use animations when they clarify structure.

Do not animate everything.

Animations should communicate concepts such as:

* axis reduction
* broadcasting
* reshape
* transpose
* indexing
* data movement
* computational graphs

Animations should be fast and interruptible.

---

# Visual Design

Desired visual character:

* clean
* modern
* technical
* educational
* calm
* minimal
* slightly playful

Avoid:

* excessive gradients
* excessive glassmorphism
* excessive animation
* dashboard-like complexity
* unnecessary cards everywhere
* visual noise

The array itself should remain the visual focus.

Use monospace typography for code and numerical representations.

---

# Dark / Light Theme Design

Maintain a semantic color system rather than scattering literal colors throughout components.

Prefer CSS variables such as:

```css
--background
--surface
--surface-elevated
--foreground
--muted
--border
--accent
--array-cell
--array-cell-highlight
--success
--error
```

Both light and dark themes should override these variables.

Do not use hardcoded colors throughout individual Svelte components.

This makes the theme consistent and easier to maintain.

---

# Fullscreen Design

Fullscreen should be treated as an application mode.

When fullscreen is active:

* maximize the visualization area
* retain essential controls
* retain dark/light toggle
* retain fullscreen exit control
* avoid unnecessary margins
* preserve readable typography
* allow array visualizations to use additional space

Do not create a separate fullscreen application implementation.

The same application should transition between normal and fullscreen modes.

---

# Code Editor

The code editor should support small NumPy examples.

Example:

```python
import numpy as np

a = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

a.shape
```

Execution should be explicit and predictable.

Use a Run action.

Do not automatically execute arbitrary user code on every keystroke.

Handle:

* syntax errors
* Python exceptions
* unsupported operations
* initialization/loading failures

with educational error messages where possible.

---

# Performance

Pyodide initialization may be relatively expensive.

Therefore:

* initialize lazily when appropriate
* show loading state
* avoid repeatedly initializing the Python runtime
* reuse the runtime
* consider a Web Worker if execution blocks the UI
* avoid serializing unnecessarily large arrays

ArrayLab is educational, so enormous arrays do not need to be fully rendered.

For large arrays, use sampling/truncation and clearly communicate that the visualization is partial.

Example:

```text
Array contains 1,000,000 elements.

Showing 20 × 20 preview.
```

Never pretend a truncated visualization represents the entire array.

---

# Accessibility

Important interactive information should not be communicated through color alone.

For example, if a column is highlighted:

* use color
* plus labels, borders, arrows, or textual explanation

Keyboard interaction should be supported where practical.

Interactive controls should have meaningful labels.

Theme and fullscreen controls should have accessible labels and tooltips.

---

# PyTorch Direction

PyTorch support is a second phase.

Do not compromise the initial NumPy experience in order to support PyTorch prematurely.

The architecture should allow multiple numerical backends:

```text
ArrayLab
   │
   ├── NumPy backend
   │
   └── PyTorch backend
```

The visualization layer should be backend-agnostic whenever possible.

PyTorch-specific features include:

* Tensor
* device
* CPU/GPU
* requires_grad
* autograd
* computational graph

Do not fake GPU execution.

If browser PyTorch support does not provide a particular capability, communicate the limitation rather than simulating it as real PyTorch behavior.

---

# Dependency Policy

Use libraries when they solve a real problem.

Preferred examples:

* Pyodide for Python/NumPy execution
* CodeMirror for code editing
* established visualization utilities when appropriate
* icon library if it improves UI consistency

Do not implement a complex library yourself merely to avoid adding a dependency.

Conversely, do not add a dependency for a feature that can be implemented simply with native Svelte/TypeScript.

Before adding a dependency, consider:

1. Is it necessary?
2. Does it work in a browser/static deployment?
3. Does it increase bundle size significantly?
4. Is it actively maintained?
5. Does it complicate the educational experience?

---

# Coding Style

Use TypeScript.

Prefer:

* small components
* clear names
* explicit types
* pure utility functions
* composition over inheritance
* minimal global state

Avoid:

* giant components
* deeply nested conditional rendering
* unnecessary stores
* premature abstractions
* duplicated business logic
* magic numbers

Keep lesson content separate from UI components.

---

# State Management

Do not introduce a global state library unless the application actually needs one.

Start with Svelte's built-in state mechanisms.

Centralize only genuinely shared state, such as:

* current array
* execution state
* current lesson
* runtime readiness
* theme
* fullscreen state

Avoid making every component depend on global state.

Theme state should be synchronized with the browser's actual theme and fullscreen state should be synchronized with the browser Fullscreen API.

---

# Error Handling

Errors are part of the learning experience.

Bad:

```text
Error: ValueError
```

Prefer:

```text
These arrays cannot be broadcast together.

A shape: (2, 3)
B shape: (2,)

Compare dimensions from the right:

3 vs 2  ✕

Try changing B to shape (3,).
```

However, do not hide the original Python error.

Provide both the educational explanation and, where useful, the original error.

---

# Development Workflow

When implementing a feature:

1. Understand the educational objective.
2. Define the interaction.
3. Define the data/state needed.
4. Implement the smallest working version.
5. Verify actual NumPy/PyTorch behavior.
6. Add visualization.
7. Add educational explanation.
8. Add accessibility.
9. Test light mode.
10. Test dark mode.
11. Test normal mode.
12. Test fullscreen mode.
13. Test the GitHub Pages base path.
14. Test the production build.
15. Check for console errors.

Do not start by building a generalized architecture for hypothetical future features.

---

# Claude Code Instructions

When working on ArrayLab:

* Inspect the existing project before creating files.
* Reuse existing components and utilities.
* Do not rewrite working code unnecessarily.
* Keep changes focused.
* Do not introduce dependencies without explaining why they are useful.
* Do not create backend infrastructure.
* Do not replace real NumPy semantics with approximations when Pyodide can execute the real operation.
* Do not make large architectural changes without first explaining the tradeoff.
* Prefer incremental implementation.
* After significant changes, run the relevant checks/build.
* Fix errors before moving to the next feature.
* Verify the application under `/arraylab/`, not only `/`.
* Check both light and dark themes when changing UI.
* Check fullscreen behavior when changing application layout.
* Do not break the static GitHub Pages deployment.

When asked to implement a feature, first identify:

```text
Goal
User interaction
Data/state
Visualization
Edge cases
Accessibility
Implementation
```

Then implement it.

---

# Important Conceptual Distinctions

ArrayLab must carefully distinguish:

### Shape vs size

```text
shape = dimensions
size  = total number of elements
```

For:

```python
a.shape == (2, 3, 4)
```

then:

```text
ndim = 3
size = 24
```

### axis vs dimension

Use precise explanations.

Do not casually say that "axis 0 is always rows" because that becomes misleading for higher-dimensional arrays.

### reshape vs resize

Do not conflate NumPy operations that have different semantics.

### view vs copy

When teaching PyTorch/NumPy memory behavior, clearly distinguish views from copies.

### conceptual visualization vs implementation

If an animation is an educational representation rather than a literal description of the internal implementation, label or phrase it accordingly.

---

# Product Definition

ArrayLab is successful when a student can look at an operation such as:

```python
a + b
```

and understand not only:

```text
the answer
```

but also:

```text
why the shapes are compatible
how broadcasting works
what each element represents
what the resulting shape is
what dtype is produced
```

The central question for every feature is:

> **What should the learner be able to see or understand after interacting with this feature?**

If a feature does not improve learning, reconsider whether it belongs in ArrayLab.

---

# Current Priority

Build the NumPy experience first.

The first meaningful milestone is:

```text
User enters numbers
        ↓
ArrayLab creates NumPy ndarray
        ↓
Array is visualized
        ↓
Inspector shows:
shape
ndim
size
dtype
        ↓
User can explore:
axis
indexing
slicing
reshape
broadcasting
vectorization
```

The application shell must already include:

```text
ArrayLab
                     [ Theme ] [ Fullscreen ]
```

and the application must work correctly at:

```text
https://rendicahya.github.io/arraylab/
```

Only after this NumPy experience is solid should PyTorch Tensor support become a major development priority.
