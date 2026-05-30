/**
 * 將 db.json 匯入 Firestore，並建立 Firebase Auth 帳號
 *
 * 1. Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰
 * 2. 存成專案根目錄 serviceAccountKey.json（勿提交 git）
 * 3. 啟用 Authentication（Email/密碼）、Firestore、Storage
 * 4. 執行：npm run firebase:seed
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { toAuthEmail } from './firebase-auth-seed.util.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
function resolveServiceAccountPath() {
  const defaultPath = path.join(root, 'serviceAccountKey.json');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  const matches = fs
    .readdirSync(root)
    .filter((name) => name.endsWith('.json') && name.includes('firebase-adminsdk'));
  if (matches.length === 1) {
    return path.join(root, matches[0]);
  }
  return null;
}

const keyPath = resolveServiceAccountPath();
const dbPath = path.join(root, 'db.json');

if (!keyPath) {
  console.error('找不到 serviceAccountKey.json，請從 Firebase Console 下載服務帳戶金鑰。');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const COLLECTIONS = [
  'users',
  'artists',
  'albums',
  'songs',
  'playlists',
  'playlistUsers',
  'playlistSongs',
  'advertisements',
  'homeRecommendations',
  'songPlays',
];

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (!snap.size) return;
  const batch = db.batch();
  snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

async function seedCollection(name, rows = []) {
  for (const row of rows) {
    await db.collection(name).doc(String(row.id)).set(row);
  }
  console.log(`  ✓ ${name}: ${rows.length} 筆`);
}

function toAuthPassword(password) {
  const value = String(password || '123');
  // Firebase Auth 要求至少 6 字元；mock 密碼 "123" 改為 meowic123
  return value.length >= 6 ? value : 'meowic123';
}

async function ensureAuthUser(user) {
  const authEmail = toAuthEmail(user.email || user.phone || String(user.id));
  const password = toAuthPassword(user.password);

  try {
    const record = await auth.createUser({
      email: authEmail,
      password,
      displayName: user.name,
    });
    return { authEmail, authUid: record.uid };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      const record = await auth.getUserByEmail(authEmail);
      await auth.updateUser(record.uid, { password, displayName: user.name });
      console.log(`  ↻ Auth 更新: ${authEmail}`);
      return { authEmail, authUid: record.uid };
    }
    console.warn(`  ! Auth 略過 ${authEmail}:`, error.message);
    return { authEmail, authUid: null };
  }
}

async function seedAuthUsers(users = []) {
  for (const user of users) {
    const { authEmail, authUid } = await ensureAuthUser(user);
    await db
      .collection('users')
      .doc(String(user.id))
      .set({
        ...user,
        password: '',
        authEmail,
        ...(authUid ? { authUid } : {}),
      });
    console.log(`  ✓ users/${user.id} (${authEmail})`);
  }
}

async function main() {
  console.log('清空 Firestore 集合...');
  for (const name of COLLECTIONS) {
    await clearCollection(name);
  }

  console.log('建立 Firebase Auth + users...');
  await seedAuthUsers(data.users ?? []);

  console.log('匯入其他集合...');
  for (const name of COLLECTIONS) {
    if (name === 'users') continue;
    await seedCollection(name, data[name] ?? []);
  }

  console.log('✅ Firestore 與 Auth 種子資料完成');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
