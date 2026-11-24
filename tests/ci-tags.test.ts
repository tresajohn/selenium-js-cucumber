import { readFileSync } from 'fs';
import { join } from 'path';

function test_all_scenarios_have_tags() {
  const featureDir = join(process.cwd(), 'features');
  const files = [
    'login.feature',
    'cart.feature',
    'checkout.feature',
    'contact.feature',
    'product_search.feature',
    'registration.feature',
  ];
  for (const file of files) {
    const content = readFileSync(join(featureDir, file), 'utf8');
    const scenarios = content.split('\n').filter((l) => l.trim().startsWith('Scenario:'));
    for (const scenario of scenarios) {
      const idx = content.indexOf(scenario);
      const before = content.slice(Math.max(0, idx - 200), idx);
      const hasTag = /@smoke|@regression/.test(before);
      if (!hasTag)
        throw new Error(`Scenario in ${file} missing @smoke or @regression: ${scenario.trim()}`);
    }
  }
  console.log('PASS: all scenarios have smoke or regression tags');
}

test_all_scenarios_have_tags();
