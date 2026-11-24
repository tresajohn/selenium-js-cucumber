# Selenium JS Cucumber Architecture Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `selenium-js-cucumber` to match the architecture maturity of `tresajohn/playwright-e2e-suite` — TypeScript, three-layer architecture, modules layer, structured logger, rich Jira tickets, pre-commit gate, CI split, flaky detection, and Docker.

**Architecture:** Convert the existing JS Cucumber framework to TypeScript. Add a modules layer (Layer 2) between pages (Layer 1) and steps (Layer 3) so steps only assert, never touch the DOM. Add the same support-layer utilities the Playwright suite has: logger, test data factory, Jira helper, flaky formatter.

**Tech Stack:** TypeScript 5.x, Selenium WebDriver 4.x, Cucumber JS 10.x, Chai, Husky 9.x, commitlint 21.x, ESLint 9.x, Prettier 3.x, Docker selenium/standalone-chrome

**Spec:** docs/superpowers/specs/2026-11-24-selenium-upgrade-design.md

## Global Constraints

- Node.js >= 20
- TypeScript >= 5.x; `tsconfig.json` target `ES2022`, module `NodeNext`, strict: true
- All source files `.ts`; no `.js` files in pages/, modules/, utils/, support/ after conversion
- `@cucumber/cucumber` >= 10.9.0; `selenium-webdriver` >= 4.51.0
- Husky 9.x / commitlint 21.x — match Playwright suite versions
- ESLint 9.x flat config (`eslint.config.mjs`), Prettier 3.x
- Docker base: `selenium/standalone-chrome:latest`
- Jira REST API v3 — ADF body format
- Logger: CI NDJSON when `process.env.CI` truthy, pretty otherwise — exact same design as Playwright logger.ts
- Jira priority: High for `@smoke`, Medium otherwise — exact same logic as Playwright reporter
- Flaky threshold default `0.10`, configurable via `FLAKY_THRESHOLD` env var
- Never add `Co-Authored-By: Claude` to commits

## Review Focus

1. **TypedWorld type safety** — `this.driver` is `driver!: WebDriver` (definite assignment); steps that run before `Before` hook set it will see `undefined` at runtime. Test: a step that accesses `this.driver` in a scenario with no `@needs_credentials` skip guard still gets a live driver.
2. **Flaky formatter exit code** — `process.exitCode = 1` (not `process.exit(1)`) must be set after Cucumber has finished writing its own output. Test: formatter sets exitCode when `thresholdExceeded`, and Cucumber's own exit path still runs.
3. **Jira duplicate guard** — `_ticketExists` uses JQL `summary ~ "..."` which is a contains-match; a scenario whose name is a substring of another's will get a false positive. Test: `_ticketExists` with a summary that is a substring of an existing open ticket returns false (not suppressed).
4. **Logger CI branch** — `process.env.CI` is a string `"true"` not boolean `true`; falsy check `if (process.env.CI)` works, but `=== true` does not. Test: `CI=""` (empty string) is falsy — logger uses pretty format.
5. **Docker COPY + validate** — `selenium/standalone-chrome` runs as a non-root user (`seluser`); `npm ci` writing to `/app` owned by root will fail. Test: Dockerfile `WORKDIR /app` + `RUN chown -R seluser:seluser /app` before `npm ci`, or use `--unsafe-perm`.

---

### Task 1: TypeScript conversion + tooling setup

**Files:**
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `commitlint.config.ts`
- Create: `.husky/pre-commit`
- Modify: `package.json` — add devDependencies, scripts, update cucumber profile runner to tsx
- Rename+convert: `config/config.js` → `config/config.ts`
- Rename+convert: `utils/driverFactory.js` → `utils/driverFactory.ts`
- Rename+convert: `utils/waitHelper.js` → `utils/waitHelper.ts`
- Rename+convert: `utils/screenshotHelper.js` → `utils/screenshotHelper.ts`
- Rename+convert: `support/world.js` → `support/world.ts` (TypedWorld)
- Rename+convert: `support/hooks.js` → `support/hooks.ts`
- Rename+convert: `pages/BasePage.js` → `pages/BasePage.ts`
- Rename+convert: `pages/LoginPage.js` → `pages/LoginPage.ts` (getter locators)
- Rename+convert: `pages/HomePage.js` → `pages/HomePage.ts`
- Rename+convert: `pages/CartPage.js` → `pages/CartPage.ts`
- Rename+convert: `pages/CheckoutPage.js` → `pages/CheckoutPage.ts`
- Rename+convert: `pages/ContactPage.js` → `pages/ContactPage.ts`
- Rename+convert: `pages/RegistrationPage.js` → `pages/RegistrationPage.ts`
- Rename+convert: all `features/step_definitions/*.js` → `.ts`
- Delete: all original `.js` source files after conversion
- Test: `tests/ts-setup.test.ts` (new)

