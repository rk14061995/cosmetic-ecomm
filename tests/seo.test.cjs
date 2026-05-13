const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTsModule(tsPath) {
  const source = fs.readFileSync(tsPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    process,
    __filename: tsPath,
    __dirname: path.dirname(tsPath),
  };
  vm.runInNewContext(outputText, sandbox, { filename: tsPath });
  return module.exports;
}

const seo = loadTsModule(path.join(__dirname, '..', 'lib', 'seo.ts'));

test('getSiteName reads env and trims spaces', () => {
  const prev = process.env.NEXT_PUBLIC_SITE_NAME;
  process.env.NEXT_PUBLIC_SITE_NAME = '  KosmeticX  ';
  assert.equal(seo.getSiteName(), 'KosmeticX');
  process.env.NEXT_PUBLIC_SITE_NAME = prev;
});

test('getSiteName falls back when env is empty', () => {
  const prev = process.env.NEXT_PUBLIC_SITE_NAME;
  process.env.NEXT_PUBLIC_SITE_NAME = '   ';
  assert.equal(seo.getSiteName(), 'KosmeticX');
  process.env.NEXT_PUBLIC_SITE_NAME = prev;
});

test('getSiteUrl strips trailing slashes', () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://kosmeticx.com///';
  assert.equal(seo.getSiteUrl(), 'https://kosmeticx.com');
  process.env.NEXT_PUBLIC_SITE_URL = prev;
});

test('sectionMetadata injects branded title in OG and Twitter', () => {
  const prevName = process.env.NEXT_PUBLIC_SITE_NAME;
  const prevUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_NAME = 'KosmeticX';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://kosmeticx.com';

  const data = seo.sectionMetadata({
    title: 'Sale',
    description: 'Big offers',
    path: '/sale',
  });

  assert.equal(data.openGraph.title, 'Sale | KosmeticX');
  assert.equal(data.twitter.title, 'Sale | KosmeticX');
  assert.equal(data.openGraph.url, 'https://kosmeticx.com/sale');

  process.env.NEXT_PUBLIC_SITE_NAME = prevName;
  process.env.NEXT_PUBLIC_SITE_URL = prevUrl;
});
