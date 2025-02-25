import express from "express";

const app = express();

// app.listen(3000, () => console.log("Server is running on port 3000"));

const token = "1234";

const shortcutAuth = (req) => req?.headers?.["h-auth"] === token;

app.get("/api/accb", async (req, res) => {
  if (shortcutAuth(req)) {
    res.status(200).send("Hello World");
  }
  res.status(401).send("Unauthorized");
});

export default app;
