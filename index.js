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
      // all handle are disabled as we dont want browser to close unless doing so ourselves
      handleSIGHUP: false,
      handleSIGINT: false,
      handleSIGTERM: false,
    });
    this.browser.on("disconnect", () => {
      console.log("Playwright -> browser -> disconnect");
    });
  };

  newPage = async () => {
    if (!this.browser) {
      await this.init();
    }

    console.log("Playwright -> newPage");
    const page = await this.browser.newPage();
    return page;
  };

  // if we received a kill signal or forcing only then close the browser
  cleanup = async (force = false) => {
    const shouldClose = force || this.receivedKillSignal;
    console.log("Playwright -> cleanup -> shouldClose", shouldClose);
    if (shouldClose && this.browser) {
      await this.browser.close();
      this.browser = null;
      return true;
    }
  };
}

const playwright = new Playwright();

async function main() {
  try {
    console.log("process start");
    const arr = new Array(20).fill(null);

    // iterate over some pages to stimulate work, try to do pnpm kill in between this
    for (const i in arr) {
      const page = await playwright.newPage();
      await page.goto("https://example.com/" + i, { waitUntil: "networkidle" });
      console.log("loaded, get content");
      const content = await page.evaluate(`
new Promise(resolve => setTimeout(() => resolve(document.body.outerHTML), 3000)) // stimulate a long get content call  
    `);
      console.log("has content", !!content);
      await page.close();
    }

    // this should close the browser if we have received a kill signal
    const exited = await playwright.cleanup();
    // if it closed then we have kill signal so exit
    // but we dont reach till end of loop as playwright throws error on a kill signal
    if (exited) return;

    // this will close the browser in some time regardless of kill signal receive
    setTimeout(async () => {
      console.log("setTimeout force cleanup");
      await playwright.cleanup(true);
      process.exit(0);
    }, 10 * 1000);
  } finally {
    await playwright.cleanup(true);
  }
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