**Interfaces:**
- Consumes: nothing (foundation task)
- Produces:
  - `TypedWorld` class in `support/world.ts` with fields: `config: Config`, `driver!: WebDriver`, `timeoutMs: number`, optional page refs typed as their page classes
  - `Config` interface from `config/config.ts` with fields: `baseUrl`, `browser`, `headless`, `timeout`, `jiraBaseUrl`, `jiraEmail`, `jiraApiToken`, `jiraProjectKey`, `jiraIssueType`, `testEmail`, `testPassword`
  - All pages export typed classes with getter locators
  - npm scripts: `typecheck` (tsc --noEmit), `lint` (eslint .), `format:check` (prettier --check), `validate` (typecheck + lint + format:check)

- [ ] **Step 1: Install TypeScript and tooling dependencies**

```bash
cd /tmp/selenium-js-cucumber
npm install --save-dev typescript@5 @types/node tsx \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint@9 prettier@3 \
  husky@9 @commitlint/cli@21 @commitlint/config-conventional@21 \
  lint-staged
```

Run: `node -e "require('typescript')" && echo OK`
Expected: `OK`

- [ ] **Step 2: Write the failing test for TypedWorld**

```typescript
// tests/ts-setup.test.ts
import { TypedWorld } from '../support/world';

function test_typed_world_has_config_and_driver_fields() {
  const proto = TypedWorld.prototype as any;
  if (!('config' in new (TypedWorld as any)({ attach: () => {}, log: () => {}, parameters: {} })))
    throw new Error('TypedWorld missing config');
  console.log('PASS: TypedWorld has config field');
}
test_typed_world_has_config_and_driver_fields();
```

Run: `npx tsx tests/ts-setup.test.ts`
Expected: FAIL — `Cannot find module '../support/world'`

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Convert `config/config.ts`**

Export `Config` interface (fields listed in Interfaces above) and `getConfig(): Config`. Body same as `config.js` with types added. Delete `config/config.js`.

- [ ] **Step 5: Convert `support/world.ts`** to `TypedWorld` extending `World`

Exact shape from spec: `config`, `driver!`, `timeoutMs`, optional typed page refs. `setWorldConstructor(TypedWorld)`. Delete `support/world.js`.

- [ ] **Step 6: Run the failing test — expect PASS now**

Run: `npx tsx tests/ts-setup.test.ts`
Expected: `PASS: TypedWorld has config field`

- [ ] **Step 7: Convert remaining utils and pages**

For each file: add type annotations, replace `static LOCATOR = By.css(...)` with `get locator(): By { return By.css(...) }` getter pattern. Delete the original `.js` file after each conversion.

Pages to convert: `utils/driverFactory.ts`, `utils/waitHelper.ts`, `utils/screenshotHelper.ts`, all `pages/*.ts`, `support/hooks.ts`.

- [ ] **Step 8: Convert all step definition files to TypeScript**

Replace `const { Given } = require(...)` with `import { Given } from '@cucumber/cucumber'`. Replace `require` with `import`. Add `this: TypedWorld` parameter to each step callback. Delete original `.js` files.

- [ ] **Step 9: Create `eslint.config.mjs`**

Flat config with `@typescript-eslint` recommended rules, `no-console: warn`. Same pattern as Playwright suite's ESLint config.

- [ ] **Step 10: Create `.prettierrc`**

```json
{ "singleQuote": true, "semi": true, "trailingComma": "es5", "printWidth": 100 }
```

- [ ] **Step 11: Create `commitlint.config.ts`**

```typescript
export default { extends: ['@commitlint/config-conventional'] };
```

- [ ] **Step 12: Add npm scripts to `package.json`**

Add: `"typecheck": "tsc --noEmit"`, `"lint": "eslint ."`, `"format:check": "prettier --check 'features/**/*.ts' 'pages/**/*.ts' 'modules/**/*.ts' 'utils/**/*.ts' 'support/**/*.ts' '*.ts'"`, `"validate": "npm run typecheck && npm run lint && npm run format:check"`.

Update cucumber runner in scripts to use `npx tsx` loader: add `--require tsx/cjs` or update `cucumber.js` profile to use `loader: ['tsx']`.

- [ ] **Step 13: Set up Husky pre-commit hook**

```bash
npx husky init
echo "npm run validate" > .husky/pre-commit
```

- [ ] **Step 14: Verify typecheck and lint pass**

