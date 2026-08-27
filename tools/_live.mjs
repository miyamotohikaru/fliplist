import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--headless=new", "--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("https://fliplist-002.vercel.app/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 700));
console.log(await p.evaluate(() => {
  const bl = document.querySelector(".blink");
  const face = document.querySelector("#list h3.sec .wa .wa__face");
  return {
    blink: bl ? getComputedStyle(bl).animationDuration : "?",
    bgSize: face ? getComputedStyle(face).backgroundSize : "?",
    bgPos: face ? getComputedStyle(face).backgroundPosition : "?",
  };
}));
await b.close();
