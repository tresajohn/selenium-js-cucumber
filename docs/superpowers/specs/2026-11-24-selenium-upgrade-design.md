# Selenium JS Cucumber — Architecture Upgrade Design

**Author:** Tresa John  
**Date:** 2026-11-24  
**Target repo:** tresajohn/selenium-js-cucumber

---

## Intent and Why

The framework currently works but sits at Layer 1 (pages + steps in direct contact). It needs to match the architecture maturity of `tresajohn/playwright-e2e-suite` so both portfolio projects demonstrate the same engineering principles applied across different stacks. The upgrade adds a modules layer, TypeScript, a quality gate, richer CI, containerisation, and observability — the same set of concerns the Playwright suite already has.

---

## Goals

- Three-layer architecture: Pages → Modules → Steps (same as Playwright suite)
- TypeScript throughout — typed World, typed modules, typed pages
- Getter-based locators on page objects (TypeScript `get` accessors)
- Test data factory with uuid-based unique data per run
- Structured logger: pretty locally, NDJSON in CI — same design as Playwright logger.ts
- Rich Jira tickets on failure: environment block, verbatim error, impact statement, triage checklist, automation reference, screenshot attached
- Pre-commit quality gate: ESLint + Prettier + commitlint via Husky
- CI split: `code-quality` job (ESLint + Prettier + tsc) gates `smoke-tests` and `regression-tests`
- `@smoke` / `@regression` tags on all scenarios; CI runs smoke on every push, regression on PR/main only
- Docker: `selenium/standalone-chrome:latest` image, docker-compose services for smoke and regression
- Flaky detection: custom Cucumber formatter tracking retries, writes `test-results/flaky-report.json`, fails CI if rate > 10%

---

## Non-Goals

