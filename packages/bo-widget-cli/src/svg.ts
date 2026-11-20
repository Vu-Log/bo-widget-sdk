/**
 * Detection of active content in the SVG files of a widget archive, the
 * `unsafe-svg` rule of the Vulog server (copied from it, same messages).
 *
 * An SVG is a document: opened directly from the widgets origin, a `<script>`,
 * an event attribute or a `javascript:` link in it would run there. Such a
 * file is refused when the zip is published.
 *
 * This is defence in depth: the server also serves every file that is neither
 * code nor a page with a `sandbox` Content-Security-Policy. The scan therefore
 * fails closed: anything a plain icon or illustration does not need is refused.
 *
 * Every pattern is linear in the size of the file: each repeated quantifier
 * is bounded by a delimiter or a length, and is never followed by another one
 * that overlaps it. An SVG is also capped
 * at {@link MAX_SVG_BYTES}, which bounds the memory of the decoding passes.
 */

/** Largest SVG accepted, in bytes: far above an icon or an illustration. */
export const MAX_SVG_BYTES = 5 * 1024 * 1024;

/**
 * An optional namespace prefix, `svg:` or `é:`: any run of characters that
 * cannot end a name, then a colon. XML names accept non-ASCII letters, so an
 * ASCII-only class would let `<é:script>` through.
 */
const PREFIX = String.raw`(?:[^\s<>"'/=:]+:)?`;

/** Embedded raster images, the only `data:` URLs allowed. Never `image/svg+xml`, itself a document. */
const ALLOWED_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,/i;

/**
 * The base64 payload of an allowed data URL inside quotes, removed before
 * scanning so its `/` and `=` cannot look like `/onab=`. Only a quoted value
 * is stripped, up to its closing quote: an unquoted one would let
 * `href=data:…,AAAA onload=…` hide its event attribute.
 */
