import puppeteer from 'puppeteer'

class PuppeteerSg {
  constructor() {
    if (!PuppeteerSg.instance) {
      PuppeteerSg.instance = this;
      process.on('exit', () => {
        this.close();
      });
    }
    return PuppeteerSg.instance;
  }

  /**
   * Launch a browser
   */
  async launch() {
    const isCI = process.env.CI === 'true'; // Detect if running in CI
    // 加入更多穩定性參數，減少瀏覽器卡頓導致的 Timeout
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // 防止在某些環境下記憶體不足
      '--disable-gpu'            // 關閉 GPU 加速，減少資源消耗與不穩定
    ];
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args,
      timeout: 0,
      protocolTimeout: 240000,
    });
  }

  /**
   * New a page
   * @param {string} url
   * @returns
   */
  async getPage(url) {
    if (!this.browser) {
      await this.launch()
    }
    let page = await this.browser.newPage()
    await page.goto(url, {
      waitUntil: "load",
    })
    return page
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const puppeteerSg = new PuppeteerSg()
