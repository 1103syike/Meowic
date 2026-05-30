# Meowic 部署指南（Firebase）

專案：**meowic-b1cb6**（Blaze + Storage 已建立後，依序完成下列步驟）

| 功能 | Firebase 產品 |
|------|----------------|
| 登入／註冊 | Authentication（Email/密碼） |
| 歌曲、專輯、CMS 資料 | Cloud Firestore |
| 音樂／圖片上傳 | Cloud Storage（bucket：`meowic-b1cb6.firebasestorage.app`） |
| 流量分析（正式環境） | Analytics |
| 網站 | Vercel 或 Firebase Hosting |

設定檔：`src/environments/environment.ts`

---

## 快速檢查（本機）

```bash
npm install
npm run firebase:check
```

---

## 一、Firebase Console（你已完成大部分）

| 項目 | 位置（繁體介面） | 狀態 |
|------|------------------|------|
| Authentication → 電子郵件/密碼 | 專案建置 → Authentication → 登入方式 | 請確認已啟用 |
| Firestore | 專案建置 → Firestore Database | 已建立 |
| Storage | 專案建置 → Storage | 建議：**ASIA1**、**標準** 存取頻率 |
| 方案 | 左下角 | **Blaze**（Storage 需要） |

---

## 二、匯入種子資料（必做，否則網站沒歌）

1. [Firebase Console](https://console.firebase.google.com/) → **meowic-b1cb6**
2. **專案設定**（齒輪）→ **服務帳戶** → **產生新的私密金鑰**
3. 下載的 JSON 放到專案根目錄，檔名 **`serviceAccountKey.json`**（若保留 `*-firebase-adminsdk-*.json` 也可，腳本會自動辨識；勿 commit）
4. 執行：

```bash
npm run firebase:check
npm run firebase:seed
```

成功後 Firestore 應有：`songs`、`albums`、`artists`、`users` 等。

### 測試登入

| 輸入帳號 | 密碼 | 實際 Auth Email |
|----------|------|-----------------|
| dandy | meowic123 | dandy@meowic.app |
| wendy | meowic123 | wendy@meowic.app |
| laotei | meowic123 | laotei@meowic.app |

> Firebase Auth 不接受少於 6 字元的密碼，因此 mock 的 `123` 在 seed 時會改為 **meowic123**。

---

## 三、部署安全規則

```bash
npm run deploy:rules
```

（使用專案內 `firebase-tools`，第一次會要求 `npx firebase login`）

或手動：

```bash
npx firebase login
npx firebase use meowic-b1cb6
npx firebase deploy --only firestore:rules,storage
```

規則檔：`firestore.rules`、`storage.rules`（讀取公開、寫入需登入）

---

## 四、本機開發

```bash
npm start
```

開啟 http://localhost:4201

---

## 五、部署網站

### Vercel（目前常用）

- Build：`npm run build`
- Output：`dist/meowic/browser`
- 不需設定資料庫環境變數（Firebase 設定已包在 build 裡）
- **不要**在 Vercel 設定 `DATABASE_URL`（那是已刪除的 Neon 舊 API 才需要）

`git push` 後 Vercel 會自動建置。

#### 線上網址（meowic-3bot）

| 用途 | 網址 |
|------|------|
| Production（正式） | https://meowic-3bot.vercel.app |
| main 分支最新（建議測試用） | https://meowic-3bot-git-main-1103syikes-projects.vercel.app |

> 帶 random hash 的 Preview（例如 `meowic-3bot-oxrf8xyzm-...`）是**某一次** deployment 快照，可能仍是舊版，勿當正式網址。

#### 確認已部署 Firebase 版（不是舊 Neon API）

1. Vercel → **Deployments** → 最新一筆 **Ready**，commit 應為 `d53fa37` 之後（例如 `3861167`）
2. 點該 deployment → **Source**，確認**沒有** `api/` 目錄
3. 瀏覽器 **F12 → Network**：
   - **正確**：`identitytoolkit.googleapis.com`、`firestore.googleapis.com`
   - **錯誤（舊版）**：對你網域的 `/login`、`/songs` 請求，回 `{ message: "DATABASE_URL 未設定..." }`
4. 若 main 已 push 但線上仍舊：Deployments → 最新 main → **⋯ → Redeploy**（勾選 Use existing Build Cache 可取消）

若 redeploy 後仍出現 `DATABASE_URL`，把該 deployment 的 **commit 訊息**貼出以便對照。

### Firebase Hosting（可選）

```bash
npm run deploy:hosting
```

---

## 六、費用說明（Blaze）

- 小專案、少量 mp3／圖片：多半在**免費額度**內
- 可能有 **$300 / 90 天**抵免額（新帳單帳戶）
- 建議在 Google Cloud Console 設定**預算提醒**（例如每月 $5）

---

## 七、常見問題

| 現象 | 處理 |
|------|------|
| `DATABASE_URL 未設定` | **不要**填 Neon。代表 Vercel 仍在跑舊 `api/login.js`；見上方「確認已部署 Firebase 版」，用 `git-main` 網址測並 Redeploy |
| 沒歌曲 | 執行 `npm run firebase:seed` |
| 登入失敗 | 確認 Auth 已啟用 Email/密碼、已 seed，且 Firebase → Authentication → **Authorized domains** 已加入 Vercel 網域 |
| permission denied | 執行 `npm run deploy:rules` |
| CMS 上傳失敗 | 確認已登入、Storage 已建立 |
| 找不到 Storage | 需 Blaze；位置在「專案建置 → Storage」 |
