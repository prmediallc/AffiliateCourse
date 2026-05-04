const fs = require("fs");
const path = require("path");
const { isAuthorized } = require("./_auth");

module.exports = function handler(req, res) {
  if (!isAuthorized(req)) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
    return;
  }

  const file = path.join(process.cwd(), "private", "course.html");
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(fs.readFileSync(file, "utf8"));
};
