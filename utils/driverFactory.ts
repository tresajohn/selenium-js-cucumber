import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { execSync } from 'child_process';
import path from 'path';

function getSeleniumManagerBin(): string {
  const base = path.join(__dirname, '..', 'node_modules', 'selenium-webdriver', 'bin');
  const platform = process.platform;
  if (platform === 'darwin') return path.join(base, 'macos', 'selenium-manager');
  if (platform === 'win32') return path.join(base, 'windows', 'selenium-manager.exe');
  return path.join(base, 'linux-x86_64', 'selenium-manager');
}

function getChromeBinary(): string {
  const platform = process.platform;
  if (platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  return 'google-chrome';
}

function getChromeMajorVersion(): string | null {
  try {
    const out = execSync(`"${getChromeBinary()}" --version`, { encoding: 'utf8' });
    const match = out.match(/(\d+)\.\d+\.\d+\.\d+/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function getChromedriverPath(): string | null {
  const smBin = getSeleniumManagerBin();
  const version = getChromeMajorVersion();
  const versionFlag = version ? `--browser-version ${version}` : '';
  try {
    const result = execSync(`"${smBin}" --browser chrome ${versionFlag} --output json`, {
      encoding: 'utf8',
    });
    const json = JSON.parse(result);
    return json.result?.driver_path ?? null;
  } catch {
    return null;
  }
}

export class DriverFactory {
  static async create(browser = 'chrome', headless = false): Promise<WebDriver> {
    const b = browser.toLowerCase();
    if (b === 'chrome') {
      const options = new chrome.Options();
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.excludeSwitches('enable-automation');
      options.setPageLoadStrategy('none');
      if (headless) {
        options.addArguments(
          '--headless=new',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        );
      }
      const driverPath = getChromedriverPath();
      let builder = new Builder().forBrowser('chrome').setChromeOptions(options);
      if (driverPath) {
        builder = builder.setChromeService(new chrome.ServiceBuilder(driverPath));
      }
      return builder.build();
    } else if (b === 'firefox') {
      const options = new firefox.Options();
      if (headless) options.addArguments('--headless');
      return new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
    } else {
      throw new Error(`Unsupported browser: ${browser}`);
    }
  }
}
