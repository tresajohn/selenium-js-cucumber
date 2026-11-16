const fs = require('fs');
const path = require('path');

async function takeScreenshot(driver, scenarioName) {
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sanitised = scenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${sanitised}_${Date.now()}.png`;
  const filepath = path.join(dir, filename);

  const data = await driver.takeScreenshot();
  fs.writeFileSync(filepath, data, 'base64');
  return filepath;
}

module.exports = { takeScreenshot };