const ALLOWED_DATA_IMAGE_PAYLOAD =
  /(["'])(\s*data:image\/(?:png|jpeg|gif|webp);base64,)[A-Za-z0-9+/=\s]*(?=\1)/gi;

/**
 * Elements that run code, embed another document, or change how the file is
 * resolved. Case-insensitive and with any namespace prefix (`<svg:script>`,
 * `<é:script>`). The lookahead keeps `<metadata>` or `<linkage>` out.
 */
const FORBIDDEN_ELEMENT = new RegExp(
  String.raw`<\s*${PREFIX}(script|foreignobject|iframe|embed|object|frame|frameset|handler|listener|base|meta|link)(?=[\s/>]|$)`,
  'i',
);

/**
 * An event attribute (`onload=`, `ONCLICK =`, even prefixed), after
 * whitespace, a quote or `/` (`<svg/onload=…>` in HTML parsing).
 */
const EVENT_ATTRIBUTE = new RegExp(String.raw`[\s"'/]${PREFIX}(on[a-z][\w-]*)\s*=`, 'i');

/**
 * The name of an attribute that loads, links or submits to a URL (`href`,
 * `src`, `srcset`, `action`, `formaction`, `poster`, `ping`, `background`,
 * each with any namespace prefix), up to its `=`. Its value is read separately, so the next
 * search starts right after the name: a quote inside another attribute's
 * value (`title="x src='#" href='https://…'`) cannot swallow a real `href`.
 */
const LINK_ATTRIBUTE_NAME = new RegExp(
  String.raw`[\s"'/](${PREFIX}(?:href|src|srcset|action|formaction|poster|ping|background))\s*=`,
  'gi',
);

/**
 * The value of an attribute, read from right after its `=` (sticky), quoted
 * or not. Its length is bounded, so reading the values of many names stays
 * linear. A longer quoted value, or one with a `<` or `>`, is read up to the
 * bound with its opening quote, so it fails the link check; a longer unquoted
 * one is read up to the bound (the `javascript:` check still covers the file).
 */
const ATTRIBUTE_VALUE = /\s{0,64}(?:"([^"<>]{0,2048})"|'([^'<>]{0,2048})'|([^\s>]{0,2048}))/y;

/** The XHTML namespace: an SVG icon has no use for HTML elements, forms or media. */
const XHTML_NAMESPACE = /http:\/\/www\.w3\.org\/1999\/xhtml/i;

/**
 * An animation target that is a link, a URL attribute or an event attribute
 * (`attributeName="href"`, `"xlink:href"`, `"src"`, `"onclick"`): a `<set>` or
 * `<animate>` can turn a safe `href` into `javascript:`. Matched on any
 * element, since only animations have this attribute.
 */
const LINK_ANIMATION = new RegExp(
  String.raw`[\s"'/]attributeName\s*=\s*(?:["']\s*)?${PREFIX}(?:href|src|action|formaction|on)`,
  'i',
);

/** A CSS `url(…)` and its target, anywhere in the file (a `<style>` element, a `style` or presentation attribute, or text). */
const CSS_URL = /url\s*\(\s*["']?([^)"']*)/gi;

/** CSS functions that load an image from a plain string, without `url()` (`-webkit-image-set(` included). */
const CSS_STRING_IMAGE = /(?:image-set|cross-fade|(?<![\w-])image|(?<![\w-])src)\s*\(/i;

/**
 * Removes every character up to U+0020 (space and C0 controls). This is
 * broader than what browsers ignore in a URL (tab, LF and CR anywhere, C0 and
 * space at the ends), so the scheme checks fail closed.
 */
const stripIgnoredInUrl = (value: string): string =>
  // A regex rather than a per-character pass, which would allocate one string per character of a 5 MB file.
  // eslint-disable-next-line no-control-regex -- the C0 controls are exactly what is removed
  value.replace(/[\u0000-\u0020]+/g, '');

/** U+FFFD, the replacement character, written as a code so no invisible character sits in the source. */
const REPLACEMENT_CHARACTER = String.fromCharCode(0xfffd);

/** The character of a code point, or U+FFFD when it is not one. */
const fromCodePoint = (codePoint: number): string =>
  Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : REPLACEMENT_CHARACTER;

/**
 * Numeric character references (`&#106;`, `&#x6A;`, with or without `;`) and
 * the named `&colon;`, `&tab;` and `&newline;` that HTML parsing uses to hide
 * a scheme. They are decoded before scanning, so `&#106;avascript:` is seen as
 * `javascript:`. Other named references stay as they are, and fail the link
 * checks.
 */
const decodeCharacterReferences = (text: string): string =>
  text
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, decimal: string) => fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n');

/**
 * CSS escapes (`\72` or `\72 ` for `r`, `\:` for `:`), decoded as a CSS
 * parser does, so `u\72l(` and `@\69mport` are seen as `url(` and `@import`.
 * Only used for the CSS checks: a backslash elsewhere (an SVG font glyph, a
 * Windows path in Inkscape metadata) is harmless.
 */
const decodeCssEscapes = (text: string): string =>
  text
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex: string) => fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\([^\n0-9a-f])/gi, '$1');

/** `true` when a link target stays inside the file: a fragment, or an allowed embedded image. */
const isInternalTarget = (target: string): boolean => {
  const compact = stripIgnoredInUrl(target);
  return compact.startsWith('#') || ALLOWED_DATA_IMAGE.test(compact);
};

/**
 * `true` when the browser reads the file exactly as this scan does despite
 * another declared encoding: the file is pure ASCII and the encoding is one
 * where ASCII bytes keep their meaning. Illustrator writes
 * `encoding="iso-8859-1"` on plain ASCII exports.
 */
const isAsciiReadAlike = (text: string, encoding: string): boolean =>
  /^(?:us-ascii|ascii|iso-8859-\d{1,2}|latin-?1|windows-125\d)$/i.test(encoding) &&
  !/[^\p{ASCII}]/u.test(text);

/** Reads the file as strict UTF-8: the reason it is refused, or the text without its BOM. */
const decodeSvg = (data: Buffer): { reason: string } | { text: string } => {
  let text: string;
  try {
    // `fatal` refuses invalid bytes: UTF-16 with a BOM is refused here, without one by the NUL check below.
    text = new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    return { reason: 'is not valid UTF-8' };
  }
  if (text.includes('\u0000')) {
    return { reason: 'contains a NUL character' };
  }
  const encoding = /^\s*<\?xml\b[^<>]*\bencoding\s*=\s*["']([^"']*)["']/i.exec(text)?.[1];
  if (encoding !== undefined && !/^utf-?8$/i.test(encoding) && !isAsciiReadAlike(text, encoding)) {
    return { reason: `declares the encoding "${encoding.slice(0, 20)}" instead of UTF-8` };
  }
  return { text };
};

/**
 * Prolog constructs that can define or pull in content: entities, an internal
 * DTD subset (its `<!ATTLIST>` can give elements a default `onload`), a
 * stylesheet, `xml:base`.
 */
const findUnsafeProlog = (text: string): string | null => {
  if (/<!ENTITY/i.test(text)) return 'declares an XML entity';
  if (/<!(?:ATTLIST|ELEMENT|NOTATION)/i.test(text)) return 'declares a DTD rule';
  if (/<!DOCTYPE[^<>[]*\[/i.test(text)) return 'has an internal DTD subset';
  if (/<\?xml-stylesheet/i.test(text)) return 'links a stylesheet with <?xml-stylesheet?>';
  if (/\sxml:base\s*=/i.test(text)) return 'sets xml:base';
  return null;
};

/** CSS that loads from outside the file: `@import`, an image function, a `url()` that is not internal. */
const findExternalCss = (css: string): string | null => {
  if (/@import/i.test(css)) return 'imports a stylesheet with @import';
  if (CSS_STRING_IMAGE.test(css))
    return 'loads an image with image-set(), cross-fade(), image() or src()';
  for (const [, target] of css.matchAll(CSS_URL)) {
    if (!isInternalTarget(target ?? '')) {
      return 'has a CSS url() that points outside the file: only "#id" and data:image/png, jpeg, gif or webp are allowed';
    }
  }
  return null;
};

/** The value of the attribute whose `=` ends at `end`, or `''` when none can be read there. */
const attributeValueAt = (text: string, end: number): string => {
  ATTRIBUTE_VALUE.lastIndex = end;
  const [, doubleQuoted, singleQuoted, unquoted] = ATTRIBUTE_VALUE.exec(text) ?? [];
  return doubleQuoted ?? singleQuoted ?? unquoted ?? '';
};

/** Links that leave the file: URL attributes, link animations, then the CSS checks on the CSS-unescaped text. */
const findExternalLink = (text: string): string | null => {
  for (const match of text.matchAll(LINK_ATTRIBUTE_NAME)) {
    if (!isInternalTarget(attributeValueAt(text, match.index + match[0].length))) {
      return `has a ${match[1]} that points outside the file: only "#id" and data:image/png, jpeg, gif or webp are allowed`;
    }
  }
  if (LINK_ANIMATION.test(text))
    return 'animates a link or an event attribute with <set> or <animate>';
  // CSS escapes need a backslash: skip the decoding pass when there is none.
  return findExternalCss(text.includes('\\') ? decodeCssEscapes(text) : text);
};

/**
 * Looks for active content in an SVG file of a widget archive.
 *
 * Refused:
 * - a file larger than {@link MAX_SVG_BYTES};
 * - a file that is not strict UTF-8 or contains NUL, or that declares another
 *   encoding (unless it is pure ASCII and the encoding an ASCII-compatible
 *   one: us-ascii, iso-8859-*, latin1, windows-125x);
 * - XML entities, DTD rules or an internal DTD subset, `<?xml-stylesheet?>`,
 *   `xml:base`;
 * - the elements `script`, `foreignObject`, `iframe`, `embed`, `object`,
 *   `frame`, `frameset`, `handler`, `listener`, `base`, `meta`, `link`, with
 *   any namespace prefix, and the XHTML namespace;
 * - any `on*` attribute, and an `attributeName` on `href`, `src`, `action`,
 *   `formaction` or `on*`;
 * - an `href`, `src`, `srcset`, `action`, `formaction` (any prefix),
 *   `poster`, `ping`, `background` or CSS `url()` other than `#id` or a
 *   `data:image/(png|jpeg|gif|webp);base64` URL; `@import`, `image-set()`,
 *   `cross-fade()`, `image()`, `src()`, CSS escapes decoded;
 * - `javascript:` or `vbscript:` anywhere.
 *
 * Numeric character references and `&colon;`, `&tab;`, `&newline;` are
 * decoded first.
 *
 * @param data The bytes of the `.svg` file.
 * @returns Why the file is refused, as the end of a sentence about it
 *   ("contains a <script> element"), or `null` when it is safe to publish.
 */
export const findUnsafeSvgContent = (data: Buffer): string | null => {
  if (data.length > MAX_SVG_BYTES) {
    return `is larger than ${MAX_SVG_BYTES / (1024 * 1024)} MB, far more than an icon or an illustration needs`;
  }
  const decoded = decodeSvg(data);
  if ('reason' in decoded) return decoded.reason;

  const text = decodeCharacterReferences(decoded.text).replace(ALLOWED_DATA_IMAGE_PAYLOAD, '$1$2');
  const prolog = findUnsafeProlog(text);
  if (prolog !== null) return prolog;

  const element = FORBIDDEN_ELEMENT.exec(text)?.[1];
  if (element !== undefined) return `contains a <${element}> element`;
  if (XHTML_NAMESPACE.test(text)) return 'uses the XHTML namespace';

  const event = EVENT_ATTRIBUTE.exec(text)?.[1];
  if (event !== undefined) return `has an event attribute (${event.slice(0, 30)})`;

  const link = findExternalLink(text);
  if (link !== null) return link;

  if (/(?:java|vb)script:/i.test(stripIgnoredInUrl(text)))
    return 'contains a javascript: or vbscript: URL';
  return null;
};
