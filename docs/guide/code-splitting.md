---
description: Split a Web Component widget into chunks loaded on demand with import() - how the BO loads them, the recommended vite.config.ts, minification, and the rules (literal imports, loading and Retry, styles in the shadow root).
---

# Code splitting

A Web Component widget can load its heavy or rarely used parts on demand: `index.js` stays small, and the widget shows sooner. It needs no SDK option, only a dynamic `import()`.

## How it works

- The BO imports `index.js` by its URL, with a native `import()`. A relative import in `index.js`, static or dynamic, resolves next to it, in the folder of that version of the widget.
- Vite turns each dynamic `import('./Dialog.tsx')` into a chunk of its own, next to `index.js`, that the browser loads the first time the code runs.
- `bo-widget pack` zips every file of `dist/`, the chunks included. The zip rules still apply to the whole bundle: 10 MB at most, 50 MB once decompressed, 1000 entries at most, and only the extensions `js mjs css html json svg png jpg webp woff2 map` (see [the manifest](./manifest#checked-on-publication)).

Code splitting is for the Web Component runtime. An iframe widget is a regular Vite app, which splits its code already.

## Recommended `vite.config.ts`

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { boWidget } from '@vulog/bo-widget-vite';
import { defineConfig } from 'vite';
import widget from './widget.config.ts';

export default defineConfig({
  plugins: [react(), boWidget(widget)],
  build: {
    rolldownOptions: {
      output: {
        // The chunks go to assets/, with a readable name: assets/AboutDialog-[hash].js.
        chunkFileNames: 'assets/[name]-[hash].js',
        // Everything index.js needs at once in one chunk (shell), instead of many small shared
        // chunks: the lazy chunks import it, so each module is loaded once.
        codeSplitting: { groups: [{ name: 'shell', tags: ['$initial'] }] },
      },
    },
  },
  test: { environment: 'happy-dom' },
});
```

With it, `index.js` only re-exports the class from `assets/shell-[hash].js`, and each lazy part is a chunk of `assets/`. These are options of Vite 8 (Rolldown).

`@vulog/bo-widget-vite` minifies the Web Component build fully, whitespace included, with Vite 8: library mode keeps the whitespace of an ES build otherwise. Keep `build.minify` unset; `build.minify: false` turns it off.

## Rules

- **Lazy-load what is heavy or rarely used**: dialogs, drawers, wizards, maps and their libraries, the languages other than the default one. What the first screen shows stays in the shell.
- **Write a literal `import('./AboutDialog.tsx')`**, declared at module scope: one per lazy module, one per language for instance. Vite resolves the path at build time, and makes it a chunk.
- **Never import a lazy module statically too**, from the shell or from a module it imports: it stays in the shell, and the build warns `INEFFECTIVE_DYNAMIC_IMPORT`. Import its types with `import type` only.
- **Show a loading state, and a Retry when the chunk fails** (network, CDN), never a blank widget. Log the failure with `bo.log.error`. `React.lazy` keeps a failed import: Retry needs a new lazy component, as below.
- **Keep the styles in the shadow root.** A lazy chunk never adds CSS to `document.head`: import the CSS of a library with `?inline` and add it to the shadow root in a `<style>`, once. See [Styles never in `document.head`](./layout-and-isolation#styles-never-in-document-head).
- **Check the result**: after `npm run build`, look at the files of `dist/` and their size, then run `npx bo-widget validate`.

### React: a lazy dialog with Retry

```tsx
import { Alert, Button, CircularProgress } from '@mui/material';
import { useBoClient } from '@vulog/bo-widget-react';
import { Component, lazy, Suspense, useState, type ReactNode } from 'react';

// A literal import(), at module scope: Vite makes the dialog a chunk of its own.
const loadAboutDialog = () => import('./AboutDialog.tsx');

/** Shows `failed` instead of its children when they throw, and reports the error. */
class ChunkBoundary extends Component<
  { children: ReactNode; failed: ReactNode; onError: (error: unknown) => void },
  { error: boolean }
> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.error ? this.props.failed : this.props.children;
  }
}

export function LazyAbout({ onClose }: { onClose: () => void }) {
  const bo = useBoClient();
  // React.lazy keeps a failed import: each attempt needs a new lazy component.
  const [AboutDialog, setAboutDialog] = useState(() => lazy(loadAboutDialog));
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    setAboutDialog(() => lazy(loadAboutDialog));
    setAttempt((count) => count + 1);
  };

  return (
    <ChunkBoundary
      key={attempt}
      onError={(error) => bo.log.error('The about dialog failed', { error })}
      failed={
        <Alert severity="error" action={<Button onClick={retry}>Retry</Button>}>
          This part of the widget could not be shown.
        </Alert>
      }
    >
      <Suspense fallback={<CircularProgress />}>
        <AboutDialog onClose={onClose} />
      </Suspense>
    </ChunkBoundary>
  );
}
```

`AboutDialog.tsx` has a default export, the dialog component. Render `<LazyAbout>` only while the dialog is open: its chunk is loaded the first time. The boundary also catches the errors the dialog throws once loaded: the logged `error` tells them apart from a chunk that failed.

With Svelte, Vue, Lit or vanilla, `await import('./AboutDialog.ts')` in a `try`/`catch`, with the same loading state; in the `catch`, log with `bo.log.error('…', { error })` and show a Retry that calls the function again.

Some browser versions keep a failed module fetch: there, Retry fails again at once, and only a reload of the page loads the chunk. Say so in the error message when Retry keeps failing.
