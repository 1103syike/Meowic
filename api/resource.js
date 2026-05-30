const {
  listResource,
  getById,
  createResource,
  updateResource,
  deleteResource,
} = require('./_lib/resources');
const { setCors, sendJson, readBody } = require('./_lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const resource = req.query.resource;
  const id = req.query.id ? Number(req.query.id) : null;

  try {
    if (req.method === 'GET') {
      if (id) {
        const result = await getById(resource, id);
        return sendJson(res, result.status, result.body);
      }
      const result = await listResource(resource, req.query);
      return sendJson(res, result.status, result.body);
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const result = await createResource(resource, body);
      return sendJson(res, result.status, result.body);
    }

    if (req.method === 'PATCH' && id) {
      const body = await readBody(req);
      const result = await updateResource(resource, id, body);
      return sendJson(res, result.status, result.body);
    }

    if (req.method === 'DELETE' && id) {
      const result = await deleteResource(resource, id);
      return sendJson(res, result.status, result.body);
    }

    return sendJson(res, 405, { message: '不支援的 HTTP 方法' });
  } catch (error) {
    console.error('[api/resource]', error);
    return sendJson(res, 500, { message: error.message || '伺服器錯誤' });
  }
};
