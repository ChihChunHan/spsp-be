const app = require("express")();
const { v4 } = require("uuid");
const { sql } = require("@vercel/postgres");
const jwt = require("jsonwebtoken");
const secretKey = "secret_key";

const authenticate = (req, res, next) => {
  const accessToken = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken;
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(accessToken, secretKey);
    req.user = decoded.user
    next();
  } catch (error) {
    if(!refreshToken) {
      return res.status(401).json({ message: "Access denied. No fresh token provided." });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, secretKey);
      const accessToken = jwt.sign({ user: decoded.user }, secretKey, { expiresIn: "1h" });

      res.header("Authorization", accessToken).cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict"
      }).send(decoded.user);
    }
    catch (error) {
      return res.status(400).json({ message: "Invalid token." });
    }
  }
}

app.post("/api/user/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route." });
});

app.post("/api/user/login", (req, res) => {
  const user = {
    id: 1,
    user: "hanc"
  }

  const accessToken = jwt.sign(user, secretKey, { expiresIn: "1h" });
  const refreshToken = jwt.sign(user, secretKey, { expiresIn: "1d" });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict"
  }).header("Authorization", accessToken).send(user)
});

app.post("/api/user/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const accessToken = jwt.sign({ user: decoded.user }, secretKey, { expiresIn: "1h" });
    res.header("Authorization", accessToken).send({ message: "Refreshed token." });
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
});


// app.get("/api/user", (req, res) => {
//   const path = `/api/item/${v4()}`;
//   res.setHeader("Content-Type", "text/html");
//   res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
//   res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
// });

// app.get("/api/user/item/:slug", (req, res) => {
//   const { slug } = req.params;
//   res.end(`Item: ${slug}`);
// });

// app.get("/api/user/users", async (req, res) => {
//   const users = await sql`SELECT * FROM userinfo`;
//   res.json(users);
// });

module.exports = app;
