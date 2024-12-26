import express, { Application, Request, Response, NextFunction } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import path from 'path';
import errorHandler from './utils/error';
import { setSecureHeaders } from "./utils/secureHeaders";

const app: Application = express();
const PORT = process.env.PORT || 6020;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(setSecureHeaders);
app.disable("x-powered-by");

app.use(express.static(path.join(__dirname, '.', 'public')));
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '.', 'public', 'index.html'));
});

const fetchHTML = async (url: string): Promise<string> => {
  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch the HTML content");
  }
};

const parseCricketScore = ($: cheerio.CheerioAPI): Record<string, string> => {
    const getText = (selector: string): string =>
      $(selector).first().text().trim() || "Match Stats will Update Soon";

    const matchStatuses: string[] = [
      ".cb-col.cb-col-100.cb-min-stts.cb-text-complete",
      ".cb-text-inprogress",
      ".cb-col.cb-col-100.cb-font-18.cb-toss-sts.cb-text-abandon",
      ".cb-text-stumps",
      ".cb-text-lunch",
      ".cb-text-inningsbreak",
      ".cb-text-tea",
      ".cb-text-rain",
      ".cb-text-wetoutfield",
      ".cb-text-delay",
      ".cb-col.cb-col-100.cb-font-18.cb-toss-sts.cb-text-",
    ];
    
    const matchUpdate = matchStatuses
      .map((selector) => $(selector).first().text().trim())
      .find((status) => status) || "Match Stats will Update Soon";
  
    const matchDateElement = $('span[itemprop="startDate"]').attr("content");
    const matchDate =
      matchDateElement &&
      new Date(matchDateElement).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      });
  
    return {
      title: getText("h1.cb-nav-hdr").replace(" - Live Cricket Score, Commentary", "").trim(),
      update: matchUpdate,
      matchDate: matchDate ? `Date: ${matchDate}` : "Match Stats will Update Soon",
      livescore: getText(".cb-font-20.text-bold"),
      runrate: `${getText(".cb-font-12.cb-text-gray")}`,
    };
  };  

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

app.get(
  "/score",
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: "Match ID is required" });
      return;
    }

    const url = `https://www.cricbuzz.com/live-cricket-scores/${id}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const matchData = parseCricketScore($);
    res.json(matchData);
  })
);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Resource not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server PORT: ${PORT}`);
});
