---
'@vulog/bo-widget-sdk': patch
---

Document the format of `BoContext.locale` and `localeChanged`: the BO language as `language_COUNTRY` with an underscore (`en_GB`, `fr_FR`), not a BCP 47 tag, so `Intl` needs the underscore replaced first.
