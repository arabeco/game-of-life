import { withBrowser } from './_smoke.browser.mjs';
import { createTempUser } from './_smoke.supabase.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.SMOKE_URL || 'http://127.0.0.1:3003/';

try {
  const user = await createTempUser({
    label: 'auth-shell-diagnostic',
    isPremium: false,
    appMode: 'GAME',
    gold: 50,
  });

  await withBrowser({ baseUrl, debugPort: 9261 }, async (page) => {
    try {
      await page.login(user.email, user.password);
      console.log(JSON.stringify({
        success: true,
        email: user.email,
        body: await page.bodyText(),
        console: page.getConsoleMessages(),
        exceptions: page.getExceptions(),
      }, null, 2));
    } catch (error) {
      const screenshot = await page.cdp('Page.captureScreenshot', { format: 'png' });
      mkdirSync('tests\\artifacts', { recursive: true });
      const screenshotPath = 'tests\\artifacts\\auth-shell-diagnostic.png';
      writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
      console.error(JSON.stringify({
        success: false,
        email: user.email,
        error: error instanceof Error ? error.message : String(error),
        url: await page.evaluate('location.href'),
        readyState: await page.evaluate('document.readyState'),
        rootChildCount: await page.evaluate(`(() => {
          const root = document.querySelector('#root');
          return root instanceof HTMLElement ? root.childElementCount : -1;
        })()`),
        bodyHtmlSnippet: await page.evaluate('document.body ? document.body.innerHTML.slice(0, 4000) : ""'),
        screenshotPath,
        body: await page.bodyText(),
        console: page.getConsoleMessages(),
        exceptions: page.getExceptions(),
      }, null, 2));
      process.exitCode = 1;
    }
  });
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
