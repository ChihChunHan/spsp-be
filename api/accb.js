import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

class GoogleSheet {
  credentials = JSON.parse(process.env.GOO_CREDENTIALS);
  scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  constructor(sheetId) {
    this.sheetId = sheetId;
    this.auth = new google.auth.GoogleAuth({
      credentials: this.credentials,
      scopes: this.scopes,
    });
  }

  async read(range) {
    const client = await this.auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: range,
    });
    return response;
  }
  async write(range, values) {
    const client = await this.auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      /*
        "RAW": 表示輸入值將按照它們的原始格式存儲，不做任何轉換。例如，字符串就保持為字符串，數字保持為數字。
        "USER_ENTERED": 表示輸入值將被解析，就像使用者在 Google Sheets UI 中輸入一樣。例如，字符串 "=SUM(A1:A5)" 將被解析為公式，而不是純文字。
      */
      resource: {
        values: values,
      },
    });
    return response;
  }
  async push(value) {
    try {
      const worksheet = "RECORD";
      const range = `${worksheet}!A:A`;
      const readResponse = await this.read(range);
      const currentValues = readResponse.data.values;
      const startCol = String.fromCharCode(65); // ASCII of A
      const endCol = String.fromCharCode(startCol + value.length - 1);
      const nextRow = currentValues ? currentValues.length + 1 : 1;
      const response = await this.write(
        `${worksheet}!${startCol}${nextRow}:${endCol}${nextRow}`,
        [value],
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  }
}

const myAccb = new GoogleSheet("14oKIc5EgiioMOQhlIuTu1pm4Gz0NEYEOcEC3FqGvFVw");
const homeAccb = new GoogleSheet(
  "1DGgwXqtVHqud8zO1sm5SsJxCdDTCnCaJw71vj1FmIGE",
);

const app = express();
app.use(express.json());

const token = "1234";
// Create the middleware function
const authMiddleware = (req, res, next) => {
  if (req?.headers?.["h-auth"] === token) {
    // Auth successful, continue to the next middleware or route handler
    next();
  } else {
    // Auth failed, send 401 Unauthorized response
    res.status(401).send("Unauthorized");
  }
};

app.get("/api/accb", authMiddleware, async (req, res) => {
  res.status(200).send("Hello World");
});

app.post("/api/accb/home/add", authMiddleware, async (req, res) => {
  try {
    const { TIME, ACCOUNT, AMOUNT, PAYMENT, CATEGORY, DESCRIPTION } = req.body;
    await homeAccb.push([
      TIME,
      ACCOUNT,
      AMOUNT,
      PAYMENT,
      CATEGORY,
      DESCRIPTION,
    ]);
    // const {
    //   data: { values },
    // } = await homeAccb.read("overview!A:Z");
    // const [bName, , bValue] = values.find(
    //   (el) => el[1] === req.body?.BANK_CODE,
    // );
    // const isNegativeAmount = req.body?.AMOUNT < 0;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(`[記帳成功]`);
    // res.status(200).send(`
    //   [記帳成功] 帳戶：${bName}｜${isNegativeAmount ? "支出" : "收入"}：${req.body?.AMOUNT}｜餘額：${bValue}
    //   `);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "unable to add",
    });
  }
});

app.post("/api/accb/han/add", authMiddleware, async (req, res) => {
  try {
    const { TIME, BANK_CODE, AMOUNT } = req.body;
    await myAccb.push([TIME, BANK_CODE, AMOUNT]);
    const {
      data: { values },
    } = await myAccb.read("overview!A:Z");
    const [bName, , bValue] = values.find((el) => el[1] === BANK_CODE);
    const isNegativeAmount = AMOUNT < 0;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(`
      [記帳成功] 帳戶：${bName}｜${isNegativeAmount ? "支出" : "收入"}：${req.body?.AMOUNT}｜餘額：${bValue}
      `);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "unable to add",
    });
  }
});

if (process.env.IS_DEV) {
  app.listen(3000, () => console.log("Server is running on port 3000"));
}
export default app;