Run: `npm run validate`
Expected: exits 0, no errors

- [ ] **Step 15: Commit**

```bash
git add tsconfig.json eslint.config.mjs .prettierrc commitlint.config.ts .husky/ package.json package-lock.json config/config.ts utils/ pages/ support/ features/step_definitions/ tests/
git rm config/config.js utils/driverFactory.js utils/waitHelper.js utils/screenshotHelper.js support/world.js support/hooks.js pages/BasePage.js pages/LoginPage.js pages/HomePage.js pages/CartPage.js pages/CheckoutPage.js pages/ContactPage.js pages/RegistrationPage.js features/step_definitions/login_steps.js features/step_definitions/cart_steps.js features/step_definitions/checkout_steps.js features/step_definitions/contact_steps.js features/step_definitions/product_steps.js
git commit -m "refactor: convert to TypeScript with ESLint, Prettier, Husky, commitlint"
```

---

### Task 2: Structured logger

**Files:**
- Create: `utils/logger.ts`
- Create: `tests/logger.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export enum LogLevel { DEBUG, INFO, WARN, ERROR }`
  - `export class Logger { constructor(context: string); static create(context: string): Logger; static setLogLevel(level: LogLevel): void; static getLogLevel(): LogLevel; debug(msg: string): void; info(msg: string): void; warn(msg: string): void; error(msg: string, error?: unknown): void; step(n: number, description: string): void; testStart(name: string): void; testEnd(name: string): void }`
  - CI branch: `process.env.CI` truthy → `JSON.stringify({ts, level, ctx, msg, ...error?})`, else `[ISO] [LEVEL] [ctx] msg`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/logger.test.ts
import { Logger, LogLevel } from '../utils/logger';

function capture(fn: () => void): string {
  const lines: string[] = [];
  const orig = console.info;
  console.info = (s: string) => lines.push(s);
  fn();
  console.info = orig;
  return lines.join('\n');
}

function test_pretty_format_outside_ci() {
  const orig = process.env.CI;
  delete process.env.CI;
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  if (!out.includes('[INFO]') || !out.includes('[TestCtx]') || !out.includes('hello'))
    throw new Error(`Pretty format failed: ${out}`);
  if (orig !== undefined) process.env.CI = orig;
  console.log('PASS: pretty format');
}

function test_json_format_in_ci() {
  process.env.CI = 'true';
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  const parsed = JSON.parse(out);
  if (parsed.level !== 'INFO' || parsed.ctx !== 'TestCtx' || parsed.msg !== 'hello')
    throw new Error(`JSON format failed: ${out}`);
  delete process.env.CI;
  console.log('PASS: CI JSON format');
}

function test_level_filter() {
  Logger.setLogLevel(LogLevel.WARN);
  const logger = Logger.create('TestCtx');
  const out = capture(() => { logger.debug('skip'); logger.info('skip'); logger.warn('keep'); });
  if (out.includes('skip') || !out.includes('keep'))
    throw new Error(`Level filter failed: ${out}`);
  Logger.setLogLevel(LogLevel.INFO);
  console.log('PASS: level filter');
}

function test_empty_string_ci_uses_pretty() {
  process.env.CI = '';
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  if (out.startsWith('{')) throw new Error(`CI="" should produce pretty format, got: ${out}`);
  delete process.env.CI;
  console.log('PASS: CI="" uses pretty format');
}

test_pretty_format_outside_ci();
test_json_format_in_ci();
test_level_filter();
test_empty_string_ci_uses_pretty();
```

Run: `npx tsx tests/logger.test.ts`
Expected: FAIL — `Cannot find module '../utils/logger'`

- [ ] **Step 2: Implement `utils/logger.ts`**

Exact shape from Interfaces. CI branch: `if (process.env.CI)`. Error key omitted (not null) when no error arg. `static logLevel: LogLevel = LogLevel.INFO` on class.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx tsx tests/logger.test.ts`
Expected: 3 `PASS:` lines, exits 0

- [ ] **Step 4: Commit**

```bash
git add utils/logger.ts tests/logger.test.ts
git commit -m "feat: add structured logger with CI-aware NDJSON output"
```

---

### Task 3: Test data factory

**Files:**
- Create: `utils/testData.factory.ts`
- Create: `tests/factory.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export interface UserData { name: string; email: string; password: string }`
  - `export interface ContactData { name: string; email: string; subject: string; message: string }`
  - `export function createUserData(overrides?: Partial<UserData>): UserData`
  - `export function createContactData(overrides?: Partial<ContactData>): ContactData`
  - Defaults: `name: 'QA Test-<uuid8>'`, `email: 'qaauto-<uuid8>@mailinator.com'`, `password: 'Test@1234'`; contact subject: `'Automated Test <uuid8>'`, message: `'Portfolio test run — <uuid8>'`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/factory.test.ts
