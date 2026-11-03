import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as sdk from './index.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { name: string };

describe('@vulog/bo-widget-sdk', () => {
  it('exposes the npm package name', () => {
    expect(sdk.SDK_PACKAGE_NAME).toBe('@vulog/bo-widget-sdk');
  });

  it('keeps SDK_PACKAGE_NAME in sync with package.json', () => {
    expect(sdk.SDK_PACKAGE_NAME).toBe(packageJson.name);
  });

  it('exposes no other runtime export yet', () => {
    expect(Object.keys(sdk)).toEqual(['SDK_PACKAGE_NAME']);
  });
});
