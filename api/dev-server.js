/**
 * 本機開發用 API（port 3001），邏輯與 Vercel Serverless 相同。
 * 執行：npm run dev:api
 */
const http = require('http');
const { URL } = require('url');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const loginHandler = require('./login');
const uploadHandler = require('./upload');
const songPlaysHandler = require('./song-plays');
const homeRecommendationsHandler = require('./home-recommendations');
const resourceHandler = require('./resource');

const RESOURCE_NAMES = new Set([
  'users',
  'artists',
  'albums',
  'songs',
  'playlists',
  'playlistUsers',
  'playlistSongs',
  'advertisements',
]);

const CUSTOM_ROUTES = {
  '/login': loginHandler,
  '/upload': uploadHandler,
  '/songPlays': songPlaysHandler,
  '/homeRecommendations': homeRecommendationsHandler,
};

function createMockReqRes(req, res, { query = {}, body = null } = {}) {
  const mockReq = {
    method: req.method,
    query,
    body,
  };

  const mockRes = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(payload) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...this.headers });
      res.end(JSON.stringify(payload));
    },
    end() {
      res.writeHead(this.statusCode, this.headers);
      res.end();
    },
  };

  return { mockReq, mockRes };
}

function readRequestBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      resolve(null);
      return;
    }

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:3001');
  const pathname = url.pathname;
  const body = await readRequestBody(req);

  try {
    if (CUSTOM_ROUTES[pathname]) {
      const { mockReq, mockRes } = createMockReqRes(req, res, { query: Object.fromEntries(url.searchParams), body });
      return CUSTOM_ROUTES[pathname](mockReq, mockRes);
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 1 && RESOURCE_NAMES.has(segments[0])) {
      const resource = segments[0];
      const id = segments[1] || url.searchParams.get('id');
      const query = Object.fromEntries(url.searchParams);
      query.resource = resource;
      if (id) query.id = id;

      const { mockReq, mockRes } = createMockReqRes(req, res, { query, body });
      return resourceHandler(mockReq, mockRes);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  } catch (error) {
    console.error('[dev-server]', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: error.message }));
  }
});

const PORT = process.env.API_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Meowic API（本機）: http://127.0.0.1:${PORT}`);
});
