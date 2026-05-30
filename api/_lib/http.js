function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, status, body) {
  setCors(res);
  if (status === 204) {
    res.status(204).end();
    return;
  }
  res.status(status).json(body);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return {};
}

module.exports = { setCors, sendJson, readBody };
