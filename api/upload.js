const path = require('path');
const { put } = require('@vercel/blob');
const { setCors, sendJson, readBody } = require('./_lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: '僅支援 POST' });
  }

  try {
    const { fileName, dataUrl, fileType } = await readBody(req);
    if (!fileName || !dataUrl || !fileType) {
      return sendJson(res, 400, { message: '缺少上傳檔案資料' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return sendJson(res, 503, {
        message:
          '尚未設定 BLOB_READ_WRITE_TOKEN。請在 Vercel 專案 Storage 建立 Blob store，或參考 DEPLOY.md。',
      });
    }

    const originalExtension = path.extname(path.basename(fileName));
    const fallbackExtension = fileType.startsWith('audio/') ? '.mp3' : '.jpg';
    const safeExtension = originalExtension || fallbackExtension;
    const folder = fileType.startsWith('audio/') ? 'audio' : 'upload';
    const safeFileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    const base64Data = dataUrl.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const blob = await put(safeFileName, buffer, {
      access: 'public',
      contentType: fileType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return sendJson(res, 200, { path: blob.url });
  } catch (error) {
    console.error('[api/upload]', error);
    return sendJson(res, 500, { message: error.message || '上傳失敗' });
  }
};
