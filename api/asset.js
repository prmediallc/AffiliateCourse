const fs = require("fs");
const path = require("path");
const { isAuthorized } = require("./_auth");

const allowed = {
  "app.js": "application/javascript; charset=utf-8",
};

module.exports = function handler(req, res) {
  if (!isAuthorized(req)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  const name = String(req.query.name || "");
  if (!allowed[name]) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const file = path.join(process.cwd(), "private", name);
  res.statusCode = 200;
  res.setHeader("Content-Type", allowed[name]);
  res.end(fs.readFileSync(file, "utf8"));
};