- Auth cookie reuse (Selenium cookie pickling is fragile across page navigations on this site)
- Pact contract testing (pact-js needs a provider endpoint; AutomationExercise doesn't expose one)
- Parallel sharding (Cucumber JS has no native worker sharding like Playwright; excluded to avoid unmaintained packages)

---

## Anti-Goals

- Do not add features not on the target app
- Do not restructure features/ — the Gherkin scenarios are the product
- Do not duplicate Playwright suite code — this is a parallel portfolio piece, not a copy

---

## Constraints

- Node.js >= 20
- TypeScript >= 5.x
- `@cucumber/cucumber` >= 10.9.0 (already in package.json)
- `selenium-webdriver` >= 4.51.0 (already in package.json)
- `chai` for assertions (already in package.json)
- Husky >= 9.x, commitlint >= 21.x (match Playwright suite)
- ESLint >= 9.x flat config, Prettier >= 3.x (match Playwright suite)
- Docker base image: `selenium/standalone-chrome:latest`
- Jira REST API v3 (match Playwright reporter)
- All new files TypeScript (.ts); no plain .js files in src tree after conversion

---

## Approaches Considered

### A. TypeScript + modules layer + all eight capabilities (chosen)
Full parity with Playwright suite. TypeScript enables typed World, modules, and pages. Modules layer is the most visible architectural difference vs current state. Pre-commit + CI split are process maturity signals. Docker and flaky detection round out CI/CD parity.

### B. Modules layer only, stay in JS
Faster. But the Playwright suite is TypeScript; keeping this in JS makes the two portfolio projects look like different levels of effort. TypeScript conversion from clean JS is mechanical.

### C. TypeScript conversion only, no modules
Misses the architecture point. The modules layer is the substance; TypeScript is the vehicle.

**Chosen:** A.

---

## Architecture

### Three Layers

```
Layer 3 — Features + Steps
  features/**/*.feature         Gherkin only — no page or driver calls
  features/step_definitions/    Thin steps — call modules, assert results

Layer 2 — Modules
  modules/LoginModule.ts        login(), logout()
  modules/CartModule.ts         addFirstToCart(), viewCart()
  modules/CheckoutModule.ts     proceedToCheckout(), confirmOrder()
  modules/SearchModule.ts       search(), getResults()
  modules/ContactModule.ts      fillAndSubmit()

Layer 1 — Pages + Utils
  pages/BasePage.ts             navigate(), click(), typeText(), …
  pages/LoginPage.ts            get email(), get password(), login(), …
  pages/CartPage.ts
  pages/CheckoutPage.ts
  pages/ContactPage.ts
  pages/HomePage.ts
  pages/RegistrationPage.ts
```

### Support Layer

```
utils/logger.ts                 Logger class — pretty / CI NDJSON
utils/testData.factory.ts       createUserData(), createContactData()
utils/driverFactory.ts          DriverFactory.create()
utils/waitHelper.ts             WaitHelper
utils/screenshotHelper.ts       takeScreenshot()
utils/jiraHelper.ts             JiraHelper — rich ticket creation
utils/flakyFormatter.ts         Cucumber formatter — flaky-report.json
support/world.ts                TypedWorld extending World
support/hooks.ts                Before/After — driver, screenshot, Jira, flaky
```

### Config + Tooling

```
tsconfig.json
eslint.config.mjs               flat config
.prettierrc
.husky/pre-commit
commitlint.config.ts
Dockerfile
docker-compose.yml
.dockerignore
.github/workflows/ci.yml        split: code-quality + smoke-tests + regression-tests
```

---

## TypedWorld shape

```typescript
// support/world.ts
import { World, IWorldOptions } from '@cucumber/cucumber';
import { WebDriver } from 'selenium-webdriver';
import { Config, getConfig } from '../config/config';

export class TypedWorld extends World {
  config: Config = getConfig();
  driver!: WebDriver;
  timeoutMs: number = 10000;
  // per-scenario page refs (set by modules)
  loginPage?: import('../pages/LoginPage').LoginPage;
  homePage?: import('../pages/HomePage').HomePage;
  cartPage?: import('../pages/CartPage').CartPage;
  checkoutPage?: import('../pages/CheckoutPage').CheckoutPage;
  contactPage?: import('../pages/ContactPage').ContactPage;
  regPage?: import('../pages/RegistrationPage').RegistrationPage;
}
```

---

## Logger design (matches Playwright logger.ts)

```typescript
// utils/logger.ts
export enum LogLevel { DEBUG = 'DEBUG', INFO = 'INFO', WARN = 'WARN', ERROR = 'ERROR' }

export class Logger {
  constructor(private context: string) {}
  static create(context: string): Logger
  static setLogLevel(level: LogLevel): void
  info(message: string): void      // CI → NDJSON, local → pretty
  warn(message: string): void
  error(message: string, error?: unknown): void
  step(n: number, description: string): void
  testStart(name: string): void
  testEnd(name: string): void
}
```

---

## Jira ticket structure (matches Playwright reporter)

Fields populated by `JiraHelper.createTicket(failure: FailureContext)`:

- **Summary:** `[Cucumber Failure] <feature>: <scenario>`
- **Priority:** High if `@smoke`, Medium otherwise
- **Labels:** `automation-failure`, `cucumber`, `selenium`, `smoke`|`regression`
- **Description (ADF):**
  - Environment block: app URL, test type (BDD/Gherkin), tags, severity, CI run, commit SHA
  - Failed scenario: title, feature file, suite path, duration
  - Actual result (error message in code block, ANSI stripped)
  - Expected result: standard line
  - Impact: 🔴 smoke / 🟡 regression statement
  - Automation reference: `npx cucumber-js --tags "@name"` repro command
  - Triage checklist: reproduce → check env → assign → retest → close
- **Attachment:** failure screenshot

Duplicate guard: search open tickets with same summary before creating.

---

## Flaky detection design

`utils/flakyFormatter.ts` implements Cucumber's `Formatter` interface:

- Listens to `testCaseFinished` events
- Tracks scenarios that passed after one or more prior `FAILED` attempts on the same `testCaseId`
- On `testRunFinished`: writes `test-results/flaky-report.json` with `{ flakyCount, totalTests, flakyRate, threshold, thresholdExceeded, flakyTests[] }`
- `thresholdExceeded: true` → `process.exitCode = 1`
- Threshold configurable via `FLAKY_THRESHOLD` env var, default `0.10`

Requires `@cucumber/cucumber` retry: `--retry 1` in `cucumber.js` profile.

---

## Docker design

**Dockerfile:** FROM `selenium/standalone-chrome:latest`, copies source, `npm ci`, `npm run typecheck`, CMD `npx cucumber-js`.

**docker-compose.yml services:**
- `selenium-base` (base, not run directly) — env vars, volumes
- `smoke` — `--tags "@smoke"` — container_name `selenium-smoke`
- `regression` — `--tags "@regression"` — container_name `selenium-regression`

Volumes: `./test-results:/app/test-results`, `./allure-results:/app/allure-results`.

---

## CI split design

**code-quality job:** `npm run typecheck && npm run lint && npm run format:check`

**smoke-tests job:** needs code-quality, runs `npx cucumber-js --profile smoke`, publishes Allure artifact

**regression-tests job:** needs smoke-tests (on main/PR to main), runs `npx cucumber-js --profile regression`

**publish-report job:** needs all test jobs, deploys Allure to GitHub Pages (matches existing structure)
