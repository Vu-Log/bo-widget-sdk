---
layout: home
description: SDK, tooling and templates to build, test and publish widgets for the Vulog back office.

hero:
  name: BO widget SDK
  text: Widgets for the Vulog back office
  tagline: Build a page of the back office menu with the framework of your choice, test it in a fake back office, publish it as a zip.
  actions:
    - theme: brand
      text: Getting started
      link: /guide/getting-started
    - theme: alt
      text: What is a BO widget?
      link: /guide/what-is-a-widget
    - theme: alt
      text: GitHub
      link: https://github.com/Vu-Log/bo-widget-sdk

features:
  - title: One API, two modes
    details: connect() returns the same client as a Web Component and in an iframe. Write the widget once.
    link: /guide/protocol
  - title: Any framework
    details: Templates for React and MUI, Svelte, Vue, Lit and plain Web Components. Each widget ships its own framework.
    link: /examples/react-mui
  - title: Fake back office in dev
    details: npm run dev shows the widget the way the back office does, with mock data or against a real Vulog API.
    link: /guide/getting-started#run-it-in-the-fake-back-office
  - title: Checked before you publish
    details: widget.json is generated and validated at build time, and the zip is checked with the rules the back office applies.
    link: /guide/manifest
  - title: Vulog APIs with authFetch
    details: Call the Vulog admin API with a path. The SDK or the back office adds the authentication.
    link: /guide/calling-vulog-apis
  - title: Ready for AI coding agents
    details: AGENTS.md in every project and in the SDK, skills for coding agents, and llms.txt for this site.
    link: /ai-agents
---
