/**
 * 檢查本機 Firebase 設定是否就緒
 * 執行：npm run firebase:check
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const keyPath = path.join(root, 'serviceAccountKey.json');
const envPath = path.join(root, 'src/environments/environment.ts');

let ok = true;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  ok = false;
}

console.log('Meowic Firebase 本機檢查\n');

if (fs.existsSync(keyPath)) {
  pass('serviceAccountKey.json 存在（可執行 firebase:seed）');
} else {
  fail('缺少 serviceAccountKey.json → Firebase Console → 專案設定 → 服務帳戶 → 產生私密金鑰');
}

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  if (env.includes('meowic-b1cb6') && !env.includes('YOUR_API_KEY')) {
    pass('environment.ts 已設定 meowic-b1cb6');
  } else {
    fail('environment.ts Firebase 設定未完成');
  }
} else {
  fail('找不到 environment.ts');
}

for (const file of ['firestore.rules', 'storage.rules', 'firebase.json', '.firebaserc']) {
  if (fs.existsSync(path.join(root, file))) {
    pass(`${file} 存在`);
  } else {
    fail(`缺少 ${file}`);
  }
}

console.log('');
if (ok) {
  console.log('可執行：npm run firebase:seed');
} else {
  console.log('請先完成上述項目，再執行 seed。');
}
process.exit(ok ? 0 : 1);
