const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const { execSync } = require('child_process');
const path = require('path');

function getSeleniumManagerBin() {
  const base = path.join(__dirname, '..', 'node_modules', 'selenium-webdriver', 'bin');
  const platform = process.platform;
  if (platform === 'darwin') return path.join(base, 'macos', 'selenium-manager');
  if (platform === 'win32') return path.join(base, 'windows', 'selenium-manager.exe');
  return path.join(base, 'linux-x86_64', 'selenium-manager');
}

function getChromeBinary() {
  const platform = process.platform;
  if (platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  return 'google-chrome';
}

function getChromeMajorVersion() {
  try {
    const out = execSync(`"${getChromeBinary()}" --version`, { encoding: 'utf8' });
    const match = out.match(/(\d+)\.\d+\.\d+\.\d+/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function getChromedriverPath() {
  const smBin = getSeleniumManagerBin();
  const version = getChromeMajorVersion();
  const versionFlag = version ? `--browser-version ${version}` : '';
  try {
    const result = execSync(`"${smBin}" --browser chrome ${versionFlag} --output json`, { encoding: 'utf8' });
    const json = JSON.parse(result);
    return json.result && json.result.driver_path ? json.result.driver_path : null;
  } catch {
    return null;
  }
}

class DriverFactory {
  static async create(browser = 'chrome', headless = false) {
    const b = browser.toLowerCase();
    if (b === 'chrome') {
      const options = new chrome.Options();
      if (headless) {
        options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');
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

module.exports = { DriverFactory };
