const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'MEOWIC_SECRET_KEY';
const EXPIRES_IN = '1h';

server.use(middlewares);
server.use(jsonServer.bodyParser);

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
