// api/_utils.js
function getBaseUrl(req) {
  // Prefer explicit env if provided
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
}

async function readJson(req) {
  const raw = await readRawBody(req);
  if (!raw || raw.length === 0) return {};
  return JSON.parse(raw.toString("utf8"));
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

module.exports = { getBaseUrl, readRawBody, readJson, send };
