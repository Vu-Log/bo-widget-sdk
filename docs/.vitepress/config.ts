import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

const repository = 'https://github.com/Vu-Log/bo-widget-sdk';

export default defineConfig({
  title: 'BO widget SDK',
  description:
    'Build, test and publish widgets for the Vulog back office, as a Web Component or in an iframe.',
  lang: 'en-US',
  base: '/bo-widget-sdk/',
  cleanUrls: true,
  lastUpdated: false,
  vite: {
    plugins: [
      // Writes llms.txt and llms-full.txt at the root of the site, for AI coding agents.
      llmstxt({ domain: 'https://vu-log.github.io' }),
    ],
  },
  themeConfig: {
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/guide/what-is-a-widget', activeMatch: '/guide/' },
      { text: 'Examples', link: '/examples/react-mui', activeMatch: '/examples/' },
      { text: 'AI agents', link: '/ai-agents' },
      { text: 'FAQ', link: '/faq' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is a BO widget?', link: '/guide/what-is-a-widget' },
          { text: 'Getting started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Web Component or iframe', link: '/guide/web-component-or-iframe' },
          { text: 'The manifest (widget.json)', link: '/guide/manifest' },
          { text: 'The protocol', link: '/guide/protocol' },
          { text: 'Permissions', link: '/guide/permissions' },
          { text: 'Calling Vulog APIs', link: '/guide/calling-vulog-apis' },
          { text: 'Layout and isolation', link: '/guide/layout-and-isolation' },
          { text: 'UI guidelines', link: '/guide/ui-guidelines' },
          { text: 'Testing', link: '/guide/testing' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'React and MUI', link: '/examples/react-mui' },
          { text: 'Svelte', link: '/examples/svelte' },
          { text: 'Vue', link: '/examples/vue' },
          { text: 'Lit', link: '/examples/lit' },
          { text: 'Vanilla', link: '/examples/vanilla' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'AI coding agents', link: '/ai-agents' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Protocol changelog', link: '/protocol-changelog' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repository }],
    editLink: {
      pattern: `${repository}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Vulog',
    },
  },
});
