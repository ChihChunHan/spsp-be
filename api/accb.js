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
      const endCharCode = value.length - 1 + 65; // ASCII of A
      const endCol = String.fromCharCode(endCharCode);
      const nextRow = currentValues ? currentValues.length + 1 : 1;
      const response = await this.write(
        `${worksheet}!A${nextRow}:${endCol}${nextRow}`,
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

const tokens = ["han", "jan"];
// Create the middleware function
const authMiddleware = (req, res, next) => {
  const hAuth = req?.headers?.["h-auth"] ?? "";
  if (tokens.includes(hAuth)) {
    req._recorder = tokens.indexOf(hAuth);
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
    const RECORDER = req._recorder;
    const { TIME, AMOUNT, ACCOUNT, CATEGORY, DESCRIPTION } = req.body;
    await homeAccb.push([
      TIME,
      AMOUNT,
      ACCOUNT,
      CATEGORY,
      DESCRIPTION,
      RECORDER,
    ]);
    const {
      data: {
        values: [oCash, oSpend],
      },
    } = await myAccb.read("overview!B:B");
    const formattedAmount = new Intl.NumberFormat("zh-TW").format(AMOUNT);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(`
      [記帳成功] 家庭帳簿
      ${AMOUNT < 0 ? "支出" : "收入"}：NT$${formattedAmount}
      本月已花費：${oSpend}｜現金餘額：${oCash}
      `);
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
    const formattedAmount = new Intl.NumberFormat("zh-TW").format(AMOUNT);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(`
      [記帳成功] 帳戶：${bName}
      ${AMOUNT < 0 ? "支出" : "收入"}：NT$${formattedAmount}
      餘額：${bValue}
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