import { createUserData, createContactData } from '../utils/testData.factory';

function test_user_data_unique_per_call() {
  const a = createUserData();
  const b = createUserData();
  if (a.email === b.email) throw new Error('emails not unique');
  if (!a.email.includes('@mailinator.com')) throw new Error('wrong email domain');
  console.log('PASS: unique user data');
}

function test_user_data_override() {
  const d = createUserData({ name: 'Override' });
  if (d.name !== 'Override') throw new Error('override not applied');
  console.log('PASS: override applied');
}

function test_contact_data_unique() {
  const a = createContactData();
  const b = createContactData();
  if (a.subject === b.subject) throw new Error('subjects not unique');
  console.log('PASS: unique contact data');
}

test_user_data_unique_per_call();
test_user_data_override();
test_contact_data_unique();
```

Run: `npx tsx tests/factory.test.ts`
Expected: FAIL — `Cannot find module '../utils/testData.factory'`

- [ ] **Step 2: Implement `utils/testData.factory.ts`**

Use `crypto.randomUUID().slice(0, 8)` for the suffix. Apply overrides with spread: `{ ...defaults, ...overrides }`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx tsx tests/factory.test.ts`
Expected: 3 `PASS:` lines, exits 0

- [ ] **Step 4: Commit**

```bash
git add utils/testData.factory.ts tests/factory.test.ts
git commit -m "feat: add test data factory with uuid-based unique data per run"
```

---

### Task 4: Modules layer

**Files:**
- Create: `modules/LoginModule.ts`
- Create: `modules/CartModule.ts`
- Create: `modules/CheckoutModule.ts`
- Create: `modules/SearchModule.ts`
- Create: `modules/ContactModule.ts`
- Create: `tests/modules.test.ts`
- Modify: `features/step_definitions/login_steps.ts` — replace direct page calls with module calls
- Modify: `features/step_definitions/cart_steps.ts`
- Modify: `features/step_definitions/checkout_steps.ts`
- Modify: `features/step_definitions/contact_steps.ts`
- Modify: `features/step_definitions/product_steps.ts`

**Interfaces:**
- Consumes: `TypedWorld` from Task 1; `LoginPage`, `HomePage`, `CartPage`, `CheckoutPage`, `ContactPage`, `RegistrationPage` from Task 1
- Produces:
  - `LoginModule(world: TypedWorld)` — `async login(email: string, password: string): Promise<void>`, `async logout(): Promise<void>`, `async isLoggedIn(): Promise<boolean>`
  - `CartModule(world: TypedWorld)` — `async addFirstProductToCart(): Promise<void>`, `async viewCart(): Promise<void>`, `async getItemCount(): Promise<number>`
  - `CheckoutModule(world: TypedWorld)` — `async proceedToCheckout(): Promise<void>`, `async confirmOrder(): Promise<void>`, `async getConfirmationMessage(): Promise<string>`
  - `SearchModule(world: TypedWorld)` — `async search(keyword: string): Promise<void>`, `async getResultCount(): Promise<number>`
  - `ContactModule(world: TypedWorld)` — `async fillAndSubmit(data: ContactData): Promise<void>`, `async getSuccessMessage(): Promise<string>`
  - Each module stores constructed page as `private` field; steps access results only via module return values

- [ ] **Step 1: Write the failing test**

```typescript
// tests/modules.test.ts
import { LoginModule } from '../modules/LoginModule';
import { CartModule } from '../modules/CartModule';

function test_login_module_exports() {
  const proto = LoginModule.prototype as any;
  if (typeof proto.login !== 'function') throw new Error('LoginModule.login missing');
  if (typeof proto.isLoggedIn !== 'function') throw new Error('LoginModule.isLoggedIn missing');
  console.log('PASS: LoginModule interface');
}

function test_cart_module_exports() {
  const proto = CartModule.prototype as any;
  if (typeof proto.addFirstProductToCart !== 'function') throw new Error('CartModule.addFirstProductToCart missing');
  if (typeof proto.viewCart !== 'function') throw new Error('CartModule.viewCart missing');
  console.log('PASS: CartModule interface');
}

test_login_module_exports();
test_cart_module_exports();
```

Run: `npx tsx tests/modules.test.ts`
Expected: FAIL — `Cannot find module '../modules/LoginModule'`

- [ ] **Step 2: Implement `modules/LoginModule.ts`**

