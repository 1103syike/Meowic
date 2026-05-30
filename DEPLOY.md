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
3. 下載的 JSON 重新命名為 **`serviceAccountKey.json`**，放在專案根目錄（勿 commit）
4. 執行：

```bash
npm run firebase:check
npm run firebase:seed
```

成功後 Firestore 應有：`songs`、`albums`、`artists`、`users` 等。

### 測試登入

| 輸入帳號 | 密碼 | 實際 Auth Email |
|----------|------|-----------------|
| dandy | 123 | dandy@meowic.app |
| wendy | 123 | wendy@meowic.app |
| laotei | 123 | laotei@meowic.app |

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

`git push` 後 Vercel 會自動建置。

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
| 沒歌曲 | 執行 `npm run firebase:seed` |
| 登入失敗 | 確認 Auth 已啟用 Email/密碼，且已 seed |
| permission denied | 執行 `npm run deploy:rules` |
| CMS 上傳失敗 | 確認已登入、Storage 已建立 |
| 找不到 Storage | 需 Blaze；位置在「專案建置 → Storage」 |
