import { chromium } from "playwright";

class Playwright {
  browser = null;

  receivedKillSignal = false;

  constructor() {
    process.on("SIGHUP", this.handleSignal.bind(this, "SIGHUP"));
    process.on("SIGTERM", this.handleSignal.bind(this, "SIGTERM"));
    process.on("SIGINT", this.handleSignal.bind(this, "SIGINT"));
    process.on("exit", () => console.log("process exited"));
  }

  handleSignal = (signal) => {
    console.log("Playwright -> signal:", signal);
    this.receivedKillSignal = true;
  };

  init = async () => {
    console.log("Playwright -> init");
    this.browser = await chromium.launch({
      headless: true,
      handleSIGHUP: false,
      handleSIGINT: false,
      handleSIGTERM: false,
    });
    this.browser.on("disconnect", () => {
      console.log("Playwright -> browser -> disconnect");
    });
  };

  newPage = async () => {
    console.log("Playwright -> newPage");
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();
    return page;
  };

  cleanup = async (force = false) => {
    console.log("Playwright -> cleanup");
    if (force || this.receivedKillSignal) {
      await this.browser.close();
      this.browser = null;
    }
  };
}

const playwright = new Playwright();

async function main() {
  const arr = new Array(30).fill(null);

  // iterate over some pages to stimulate work
  for (const i in arr) {
    const page = await playwright.newPage();
    await page.goto("https://example.com/" + i, { waitUntil: "networkidle" });
    await page.close();
  }

  // this will close the browser if we have received a kill signal
  await playwright.cleanup();

  // this will close the browser in some time regardless of kill signal receive
  setTimeout(async () => {
    console.log("setTimeout force cleanup");
    await playwright.cleanup(true);
  }, 10 * 1000);
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
