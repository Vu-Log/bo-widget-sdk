import { describe, expect, it } from 'vitest';
import { defineWarning, findCustomElementsDefine } from './defineCheck.js';

describe('findCustomElementsDefine', () => {
  it('finds a call and its line', () => {
    expect(findCustomElementsDefine("class A {}\ncustomElements.define('my-el', A);")).toEqual([2]);
  });

  it.each([
    ['window.', "window.customElements.define('a-b', A)"],
    ['globalThis.', "globalThis.customElements.define('a-b', A)"],
    ['optional chaining', "customElements?.define('a-b', A)"],
    ['spaces and line breaks', "customElements\n  .define (\n'a-b', A)"],
  ])('finds a call through %s', (_label, code) => {
    expect(findCustomElementsDefine(code)).toEqual([1]);
  });

  it('finds every call', () => {
    expect(
      findCustomElementsDefine('customElements.define(a, A);\n\ncustomElements.define(b, B);'),
    ).toEqual([1, 3]);
  });

  it.each([
    ['no call', 'export default class extends HTMLElement {}'],
    ['customElements.get', "customElements.get('a-b')"],
    ['customElements.whenDefined', "customElements.whenDefined('a-b')"],
    ['a method named defineX', 'customElements.defineAll()'],
    ['another object', "registry.define('a-b', A)"],
    ['an empty module', ''],
  ])('finds nothing for %s', (_label, code) => {
    expect(findCustomElementsDefine(code)).toEqual([]);
  });
});

describe('defineWarning', () => {
  it('names the module and the lines, and says what to do', () => {
    const warning = defineWarning('src/main.ts', [3, 8]);

    expect(warning).toMatch(/^src\/main\.ts:3,8 calls customElements\.define/);
    expect(warning).toContain('export the class as the default export');
  });
});
