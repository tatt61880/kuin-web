import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const distDir = process.argv[2] || 'dist';
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

// dist配下の絶対パス -> HTML内で出てくる相対パス表現（/ を使う）へ
function toWebPath(absPath) {
  const rel = path.relative(distDir, absPath);
  return rel.split(path.sep).join('/');
}

function processHtml(filePath, mapping) {
  let html = fs.readFileSync(filePath, 'utf8');

  // src/href の値だけを置換対象にする（雑に全文置換しない）
  html = html.replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (m, attr, quote, url) => {
    // クエリ/ハッシュが付いている場合は分離して戻す
    const [base, tail = ''] = url.split(/(?=[?#])/); // # or ? 以降を残す
    const replaced = mapping.get(base) || base;
    return `${attr}=${quote}${replaced}${tail}${quote}`;
  });

  fs.writeFileSync(filePath, html, 'utf8');
}

function main() {
  const files = walk(distDir);

  // 1) 対象アセットをハッシュ名にリネームし、旧->新の対応表を作る
  // mapping: "path/in/html.js" -> "path/in/html.<hash>.js"
  const mapping = new Map();

  for (const abs of files) {
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

    const oldWeb = toWebPath(abs);
    const newWeb = toWebPath(newAbs);
    // HTMLでは "./" が付く場合もあるので両方対応しておく
    mapping.set(oldWeb, newWeb);
    mapping.set('./' + oldWeb, './' + newWeb);
    mapping.set('/' + oldWeb, '/' + newWeb);
  }

  // 2) dist内の全HTMLの参照を書き換える
  for (const abs of walk(distDir)) {
    if (abs.toLowerCase().endsWith('.html')) {
      processHtml(abs, mapping);
    }
  }

  console.log(`hashed files: ${mapping.size / 3} (html rewrite done)`);
}

main();
