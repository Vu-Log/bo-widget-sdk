/**
 * A call to `customElements.define`, also through `window.`, `globalThis.` or `?.`. A widget never
 * registers its class: the back office does, under a tag of its own.
 */
const DEFINE_CALL = /\bcustomElements\s*(?:\?\.|\.)\s*define\s*\(/g;

/**
 * Finds the calls to `customElements.define` in a module.
 *
 * @param code - Source of the module.
 * @returns The 1-based line of each call, in order; empty when there is none.
 */
export const findCustomElementsDefine = (code: string): number[] => {
  const lines: number[] = [];
  for (const match of code.matchAll(DEFINE_CALL)) {
    lines.push(code.slice(0, match.index).split('\n').length);
  }
  return lines;
};

/** Warning shown for a module that calls `customElements.define`. */
export const defineWarning = (module: string, lines: readonly number[]): string =>
  `${module}:${lines.join(',')} calls customElements.define. A widget must not register custom ` +
  'elements: export the class as the default export of the entry, the back office registers it ' +
  'under its own tag. Other elements registered globally may collide with other widgets.';
