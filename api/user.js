const app = require("express")();
const { v4 } = require("uuid");
const { sql } = require("@vercel/postgres");

app.get("/api/user", (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get("/api/user/item/:slug", (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});

app.get("/api/user/users", async (req, res) => {
  const users = await sql`SELECT * FROM userinfo`;
  res.json(users);
});

module.exports = app;
