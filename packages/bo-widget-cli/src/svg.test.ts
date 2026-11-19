import { describe, expect, it } from 'vitest';

import { MAX_SVG_BYTES, findUnsafeSvgContent } from './svg.js';

const scan = (svg: string | Buffer): string | null =>
  findUnsafeSvgContent(Buffer.isBuffer(svg) ? svg : Buffer.from(svg));

/** Wraps a fragment in a root `<svg>` element, as an exported icon has. */
const svg = (inner: string, attributes = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${attributes}>${inner}</svg>`;

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('findUnsafeSvgContent', () => {
  describe('accepts plain SVG files', () => {
    it.each([
      ['a Material-style icon', svg('<path d="M12 2L2 22h20L12 2z" fill="currentColor"/>')],
      [
        'an Inkscape export with its namespaces and metadata',
        `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xlink="http://www.w3.org/1999/xlink"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns="http://www.w3.org/2000/svg" sodipodi:docname="plate.svg" inkscape:version="1.3">
  <metadata><dc:title>Plate</dc:title></metadata>
  <sodipodi:namedview id="base" inkscape:zoom="1"/>
  <rect width="10" height="10" style="fill:#000;stroke:none"/>
</svg>`,
      ],
      [
        'gradients, clip paths and <use> on fragments',
        svg(
          '<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/></linearGradient></defs>' +
            '<rect fill="url(#g)" clip-path="url( \'#c\' )"/><use href="#g"/><use xlink:href="#g"/>',
        ),
      ],
      ['an embedded PNG image', svg(`<image href="${ONE_PIXEL_PNG}" width="1" height="1"/>`)],
      ['an embedded image in a CSS url()', svg(`<rect style="fill:url('${ONE_PIXEL_PNG}')"/>`)],
      ['a <style> element without links', svg('<style>.a{fill:red}</style><rect class="a"/>')],
      [
        'a DOCTYPE without internal subset',
        `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">${svg('')}`,
      ],
      ['a UTF-8 BOM', `${String.fromCharCode(0xfeff)}${svg('')}`],
      ['an explicit utf-8 encoding', `<?xml version="1.0" encoding="utf-8"?>${svg('')}`],
      [
        'text that merely mentions "on" and "script"',
        svg('<text>Turn on the javascript tutorial</text>'),
      ],
      [
        'an Illustrator export',
        `<?xml version="1.0" encoding="iso-8859-1"?>
<!-- Generator: Adobe Illustrator 18.1.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve">
<style type="text/css">
	.st0{fill:url(#SVGID_1_);}
</style>
<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop offset="0" style="stop-color:#FFFFFF"/></linearGradient>
<path class="st0" d="M0 0h24v24H0z"/>
</svg>`,
      ],
      [
        'a Figma export',
        svg(
          '<g filter="url(#filter0_d)" clip-path="url(#clip0)"><path d="M1 1h2"/></g>' +
            '<defs><filter id="filter0_d"><feFlood flood-opacity="0" result="BackgroundImageFix"/></filter>' +
            '<clipPath id="clip0"><rect width="24" height="24" fill="white"/></clipPath></defs>',
        ),
      ],
      [
        'a Sketch export',
        svg(
          '<title>icon</title><desc>Created with Sketch.</desc><defs><path id="path-1" d="M0 0h1"/></defs>' +
            '<mask id="mask-2" fill="white"><use xlink:href="#path-1"></use></mask>',
          ' xmlns:xlink="http://www.w3.org/1999/xlink"',
        ),
      ],
      [
        'an Inkscape embedded PNG wrapped over several lines',
        svg(
          `<image width="1" height="1" xlink:href="data:image/png;base64,\niVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ\nAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\n"/>`,
        ),
      ],
      [
        'a Windows path in Inkscape metadata',
        svg('', ' inkscape:export-filename="C:\\dev\\icons\\a.png"'),
      ],
      [
        'an SVG font glyph for the backslash',
        svg('<font><glyph unicode="\\" horiz-adv-x="10"/></font>'),
      ],
      ['an us-ascii declaration', `<?xml version="1.0" encoding="us-ascii"?>${svg('')}`],
      ['a latin1 declaration', `<?xml version="1.0" encoding="latin1"?>${svg('')}`],
      [
        'a BOM before an ASCII-compatible declaration',
        `${String.fromCharCode(0xfeff)}<?xml version="1.0" encoding="iso-8859-1"?>${svg('')}`,
      ],
    ])('%s', (_, content) => {
      expect(scan(content)).toBeNull();
    });

    it('does not mistake base64 characters in an embedded image for an event attribute', () => {
      expect(
        scan(svg('<image href="data:image/png;base64,AAAA/onAB=" width="1" height="1"/>')),
      ).toBeNull();
    });
  });

  describe('refuses what is not strict UTF-8', () => {
    it('refuses invalid UTF-8 bytes', () => {
      expect(scan(Buffer.from([0x3c, 0x73, 0x76, 0x67, 0xff, 0x3e]))).toBe('is not valid UTF-8');
    });

    it('refuses UTF-16 with a BOM, which a UTF-8 scan would read as noise', () => {
      const utf16 = Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(svg('<script>x</script>'), 'utf16le'),
      ]);
      expect(scan(utf16)).toBe('is not valid UTF-8');
    });

    it('refuses a NUL character', () => {
      expect(scan(svg('<rect/>\u0000'))).toBe('contains a NUL character');
    });

    it('accepts an ASCII-compatible encoding on a pure ASCII file, as Illustrator exports it', () => {
      expect(scan(`<?xml version="1.0" encoding="iso-8859-1"?>${svg('')}`)).toBeNull();
      expect(scan(`<?xml version="1.0" encoding="windows-1252"?>${svg('')}`)).toBeNull();
    });

    it('refuses an ASCII-compatible encoding once the file has non-ASCII characters', () => {
      expect(scan(`<?xml version="1.0" encoding="ISO-8859-1"?>${svg('<text>é</text>')}`)).toBe(
        'declares the encoding "ISO-8859-1" instead of UTF-8',
      );
    });

    it('reads a single-quoted encoding declaration too', () => {
      expect(scan(`<?xml version='1.0' encoding='UTF-16'?>${svg('')}`)).toBe(
        'declares the encoding "UTF-16" instead of UTF-8',
      );
    });

    it.each(['UTF-16', 'UTF-7', 'Shift_JIS', 'IBM037'])(
      'refuses the encoding %s, read differently from ASCII',
      (encoding) => {
        expect(scan(`<?xml version="1.0" encoding="${encoding}"?>${svg('')}`)).toBe(
          `declares the encoding "${encoding}" instead of UTF-8`,
        );
      },
    );
  });

  describe('refuses prolog constructs', () => {
    it.each([
      ['an entity', '<!DOCTYPE svg [<!ENTITY x "y">]>', 'declares an XML entity'],
      ['an internal DTD subset', '<!DOCTYPE svg [ ]>', 'has an internal DTD subset'],
      [
        'a stylesheet instruction',
        '<?xml-stylesheet href="https://evil.example/a.css"?>',
        'links a stylesheet with <?xml-stylesheet?>',
      ],
    ])('%s', (_, prolog, reason) => {
      expect(scan(`${prolog}${svg('')}`)).toBe(reason);
    });

    it.each(['ATTLIST svg onload CDATA "alert(1)"', 'ELEMENT svg ANY'])(
      'refuses the DTD rule <!%s>, which can give elements a default event attribute',
      (rule) => {
        expect(scan(`<!DOCTYPE svg [<!${rule}>]>${svg('')}`)).toBe('declares a DTD rule');
      },
    );

    it('refuses an older Illustrator export that declares its namespaces as entities', () => {
      const prolog =
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x.dtd" [\n\t<!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/">\n]>';
      expect(scan(`${prolog}${svg('')}`)).toBe('declares an XML entity');
    });

    it('refuses xml:base', () => {
      expect(scan(svg('', ' xml:base="https://evil.example/"'))).toBe('sets xml:base');
    });
  });

  describe('refuses active elements', () => {
    it.each([
      'script',
      'foreignObject',
      'iframe',
      'embed',
      'object',
      'frame',
      'frameset',
      'handler',
      'listener',
      'base',
      'meta',
      'link',
    ])('<%s>', (element) => {
      expect(scan(svg(`<${element}>x</${element}>`))).toBe(`contains a <${element}> element`);
    });

    it('whatever the case', () => {
      expect(scan(svg('<SCRIPT>alert(1)</SCRIPT>'))).toBe('contains a <SCRIPT> element');
    });

    it('with a namespace prefix', () => {
      expect(scan(svg('<svg:script xmlns:svg="http://www.w3.org/2000/svg">x</svg:script>'))).toBe(
        'contains a <script> element',
      );
    });

    it.each([
      [
        'a non-ASCII prefix',
        '<é:script xmlns:é="http://www.w3.org/2000/svg">x</é:script>',
        'script',
      ],
      [
        'a prefix in upper case',
        '<s:FOREIGNOBJECT xmlns:s="http://www.w3.org/2000/svg"/>',
        'FOREIGNOBJECT',
      ],
      [
        'an XHTML iframe with srcdoc',
        '<é:iframe xmlns:é="http://www.w3.org/1999/xhtml" srcdoc="&lt;script&gt;x&lt;/script&gt;"/>',
        'iframe',
      ],
    ])('with %s', (_, element, name) => {
      expect(scan(svg(element))).toBe(`contains a <${name}> element`);
    });

    it('refuses the XHTML namespace, which brings HTML elements, forms and media', () => {
      expect(scan(svg('<g xmlns:h="http://www.w3.org/1999/xhtml"><h:p>x</h:p></g>'))).toBe(
        'uses the XHTML namespace',
      );
    });

    it('self-closing, with an external source', () => {
      expect(scan(svg('<script href="https://evil.example/a.js"/>'))).toBe(
        'contains a <script> element',
      );
    });
  });

  describe('refuses event attributes', () => {
    it.each([
      ['on the root', svg('', ' onload="alert(1)"')],
      ['in upper case with spaces', svg('<rect ONCLICK = "x()"/>')],
      ['after a slash, as HTML parsing reads it', '<svg/onload=alert(1)>'],
      ['after a quote', svg('<rect x="1"onmouseover="x()"/>')],
      ['with a namespace prefix', svg('<rect é:onclick="x()"/>')],
      ['after an unquoted data URL', svg('<image href=data:image/png;base64,AAAA onload="x()"/>')],
    ])('%s', (_, content) => {
      expect(scan(content)).toMatch(/^has an event attribute \(on[a-z]+\)$/i);
    });
  });

  describe('refuses links outside the file', () => {
    it.each([
      ['a javascript: href', svg('<a href="javascript:alert(1)"><rect/></a>')],
      ['a javascript: xlink:href', svg('<a xlink:href="javascript:alert(1)"><rect/></a>')],
      ['a scheme hidden by leading spaces', svg('<a href=" javascript:alert(1)"><rect/></a>')],
      ['a decimal character reference', svg('<a href="&#106;avascript:alert(1)"><rect/></a>')],
      [
        'a hexadecimal reference inside the scheme',
        svg('<a href="java&#x09;script:alert(1)"><rect/></a>'),
      ],
      ['a named reference for the colon', svg('<a href="javascript&colon;alert(1)"><rect/></a>')],
      ['an https URL', svg('<image href="https://evil.example/pixel.png"/>')],
      ['a protocol-relative URL', svg('<use href="//evil.example/sprite.svg#a"/>')],
      ['a relative path', svg('<image href="other.svg"/>')],
      [
        'an HTML data URL',
        svg('<a href="data:text/html,&lt;script&gt;x&lt;/script&gt;"><rect/></a>'),
      ],
      [
        'an SVG data URL, itself a document',
        svg('<image href="data:image/svg+xml;base64,PHN2Zy8+"/>'),
      ],
      ['an unquoted value', svg('<image href=https://evil.example/a.png />')],
      ['a src attribute', svg('<image src="https://evil.example/a.png"/>')],
      ['single quotes', svg("<image href='https://evil.example/a.png'/>")],
      ['spaces around the equals sign', svg('<image href = "https://evil.example/a.png"/>')],
      [
        'a custom prefix',
        svg('<image x:href="https://evil.example/a.png" xmlns:x="http://www.w3.org/1999/xlink"/>'),
      ],
      ['a non-ASCII prefix', svg('<image é:href="https://evil.example/a.png"/>')],
      ['a srcset', svg('<img srcset="https://evil.example/a.png 1x"/>')],
      ['a form action', svg('<form action="https://evil.example/"/>')],
      ['a formaction', svg('<button formaction="https://evil.example/"/>')],
      ['a poster', svg('<video poster="https://evil.example/p.png"/>')],
      ['a ping', svg('<a href="#a" ping="https://evil.example/"><rect/></a>')],
      ['a background', svg('<table background="https://evil.example/b.png"/>')],
      [
        'a real href after a fake quote inside another attribute',
        svg(`<a title="x src='#" href='https://evil.example/x.html'><rect/></a>`),
      ],
      ['a value longer than the bound', svg(`<image href="#${'a'.repeat(3000)}"/>`)],
      [
        'a value with spaces before it beyond the bound',
        svg(`<image href=${' '.repeat(100)}"#a"/>`),
      ],
    ])('%s', (_, content) => {
      expect(scan(content)).toMatch(/points outside the file/);
    });

    it('refuses a <set> that rewrites an href', () => {
      expect(
        scan(svg('<a href="#x"><set attributeName="href" to="javascript:alert(1)"/><rect/></a>')),
      ).toBe('animates a link or an event attribute with <set> or <animate>');
    });

    it('refuses an <animate> on xlink:href', () => {
      expect(
        scan(svg('<a href="#x"><animate attributeName="xlink:href" values="#a;#b"/></a>')),
      ).toBe('animates a link or an event attribute with <set> or <animate>');
    });

    it.each([
      ['a non-ASCII prefix', '<set attributeName="é:href" to="https://evil.example"/>'],
      ['quotes and spaces', "<set attributeName = ' href' to='#a'/>"],
      ['no quotes', '<set attributeName=href to="#a"/>'],
      ['a src target', '<set attributeName="src" to="https://evil.example"/>'],
    ])('refuses a <set> on a link with %s', (_, element) => {
      expect(scan(svg(`<a href="#x">${element}</a>`))).toBe(
        'animates a link or an event attribute with <set> or <animate>',
      );
    });

    it('refuses a <set> that sets an event attribute', () => {
      expect(scan(svg('<rect><set attributeName="onclick" to="x()"/></rect>'))).toBe(
        'animates a link or an event attribute with <set> or <animate>',
      );
    });

    it('refuses @import', () => {
      expect(scan(svg('<style>@import "https://evil.example/a.css";</style>'))).toBe(
        'imports a stylesheet with @import',
      );
    });

    it('refuses @import hidden by a CSS escape', () => {
      expect(scan(svg('<style>@\\69mport "https://evil.example/a.css";</style>'))).toBe(
        'imports a stylesheet with @import',
      );
    });

    it.each([
      ['image-set()', svg('<rect style="fill:image-set(\'https://evil.example/a.png\' 1x)"/>')],
      ['-webkit-image-set()', svg('<style>rect{background:-webkit-image-set("a.png" 1x)}</style>')],
      ['cross-fade()', svg("<rect style=\"background:cross-fade('a.png', 'b.png', 50%)\"/>")],
      ['image()', svg('<rect style="fill:image(\'https://evil.example/a.png\')"/>')],
      ['src()', svg('<style>rect{background:src("https://evil.example/a.png")}</style>')],
    ])('refuses %s, which loads an image from a plain string', (_, content) => {
      expect(scan(content)).toBe('loads an image with image-set(), cross-fade(), image() or src()');
    });

    it.each([
      ['in a <style> element', svg('<style>rect{fill:url(https://evil.example/a.png)}</style>')],
      ['hidden by a CSS hex escape', svg('<rect style="fill:u\\72l(https://evil.example/a)"/>')],
      [
        'hidden by an escaped parenthesis',
        svg('<rect style="fill:url\\(https://evil.example/a)"/>'),
      ],
      ['in a style attribute', svg('<rect style="background:url(\'//evil.example/a\')"/>')],
      ['in a presentation attribute', svg('<rect fill="url(other.svg#g)"/>')],
    ])('refuses an external CSS url() %s', (_, content) => {
      expect(scan(content)).toMatch(/^has a CSS url\(\) that points outside the file/);
    });
  });

  it('refuses javascript: and vbscript: anywhere, even split by whitespace', () => {
    expect(scan(svg('<text>java\n script:alert(1)</text>'))).toBe(
      'contains a javascript: or vbscript: URL',
    );
    expect(scan(svg('<desc>vbscript:x</desc>'))).toBe('contains a javascript: or vbscript: URL');
  });

  describe('size', () => {
    it(`accepts a file of exactly ${MAX_SVG_BYTES} bytes`, () => {
      const filler = 'a'.repeat(MAX_SVG_BYTES - Buffer.byteLength(svg('<text></text>')));
      const content = svg(`<text>${filler}</text>`);
      expect(Buffer.byteLength(content)).toBe(MAX_SVG_BYTES);
      expect(scan(content)).toBeNull();
    });

    it('refuses a larger file before decoding it, so a compressible file cannot exhaust the memory', () => {
      expect(scan(Buffer.alloc(MAX_SVG_BYTES + 1, 0x61))).toBe(
        'is larger than 5 MB, far more than an icon or an illustration needs',
      );
    });
  });

  describe('stays linear on crafted files (the archive decompresses to 50 MB)', () => {
    const LARGE = 1_000_000;
    it.each([
      ['repeated <set', '<set '.repeat(LARGE / 5)],
      ['repeated <!DOCTYPE', '<!DOCTYPE '.repeat(LARGE / 10)],
      ['repeated element starts', '<abcdefgh'.repeat(LARGE / 9)],
      ['a long run after attributeName=', `<set attributeName=${' '.repeat(LARGE)}`],
      ['repeated attribute names', ' abcdefgh'.repeat(LARGE / 9)],
      ['repeated quoted data URLs without end', '"data:image/png;base64,AAAA'.repeat(LARGE / 27)],
      ['repeated url(', 'url( '.repeat(LARGE / 5)],
      ['repeated CSS escapes', '\\72'.repeat(LARGE / 3)],
      ['repeated link names with unclosed values', ' href="#'.repeat(LARGE / 8)],
      ['repeated link names without values', ' href='.repeat(LARGE / 6)],
    ])('%s', (_, content) => {
      const start = performance.now();
      scan(svg(content));
      expect(performance.now() - start).toBeLessThan(2000);
    });
  });

  it('replaces an out-of-range character reference instead of throwing', () => {
    expect(scan(svg('<text>&#x110000;&#99999999999999999999;</text>'))).toBeNull();
  });
});
