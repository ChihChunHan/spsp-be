import express from "express";

const timetable = {
  toXBT: {
    weekdays: {
      6: [11, 27, 43, 56],
      7: [9, 21, 33, 45, 57],
      8: [9, 21, 33, 45, 57],
      9: [9, 28, 47],
      10: [6, 26, 44],
      11: [2, 20, 38, 56],
      12: [14, 32, 50],
      13: [8, 26, 44],
      14: [2, 20, 38, 56],
      15: [14, 32, 50],
      16: [8, 26, 43, 58],
      17: [10, 22, 35, 47],
      18: [0, 13, 25, 38, 51],
      19: [3, 17, 35, 52],
      20: [11, 28, 45],
      21: [3, 21, 39, 57],
      22: [15, 32, 47],
      23: [3, 18, 35, 51],
      0: [9],
    },
    saturday: {
      6: [11, 28, 44],
      7: [1, 19, 38, 56],
      8: [14, 33, 51],
      9: [9, 27, 45],
      10: [3, 21, 39, 57],
      11: [15, 33, 51],
      12: [9, 27, 45],
      13: [3, 21, 39, 57],
      14: [15, 33, 51],
      15: [9, 27, 45],
      16: [3, 21, 39, 57],
      17: [15, 33, 51],
      18: [9, 27, 45],
      19: [3, 21, 39, 57],
      20: [15, 33, 51],
      21: [9, 27, 45],
      22: [3, 23, 43],
      23: [3, 18, 35, 51],
      0: [9],
    },
    sunday_and_holiday: {
      6: [11, 28, 44],
      7: [1, 19, 38, 56],
      8: [14, 33, 51],
      9: [9, 27, 45],
      10: [3, 21, 39, 57],
      11: [15, 33, 51],
      12: [9, 27, 45],
      13: [3, 21, 39, 57],
      14: [15, 33, 51],
      15: [9, 27, 45],
      16: [3, 21, 39, 57],
      17: [15, 33, 51],
      18: [9, 27, 45],
      19: [3, 21, 39, 57],
      20: [15, 33, 51],
      21: [9, 27, 45],
      22: [3, 23, 43],
      23: [3, 18, 35, 51],
      0: [9],
    },
  },
  toQZ: {
    weekdays: {
      6: [3, 19, 35, 49],
      7: [2, 14, 26, 38, 50],
      8: [2, 14, 26, 38, 50],
      9: [2, 21, 40, 57],
      10: [15, 34, 52],
      11: [10, 28, 46],
      12: [4, 22, 40, 58],
      13: [16, 34, 52],
      14: [10, 28, 46],
      15: [4, 22, 40, 58],
      16: [16, 34, 50],
      17: [3, 15, 28, 41, 53],
      18: [6, 19, 31, 44, 57],
      19: [10, 25, 43],
      20: [1, 18, 36, 54],
      21: [12, 30, 48],
      22: [6, 24, 39, 54],
      23: [9, 26, 42, 57],
    },
    saturday: {
      6: [3, 19, 35, 52],
      7: [10, 28, 46],
      8: [4, 22, 40, 58],
      9: [16, 34, 52],
      10: [10, 28, 46],
      11: [4, 22, 40, 58],
      12: [16, 34, 52],
      13: [10, 28, 46],
      14: [4, 22, 40, 58],
      15: [16, 34, 52],
      16: [10, 28, 46],
      17: [4, 22, 40, 58],
      18: [16, 34, 52],
      19: [10, 28, 46],
      20: [4, 22, 40, 58],
      21: [16, 34, 53],
      22: [12, 32, 51],
      23: [9, 26, 42, 57],
    },
    sunday_and_holiday: {
      6: [3, 19, 35, 52],
      7: [10, 28, 46],
      8: [4, 22, 40, 58],
      9: [16, 34, 52],
      10: [10, 28, 46],
      11: [4, 22, 40, 58],
      12: [16, 34, 52],
      13: [10, 28, 46],
      14: [4, 22, 40, 58],
      15: [16, 34, 52],
      16: [10, 28, 46],
      17: [4, 22, 40, 58],
      18: [16, 34, 52],
      19: [10, 28, 46],
      20: [4, 22, 40, 58],
      21: [16, 34, 53],
      22: [12, 32, 51],
      23: [9, 26, 42, 57],
    },
  },
};

const app = express();
app.use(express.json());

app.get("/api/mrt/next", (req, res) => {
  const { to } = req.query;
  let destKey;
  if (to === "xbt") destKey = "toXBT";
  else if (to === "qz") destKey = "toQZ";
  else {
    res.status(400).json({ error: "Invalid or missing 'to' parameter" });
    return;
  }

  // 取得台北時區現在時間
  const now = new Date();
  const tz = "Asia/Taipei";
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);
  const weekday = parts.find((p) => p.type === "weekday").value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  );

  let dayKey;
  if (req.query.isHoliday === "1") dayKey = "sunday_and_holiday";
  else if (day === 0) dayKey = "sunday_and_holiday";
  else if (day === 6) dayKey = "saturday";
  else dayKey = "weekdays";

  const schedule = timetable[destKey][dayKey];

  // 找下一班
  let found = null;
  for (let h = hour; h <= 23; h++) {
    const mins = schedule[h];
    if (!mins) continue;
    for (const m of mins) {
      if (h === hour && m < minute) continue;
      const tMinutes = h * 60 + m;
      const nowMinutes = hour * 60 + minute;
      found = {
        nextArrival: `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`,
        inMinutes: tMinutes - nowMinutes,
      };
      break;
    }
    if (found) break;
  }

  const nowStr = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  if (!found) {
    res.status(200).json({ message: "No more trains today", now: nowStr });
    return;
  }
  res.status(200).json({ ...found, now: nowStr });
});

app.get("/api/mrt/timetable", () => {});

app.get("/api/mrt/timetable", (req, res) => {
  const { to } = req.query;
  if (to === "qz") {
    res.redirect(302, "https://web.metro.taipei/img/ALL/timetables/032.PDF");
  } else if (to === "xbt") {
    res.redirect(302, "https://web.metro.taipei/img/ALL/timetables/035.PDF");
  } else {
    res.status(400).json({ error: "Invalid or missing 'to' parameter" });
  }
});

if (process.env.IS_DEV) {
  app.listen(3000, () => console.log("MRT server is running on port 3000"));
}
export default app;
