const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({ bodyParser: false });

const SECRET_KEY = 'MEOWIC_SECRET_KEY';
const EXPIRES_IN = '1h';
const PUBLIC_ORIGIN = 'http://localhost:3000';

server.use(middlewares);

const largeJsonParser = bodyParser.json({ limit: '50mb' });
const largeUrlencodedParser = bodyParser.urlencoded({ extended: true, limit: '50mb' });

server.post('/upload', largeJsonParser, largeUrlencodedParser, (req, res) => {
  const { fileName, dataUrl, fileType } = req.body;

  if (!fileName || !dataUrl || !fileType) {
    return res.status(400).json({ message: '缺少上傳檔案資料' });
  }

  const originalExtension = path.extname(path.basename(fileName));
  const fallbackExtension = fileType.startsWith('audio/') ? '.mp3' : '.jpg';
  const safeExtension = originalExtension || fallbackExtension;
  const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
  const base64Data = dataUrl.replace(/^data:.*;base64,/, '');
  const isAudio = fileType.startsWith('audio/');
  const uploadDir = isAudio
    ? path.join(__dirname, 'public', 'assets', 'audio')
    : path.join(__dirname, 'public', 'mock', 'upload');
  const publicPath = isAudio
    ? `${PUBLIC_ORIGIN}/assets/audio/${safeFileName}`
    : `${PUBLIC_ORIGIN}/mock/upload/${safeFileName}`;

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, safeFileName), base64Data, 'base64');

  res.status(200).json({ path: publicPath });
});

server.post('/login', largeJsonParser, largeUrlencodedParser, (req, res) => {
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

server.get('/songPlays', (req, res) => {
  if (!router.db.has('songPlays').value()) {
    router.db.set('songPlays', []).write();
  }

  res.status(200).json(router.db.get('songPlays').value());
});

server.post('/songPlays', largeJsonParser, largeUrlencodedParser, (req, res) => {
  if (!router.db.has('songPlays').value()) {
    router.db.set('songPlays', []).write();
  }

  const songId = Number(req.body.songId);
  if (!songId) {
    return res.status(400).json({ message: 'songId is required' });
  }

  const nextId = (router.db.get('songPlays').map('id').max().value() || 0) + 1;
  const play = {
    id: nextId,
    songId,
    userId: req.body.userId ?? null,
    playedAt: req.body.playedAt || new Date().toISOString(),
    duration: Number(req.body.duration) || 0,
    listenedSeconds: Number(req.body.listenedSeconds) || 0,
  };

  router.db.get('songPlays').push(play).write();

  const song = router.db.get('songs').find({ id: songId });
  if (song.value()) {
    const currentPlayCount = Number(song.get('playCount').value()) || 0;
    song.assign({ playCount: currentPlayCount + 1 }).write();
  }

  res.status(201).json(play);
});

server.use(router);

server.listen(3000, () => {
  console.log('✅ 舊的套件已清除');
  console.log('🚀 新的驗證伺服器已啟動：http://localhost:3000');
});
