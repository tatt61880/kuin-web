import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const distDir = path.resolve(process.argv[2] || 'dist');
const extsToHash = new Set(['.js', '.mjs', '.css']); // 必要なら増やす

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function sha16(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

// すでに foo.<16hex>.js みたいな名前なら二重ハッシュしない
function alreadyHasHash(fileBase, ext) {
  const re = new RegExp(`\\.[0-9a-f]{16}\\${ext}$`, 'i');
  return re.test(fileBase + ext);
}

// dist配下の絶対パス -> distルート基準のWebパス（/ を使う）へ
function toWebPath(absPath) {
  const rel = path.relative(distDir, absPath);
  return rel.split(path.sep).join('/');
}

function splitUrl(url) {
  const match = url.match(/^([^?#]*)([?#].*)?$/);
  return {
    base: match?.[1] ?? url,
    tail: match?.[2] ?? '',
  };
}

function isSkippableUrl(base) {
  return base === '' || base.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(base);
}

function resolveAssetPath(htmlFilePath, base) {
  if (base.startsWith('/')) {
    return path.resolve(distDir, '.' + base);
  }

  return path.resolve(path.dirname(htmlFilePath), base);
}

function toRelativeWebPath(fromDir, toAbs, keepDotSlash) {
  let rel = path.relative(fromDir, toAbs).split(path.sep).join('/');

  if (!rel.startsWith('.') && keepDotSlash) rel = './' + rel;

  return rel;
}

function processHtml(filePath, mapping) {
  let html = fs.readFileSync(filePath, 'utf8');
  const htmlDir = path.dirname(filePath);

  // src/href の値だけを置換対象にする（雑に全文置換しない）
  html = html.replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (m, attr, quote, url) => {
    const { base, tail } = splitUrl(url); // ? や # 以降を残す
    if (isSkippableUrl(base)) return m;

    const abs = resolveAssetPath(filePath, base);
    const newAbs = mapping.get(toWebPath(abs));
    if (!newAbs) return m;

    const replaced = base.startsWith('/') ? '/' + toWebPath(newAbs) : toRelativeWebPath(htmlDir, newAbs, base.startsWith('./'));

    return `${attr}=${quote}${replaced}${tail}${quote}`;
  });

  fs.writeFileSync(filePath, html, 'utf8');
}

function main() {
  const files = walk(distDir);

  // 1) 対象アセットをハッシュ名にリネームし、旧->新の対応表を作る
  // mapping: distルート基準の旧パス -> ハッシュ化後の絶対パス
  const mapping = new Map();

  function shouldSkipHash(absPath) {
    const rel = path.relative(distDir, absPath).split(path.sep).join('/');
    return rel.startsWith('src-noconflict/') || rel.startsWith('lib/');
  }

  for (const abs of files) {
    if (shouldSkipHash(abs)) continue;

    const ext = path.extname(abs).toLowerCase();
    if (!extsToHash.has(ext)) continue;

    const dir = path.dirname(abs);
    const base = path.basename(abs, ext);
    if (alreadyHasHash(base, ext)) continue;

    const buf = fs.readFileSync(abs);
    const h = sha16(buf);
    const newName = `${base}.${h}${ext}`;
    const newAbs = path.join(dir, newName);

    fs.renameSync(abs, newAbs);
    mapping.set(toWebPath(abs), newAbs);
  }

  // 2) dist内の全HTMLの参照を書き換える
  for (const abs of walk(distDir)) {
    if (abs.toLowerCase().endsWith('.html')) {
      processHtml(abs, mapping);
    }
  }

  console.log(`hashed files: ${mapping.size} (html rewrite done)`);
}

main();