Constructor takes `world: TypedWorld`. `login()` instantiates `LoginPage(world.driver, world.timeoutMs)`, navigates to `${world.config.baseUrl}/login`, calls `page.login(email, password)`. Stores page on `world.loginPage`. `isLoggedIn()` returns `world.loginPage!.isLoggedIn()`.

- [ ] **Step 3: Implement remaining modules**

`CartModule` — `addFirstProductToCart()` uses `HomePage`; `viewCart()` uses `CartPage`. `CheckoutModule` — `proceedToCheckout()` calls `CartPage.proceedToCheckout()`; `confirmOrder()` calls `CheckoutPage.confirmOrder()`. `SearchModule` — `search()` uses `HomePage.search()`; `getResultCount()` returns `HomePage.getProductNames().length`. `ContactModule` — `fillAndSubmit()` navigates and calls `ContactPage` methods.

- [ ] **Step 4: Run module test to verify it passes**

Run: `npx tsx tests/modules.test.ts`
Expected: 2 `PASS:` lines, exits 0

- [ ] **Step 5: Update all step definition files**

Each step now: instantiate the relevant module with `new LoginModule(this)`, call the module method, assert the return value. No direct page instantiation in steps. Example:

```typescript
Given('I navigate to the login page', async function (this: TypedWorld) {
  this.loginModule = new LoginModule(this);
  await this.loginModule.navigateToLogin();
});
When('I login with email {string} and password {string}', async function (this: TypedWorld, email: string, password: string) {
  const actualEmail = email === 'valid' ? this.config.testEmail : email;
  const actualPw = password === 'valid' ? this.config.testPassword : password;
  await this.loginModule!.login(actualEmail, actualPw);
});
```

Add `loginModule`, `cartModule`, `checkoutModule`, `searchModule`, `contactModule` optional fields to `TypedWorld`.

- [ ] **Step 6: Run validate**

Run: `npm run validate`
Expected: exits 0

- [ ] **Step 7: Commit**

```bash
git add modules/ features/step_definitions/ support/world.ts tests/modules.test.ts
git commit -m "feat: add modules layer — steps delegate to modules, never touch pages directly"
```

---

### Task 5: Jira helper upgrade

**Files:**
- Create: `utils/jiraHelper.ts` (replaces any existing JS version)
- Create: `tests/jira.test.ts`
- Modify: `support/hooks.ts` — call `JiraHelper.createTicket(failure)` in `After`

**Interfaces:**
- Consumes: `Logger` from Task 2; `Config` from Task 1
- Produces:
  - `export interface FailureContext { scenarioName: string; featureFile: string; tags: string[]; errorMessage: string; screenshotPath: string | null; ciRunUrl: string; commitSha: string; durationMs: number }`
  - `export class JiraHelper { constructor(config: Config); async createTicket(failure: FailureContext): Promise<string | null> }`
  - Priority logic: `@smoke` tag → High, else Medium
  - Labels: `['automation-failure', 'cucumber', 'selenium', tag-derived label]`
  - Duplicate guard: JQL search before create
  - ADF body: environment block, failed scenario section, actual result code block (ANSI stripped), expected result, impact, automation reference (`npx cucumber-js --tags "@name"`), triage checklist
  - Screenshot attachment after create

- [ ] **Step 1: Write the failing test**

```typescript
// tests/jira.test.ts
import { JiraHelper } from '../utils/jiraHelper';
import { getConfig } from '../config/config';

function test_jira_helper_disabled_when_no_token() {
  const config = { ...getConfig(), jiraApiToken: '' };
  const helper = new JiraHelper(config as any);
  if ((helper as any).enabled !== false) throw new Error('should be disabled');
  console.log('PASS: disabled when no token');
}

function test_priority_smoke_is_high() {
  const config = { ...getConfig(), jiraApiToken: 'fake' };
  const helper = new JiraHelper(config as any);
  const priority = (helper as any)._priority(['@smoke', '@regression']);
  if (priority !== 'High') throw new Error(`Expected High, got ${priority}`);
  console.log('PASS: smoke → High priority');
}

function test_priority_regression_is_medium() {
  const config = { ...getConfig(), jiraApiToken: 'fake' };
  const helper = new JiraHelper(config as any);
  const priority = (helper as any)._priority(['@regression']);
  if (priority !== 'Medium') throw new Error(`Expected Medium, got ${priority}`);
  console.log('PASS: regression → Medium priority');
}

function test_strip_ansi_removes_escape_codes() {
  const config = { ...getConfig(), jiraApiToken: 'fake' };
  const helper = new JiraHelper(config as any);
  const stripped = (helper as any)._stripAnsi('[31mRed error[0m');
  if (stripped !== 'Red error') throw new Error(`ANSI strip failed: ${stripped}`);
  console.log('PASS: ANSI codes stripped from error message');
}

test_jira_helper_disabled_when_no_token();
test_priority_smoke_is_high();
test_priority_regression_is_medium();
test_strip_ansi_removes_escape_codes();
```

