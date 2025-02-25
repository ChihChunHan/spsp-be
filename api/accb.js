import express from "express";

const app = express();

// app.listen(3000, () => console.log("Server is running on port 3000"));

app.get("/api/accb", async (req, res) => {
  res.json({
    message: "Hello from accb!",
  });
});

module.exports = app;
