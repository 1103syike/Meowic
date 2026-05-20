const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'MEOWIC_SECRET_KEY';
const EXPIRES_IN = '1h';

server.use(middlewares);
server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

server.post('/upload', (req, res) => {
  const { fileName, dataUrl, fileType } = req.body;

  if (!fileName || !dataUrl || !fileType) {
    return res.status(400).json({ message: '缺少上傳檔案資料' });
  }

  const safeFileName = path.basename(fileName).replace(/\s+/g, '_');
  const base64Data = dataUrl.replace(/^data:.*;base64,/, '');
  const isAudio = fileType.startsWith('audio/');
  const uploadDir = isAudio ? path.join(__dirname, 'src', 'assets', 'audio') : path.join(__dirname, 'public', 'mock', 'upload');
  const publicPath = isAudio ? `assets/audio/${safeFileName}` : `./mock/upload/${safeFileName}`;

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, safeFileName), base64Data, 'base64');

  res.status(200).json({ path: publicPath });
});

server.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = router.db.get('users').value();

  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    const accessToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: EXPIRES_IN,
    });
    res.status(200).json({ accessToken });
  } else {
    res.status(401).json({ message: '帳號或密碼錯誤' });
  }
});

server.use(router);

server.listen(3000, () => {
  console.log('✅ 舊的套件已清除');
  console.log('🚀 新的驗證伺服器已啟動：http://localhost:3000');
});