Run: `npx tsx tests/jira.test.ts`
Expected: FAIL — `Cannot find module '../utils/jiraHelper'`

- [ ] **Step 2: Implement `utils/jiraHelper.ts`**

`enabled = !!config.jiraApiToken`. `_priority(tags: string[]): string` returns `'High'` if tags includes `'@smoke'`, else `'Medium'`. `_stripAnsi(s: string): string` removes ANSI codes. `_buildAdfBody(failure: FailureContext): object` builds ADF doc with sections listed in spec. `createTicket()`: skip if not enabled, check duplicate, POST to `/rest/api/3/issue`, attach screenshot. Use `node-fetch` or Node's built-in `fetch` (Node >= 20).

- [ ] **Step 3: Run test to verify it passes**

Run: `npx tsx tests/jira.test.ts`
Expected: 3 `PASS:` lines, exits 0

- [ ] **Step 4: Wire into `support/hooks.ts`**

In `After`: if `scenario.result.status === 'FAILED'`, build `FailureContext` from scenario and call `await jiraHelper.createTicket(failure)`. Instantiate `JiraHelper` once in `BeforeAll`. Use `process.env.GITHUB_RUN_URL ?? ''` for `ciRunUrl` and `process.env.GITHUB_SHA ?? ''` for `commitSha`.

- [ ] **Step 5: Run validate**

Run: `npm run validate`
Expected: exits 0

- [ ] **Step 6: Commit**

```bash
git add utils/jiraHelper.ts tests/jira.test.ts support/hooks.ts
git commit -m "feat: add rich Jira ticket creation on scenario failure"
```

---

### Task 6: Flaky detection formatter

**Files:**
- Create: `utils/flakyFormatter.ts`
- Create: `tests/flaky.test.ts`
- Modify: `cucumber.js` — add `--retry 1`, register formatter

**Interfaces:**
- Consumes: nothing (Cucumber Formatter API)
- Produces:
  - `FlakyFormatter` class implementing Cucumber `Formatter`
  - Writes `test-results/flaky-report.json`: `{ runDate, totalTests, flakyCount, flakyRate, threshold, thresholdExceeded, flakyTests: [{ title, feature, passedOnAttempt }] }`
  - Sets `process.exitCode = 1` when `thresholdExceeded`
  - Threshold from `parseFloat(process.env.FLAKY_THRESHOLD ?? '0.10')`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/flaky.test.ts
import { FlakyFormatter } from '../utils/flakyFormatter';

function test_flaky_formatter_exports_class() {
  if (typeof FlakyFormatter !== 'function') throw new Error('FlakyFormatter not a class');
  console.log('PASS: FlakyFormatter exported');
}

function test_threshold_default_is_010() {
  delete process.env.FLAKY_THRESHOLD;
  const f = new FlakyFormatter({ eventBroadcaster: { on: () => {} } } as any);
  if ((f as any).threshold !== 0.10) throw new Error(`Expected 0.10 got ${(f as any).threshold}`);
  console.log('PASS: threshold default 0.10');
}

test_flaky_formatter_exports_class();
test_threshold_default_is_010();
```

Run: `npx tsx tests/flaky.test.ts`
Expected: FAIL — `Cannot find module '../utils/flakyFormatter'`

- [ ] **Step 2: Implement `utils/flakyFormatter.ts`**

Extend `Formatter` from `@cucumber/cucumber`. Constructor registers `testCaseFinished` on `options.eventBroadcaster`. Track `attemptsByTestCaseId: Map<string, number>` and `flakyTests[]`. On `testRunFinished`, compute rate, write JSON to `test-results/flaky-report.json` (create dir if needed), set `process.exitCode = 1` if exceeded. `threshold = parseFloat(process.env.FLAKY_THRESHOLD ?? '0.10')`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx tsx tests/flaky.test.ts`
Expected: 2 `PASS:` lines, exits 0

- [ ] **Step 4: Register formatter in `cucumber.js`**

Add `--retry 1` and `--format ./utils/flakyFormatter.ts` to default profile. Ensure `test-results/` is in `.gitignore`.

- [ ] **Step 5: Commit**

```bash
git add utils/flakyFormatter.ts tests/flaky.test.ts cucumber.js .gitignore
git commit -m "feat: add flaky test detection formatter with configurable threshold"
```

---

### Task 7: @smoke / @regression tags + CI split

