import express from "express";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const secretKey = "secret_key";

const authenticate = (req, res, next) => {
  const access_token = req.cookies.access_token;
  if (!access_token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const data = jwt.verify(access_token, secretKey);
    return next(data);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Invalid token." });
  }
};

// const _authenticate = (req, res, next) => {
//   console.log(req);
//   const accessToken = req.headers.authorization;
//   const refreshToken = req.cookies.refreshToken;

//   if (!accessToken && !refreshToken) {
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(accessToken, secretKey);
//     req.user = decoded.user;
//     next();
//   } catch (error) {
//     if (!refreshToken) {
//       return res
//         .status(401)
//         .json({ message: "Access denied. No fresh token provided." });
//     }

//     try {
//       const decoded = jwt.verify(refreshToken, secretKey);
//       const accessToken = jwt.sign({ user: decoded.user }, secretKey, {
//         expiresIn: "1h",
//       });

//       res
//         .header("Authorization", accessToken)
//         .cookie("refreshToken", refreshToken, {
//           httpOnly: true,
//           sameSite: "strict",
//         })
//         .send(decoded.user);
//     } catch (error) {
//       return res.status(400).json({ message: "Invalid token." });
//     }
//   }
// };

app.post("/api/user/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route." });
});

app.post("/api/user/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // return res.status(200).json(req.body)

  const user = {
    id: 1,
    user: username,
  };

  await sql`INSERT INTO userinfo (username, email, password) VALUES (${username}, ${email}, ${password})`;

  const accessToken = jwt.sign(user, secretKey, { expiresIn: "1h" });
  const refreshToken = jwt.sign(user, secretKey, { expiresIn: "1d" });

  res
    .cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .status(200)
    .send({ message: "Signed up." });
});

app.post("/api/user/login", (req, res) => {
  const user = {
    id: 1,
    user: "hanc",
  };

  const accessToken = jwt.sign(user, secretKey, { expiresIn: "1h" });

  res
    .cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .status(200)
    .send({ message: "Logged in." });
});

app.get("/api/user/logout", (req, res) => {
  return res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Logged out." });
});

app.post("/api/user/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const accessToken = jwt.sign({ user: decoded.user }, secretKey, {
      expiresIn: "1h",
    });
    res
      .header("Authorization", accessToken)
      .send({ message: "Refreshed token." });
  } catch (err) {
    console.log(err);
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

// listen to port 3000
// app.listen(3000, () => console.log("Server is running on port 3000"));
