/**
 * Pyodide is loaded from the jsDelivr CDN rather than bundled: the runtime plus
 * NumPy is ~15 MB and the CDN serves it with the correct MIME types and caching,
 * independent of the GitHub Pages base path.
 */
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