**Files:**
- Modify: all `features/*.feature` — add `@smoke` and `@regression` tags
- Modify: `cucumber.js` — add `smoke` and `regression` profiles
- Modify: `package.json` — add `test:smoke`, `test:regression` scripts
- Modify: `.github/workflows/ci.yml` — split into code-quality, smoke-tests, regression-tests, publish-report jobs

**Interfaces:**
- Consumes: validated TypeScript from Task 1
- Produces:
  - `@smoke` on: login valid credentials, search, add to cart, view cart, home page navigation
  - `@regression` on: all other scenarios including error cases
  - `npm run test:smoke` → `cucumber-js --profile smoke`
  - `npm run test:regression` → `cucumber-js --profile regression`
  - CI: `code-quality` job runs `npm run validate`; `smoke-tests` needs `code-quality`; `regression-tests` needs `smoke-tests`, runs on push to main and PRs to main only

- [ ] **Step 1: Tag all scenarios**

Feature files: add `@smoke` to the primary happy-path scenario in each feature, `@regression` to all others. Every scenario gets at least one tag.

- [ ] **Step 2: Add profiles to `cucumber.js`**

```javascript
module.exports = {
  default: `--require-module tsx/cjs --require 'support/**/*.ts' --require 'features/**/*.ts' --format ./utils/flakyFormatter.ts --retry 1`,
  smoke: `--require-module tsx/cjs --require 'support/**/*.ts' --require 'features/**/*.ts' --tags '@smoke'`,
  regression: `--require-module tsx/cjs --require 'support/**/*.ts' --require 'features/**/*.ts' --tags '@regression'`,
};
```

- [ ] **Step 3: Add scripts to `package.json`**

`"test:smoke": "cucumber-js --profile smoke"`, `"test:regression": "cucumber-js --profile regression"`.

- [ ] **Step 4: Write the failing CI validation test**

```typescript
// tests/ci-tags.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';

function test_all_scenarios_have_tags() {
  const featureDir = join(process.cwd(), 'features');
  const files = ['login.feature', 'cart.feature', 'checkout.feature', 'contact.feature', 'product_search.feature', 'registration.feature'];
  for (const file of files) {
    const content = readFileSync(join(featureDir, file), 'utf8');
    const scenarios = content.split('\n').filter(l => l.trim().startsWith('Scenario:'));
    for (const scenario of scenarios) {
      const idx = content.indexOf(scenario);
      const before = content.slice(Math.max(0, idx - 200), idx);
      const hasTag = /@smoke|@regression/.test(before);
      if (!hasTag) throw new Error(`Scenario in ${file} missing @smoke or @regression: ${scenario.trim()}`);
    }
  }
  console.log('PASS: all scenarios have smoke or regression tags');
}

test_all_scenarios_have_tags();
```

Run: `npx tsx tests/ci-tags.test.ts`
Expected: FAIL — scenarios missing tags

- [ ] **Step 5: Run test to verify it passes after tagging**

Run: `npx tsx tests/ci-tags.test.ts`
Expected: `PASS: all scenarios have smoke or regression tags`

- [ ] **Step 6: Update `.github/workflows/ci.yml`**

Split into 4 jobs:
- `code-quality`: checkout, setup-node 22, `npm ci`, `npm run validate`
- `smoke-tests`: needs `code-quality`, setup-chrome, `npm run test:smoke`, upload allure artifact
- `regression-tests`: needs `smoke-tests`, condition `github.ref == 'refs/heads/main' || github.event_name == 'pull_request'`, `npm run test:regression`, upload allure artifact
- `publish-report`: needs `smoke-tests` and `regression-tests` (always), merge + deploy Allure to Pages

- [ ] **Step 7: Commit**

```bash
git add features/*.feature cucumber.js package.json .github/workflows/ci.yml tests/ci-tags.test.ts
git commit -m "feat: add smoke/regression tags and split CI into code-quality, smoke, regression jobs"
```

---

### Task 8: Docker + .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: `npm run validate`, `npx cucumber-js --profile smoke/regression` from Task 7
- Produces:
  - `docker compose run --rm smoke` runs smoke suite
  - `docker compose run --rm regression` runs regression suite
  - Volumes: `./test-results:/app/test-results`, `./allure-results:/app/allure-results`

- [ ] **Step 1: Write the failing validation test**

