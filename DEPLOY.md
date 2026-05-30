# Meowic 部署指南（Firebase）

本專案使用 **Firebase** 作為後端：

| 功能 | Firebase 產品 |
|------|----------------|
| 登入／註冊 | Authentication（Email/密碼） |
| 歌曲、專輯、CMS 資料 | Cloud Firestore |
| 音樂／圖片上傳 | Cloud Storage |
| 流量分析（正式環境） | Analytics |
| 網站託管 | Firebase Hosting 或 Vercel（僅靜態前端） |

設定已寫在 `src/environments/environment.ts`（專案：`meowic-b1cb6`）。

---

## 一、Firebase Console 必做設定

1. 開啟 [Firebase Console](https://console.firebase.google.com/) → 專案 **meowic-b1cb6**
2. **Build → Authentication** → Sign-in method → 啟用 **電子郵件/密碼**
3. **Build → Firestore Database** → 建立資料庫（測試模式可先開，之後改規則）
4. **Build → Storage** → 開始使用
5. **專案設定 → 一般** → 確認 Web App 設定與 `environment.ts` 一致

---

## 二、匯入種子資料（db.json）

1. **專案設定 → 服務帳戶** → 「產生新的私密金鑰」→ 存成根目錄 `serviceAccountKey.json`（已在 `.gitignore`，勿提交）
2. 執行：

```bash
npm install
npm run firebase:seed
```

會建立 Firestore 集合，並為 mock 使用者建立 Auth 帳號：

| 帳號 | 密碼 | Auth Email |
|------|------|------------|
| dandy | 123 | dandy@meowic.app |
| wendy | 123 | wendy@meowic.app |
| laotei | 123 | laotei@meowic.app |

登入時仍輸入 **dandy** + 密碼 **123**（系統會自動轉成 `@meowic.app`）。

---

## 三、部署 Firestore / Storage 規則

安裝 [Firebase CLI](https://firebase.google.com/docs/cli) 後：

```bash
firebase login
firebase use meowic-b1cb6
firebase deploy --only firestore:rules,storage
```

---

## 四、本機開發

```bash
npm start
```

不需再跑 `npm run api` 或 `dev:api`（已移除 Vercel API / Neon 後端）。

---

## 五、部署網站

### 方案 A：Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### 方案 B：Vercel（只放 Angular 靜態檔）

- Build：`npm run build`
- Output：`dist/meowic/browser`
- 資料與上傳仍走 Firebase，與 Hosting 無關

---

## 六、帳號格式說明

- 使用者輸入 `dandy` 或 `dandy@mail.com` 皆可
- 無 `@` 的帳號會對應 Firebase Auth：`帳號@meowic.app`
- Firestore `users` 文件保留原本的 `email` 顯示欄位與 `authEmail` 對照欄位

---

## 七、常見問題

**Q: 登入顯示帳號或密碼錯誤？**  
先執行 `npm run firebase:seed`，並確認 Authentication 已啟用 Email/密碼。

**Q: CMS 上傳失敗？**  
確認 Storage 已建立，且已部署 `storage.rules`；使用者需已登入。

**Q: 讀不到歌曲資料？**  
確認 Firestore 已有 `songs` 等集合（seed 腳本），且規則允許讀取。
