import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.css']);
const ignoreFragments = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}contexts${path.sep}GameContext_utf8.tsx`,
  `${path.sep}temp_`,
  `${path.sep}ActionModal.head.tsx`,
  `${path.sep}tmp_ActionModal_HEAD.tsx`,
];

const suspiciousTokens = [
  'Ã¡', 'Ã¢', 'Ã£', 'Ãª', 'Ã©', 'Ã­', 'Ã³', 'Ã´', 'Ãº', 'Ã§',
  'Ã‰', 'ÃŠ', 'Ã“', 'Ã”', 'Ãš', 'Ã‡',
  'Âº', 'Âª', 'Â°', 'â€”', 'â€“', 'â€œ', 'â€\u009d', 'â€\u0099',
  'ý', 'þ', 'ÿ', '\uFFFD',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (ignoreFragments.some(fragment => full.includes(fragment))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const findings = [];

for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const token of suspiciousTokens) {
    const index = text.indexOf(token);
    if (index === -1) continue;
    const excerpt = text.slice(Math.max(0, index - 30), Math.min(text.length, index + 50)).replace(/\s+/g, ' ');
    findings.push({
      file: path.relative(root, file),
      token,
      excerpt,
    });
    break;
  }
}

if (findings.length > 0) {
  console.error('Encoding issues detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.token} :: ${finding.excerpt}`);
  }
  process.exit(1);
}

console.log('Encoding check passed.');