```typescript
// tests/docker.test.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function test_dockerfile_exists_and_has_base_image() {
  const path = join(process.cwd(), 'Dockerfile');
  if (!existsSync(path)) throw new Error('Dockerfile missing');
  const content = readFileSync(path, 'utf8');
  if (!content.includes('selenium/standalone-chrome')) throw new Error('Wrong base image');
  console.log('PASS: Dockerfile uses selenium/standalone-chrome');
}

function test_dockerignore_excludes_node_modules() {
  const path = join(process.cwd(), '.dockerignore');
  if (!existsSync(path)) throw new Error('.dockerignore missing');
  const content = readFileSync(path, 'utf8');
  if (!content.includes('node_modules')) throw new Error('node_modules not in .dockerignore');
  console.log('PASS: .dockerignore excludes node_modules');
}

test_dockerfile_exists_and_has_base_image();
test_dockerignore_excludes_node_modules();
```

Run: `npx tsx tests/docker.test.ts`
Expected: FAIL — `Dockerfile missing`

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
FROM selenium/standalone-chrome:latest
USER root
WORKDIR /app
ENV CI=true
ENV NODE_ENV=test
ENV HUSKY=0
RUN apt-get update && apt-get install -y nodejs npm && apt-get clean
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run validate
RUN mkdir -p /app/test-results /app/allure-results
CMD ["npx", "cucumber-js"]
```

- [ ] **Step 3: Create `.dockerignore`**

```
node_modules/
test-results/
allure-results/
allure-report/
.git/
.husky/
.env
*.zip
.superpowers/
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
version: '3.8'
services:
  selenium-base:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - CI=true
      - HUSKY=0
      - BASE_URL=${BASE_URL:-https://www.automationexercise.com}
      - TEST_EMAIL=${TEST_EMAIL:-}
      - TEST_PASSWORD=${TEST_PASSWORD:-}
    volumes:
      - ./test-results:/app/test-results
      - ./allure-results:/app/allure-results
  smoke:
    extends:
      service: selenium-base
    command: npx cucumber-js --profile smoke
    container_name: selenium-smoke
  regression:
    extends:
      service: selenium-base
    command: npx cucumber-js --profile regression
    container_name: selenium-regression
```

- [ ] **Step 5: Run docker validation test**

Run: `npx tsx tests/docker.test.ts`
Expected: 2 `PASS:` lines, exits 0

- [ ] **Step 6: Run validate**

Run: `npm run validate`
Expected: exits 0

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore tests/docker.test.ts
git commit -m "feat: add Docker support with selenium/standalone-chrome and docker-compose smoke/regression services"
```

---

### Task 9: README update

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior tasks complete
- Produces: README covering tech stack table (TypeScript, Selenium 4.x, Cucumber JS 10.x, Chai, Allure, ESLint+Prettier, Husky+commitlint, Docker, Jira), three-layer architecture diagram (ASCII), project structure tree (updated), running tests section (local + Docker commands), key design patterns (getter locators, modules layer, structured logger, test data factory), flaky detection section, Jira integration section with KAN board link, CI/CD section

- [ ] **Step 1: Update tech stack table**

Add rows: TypeScript 5.x, Husky+commitlint, Docker, flaky detection formatter.

- [ ] **Step 2: Update project structure tree**

Reflect: `modules/`, `utils/logger.ts`, `utils/testData.factory.ts`, `utils/jiraHelper.ts`, `utils/flakyFormatter.ts`, `support/world.ts`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.husky/pre-commit`, `commitlint.config.ts`, `tsconfig.json`, `eslint.config.mjs`.

- [ ] **Step 3: Add three-layer architecture section**

ASCII diagram: Layer 3 (features + step_definitions) → Layer 2 (modules/) → Layer 1 (pages/ + utils/).

- [ ] **Step 4: Add key design patterns section**

Getter-based locators, modules layer, structured logger, test data factory, Jira integration, flaky detection.

- [ ] **Step 5: Add Docker and CI sections**

Docker run commands. CI/CD job table: code-quality, smoke-tests, regression-tests, publish-report.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: update README to reflect TypeScript, modules layer, Docker, CI split, and all new utilities"
```

---

## Pre-flight: shared interfaces

| Producer | Consumer | Interface | Match? |
|---|---|---|---|
| Task 1 TypedWorld | Task 4 Modules | `world.driver`, `world.config`, `world.timeoutMs`, page ref fields | check at Task 4 |
| Task 2 Logger | Task 5 JiraHelper | `Logger.create(ctx)`, `.info()`, `.error()` | check at Task 5 |
| Task 3 Factory | Task 4 Modules (ContactModule) | `createContactData(): ContactData` | check at Task 4 |
| Task 1 Config | Task 5 JiraHelper | `Config.jiraApiToken`, `.jiraBaseUrl`, etc. | check at Task 5 |
| Task 4 Modules | Task 7 CI tags | module methods called from steps still work under profile tags | check at Task 7 |
