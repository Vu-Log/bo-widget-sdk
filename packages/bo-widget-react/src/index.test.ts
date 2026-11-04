import { describe, expect, it } from 'vitest';
import * as api from './index.js';

describe('@vulog/bo-widget-react', () => {
  it('exports the public API', () => {
    expect(Object.keys(api).sort()).toEqual([
      'WidgetProvider',
      'createBoMuiTheme',
      'renderIframeWidget',
      'toCustomElement',
      'useAuthFetch',
      'useBoClient',
      'useBoContext',
      'useBoRouter',
      'useBoTheme',
      'useCurrentUser',
    ]);
  });
});
