# Selenium JS Cucumber BDD

![CI](https://github.com/tresajohn/selenium-js-cucumber/actions/workflows/ci.yml/badge.svg)

End-to-end test suite for [automationexercise.com](https://automationexercise.com) built with **Selenium WebDriver 4.x** and **Cucumber.js 10.x** (BDD / Gherkin) in **TypeScript**.

This is one of three portfolio frameworks demonstrating the same test coverage across different languages and tools:
- **Python** — `selenium-webdriver` + Behave
- **TypeScript (this repo)** — `selenium-webdriver` + Cucumber.js
- **TypeScript** — Playwright + Cucumber.js ([playwright-e2e-suite](https://github.com/tresajohn/playwright-e2e-suite))

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| `selenium-webdriver` | ^4.51 | Browser automation |
| `@cucumber/cucumber` | ^10.9 | BDD framework (Gherkin) |
| `chai` | ^4.5 | Assertions |
| `TypeScript` | ^5.9 | Type-safe source |
| `tsx` | ^4.x | Zero-config TS runner for Cucumber |
| `ESLint` + `Prettier` | ^9.x / ^3.x | Lint + format |
| `Husky` + `commitlint` | ^9.x / ^21.x | Pre-commit gate + conventional commits |
| `Docker` | — | `selenium/standalone-chrome` containerised run |
| `allure-cucumberjs` | ^3.x | Rich HTML report |
| `dotenv` | ^18.x | Environment variable management |
| Node.js | ≥ 20 | Runtime |

---

## Three-Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│  Layer 3 — BDD                                       │
│  features/*.feature  features/step_definitions/*.ts  │
│  Steps assert only — no DOM calls here               │
└─────────────────────┬────────────────────────────────┘
                      │ calls
┌─────────────────────▼────────────────────────────────┐
│  Layer 2 — Modules                                   │
│  modules/LoginModule   modules/CartModule            │
│  modules/CheckoutModule  modules/SearchModule        │
│  modules/ContactModule                               │
│  Orchestrate multi-step workflows                    │
└─────────────────────┬────────────────────────────────┘
                      │ calls
┌─────────────────────▼────────────────────────────────┐
│  Layer 1 — Pages + Utils                             │
│  pages/BasePage  pages/LoginPage  pages/HomePage …   │
│  utils/logger  utils/testData.factory                │
│  utils/jiraHelper  utils/flakyFormatter              │
│  utils/driverFactory  utils/waitHelper               │
└──────────────────────────────────────────────────────┘
```

---

## Project Structure

```
selenium-js-cucumber/
├── features/
│   ├── *.feature                       # Gherkin scenarios (@smoke / @regression)
│   └── step_definitions/               # Step implementations (TypeScript)
├── modules/                            # Layer 2 — workflow orchestration
│   ├── LoginModule.ts
│   ├── CartModule.ts
│   ├── CheckoutModule.ts
│   ├── SearchModule.ts
│   └── ContactModule.ts
├── pages/                              # Layer 1 — Page Object Model
│   ├── BasePage.ts                     # Shared helpers (navigate, click, typeText…)
│   ├── LoginPage.ts
│   ├── RegistrationPage.ts
│   ├── HomePage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ContactPage.ts
├── support/
│   ├── world.ts                        # TypedWorld (typed driver, config, page+module refs)
│   └── hooks.ts                        # Before/After — driver lifecycle, Jira, screenshots
├── config/
│   ├── config.json                     # Base configuration
│   └── config.ts                       # Config loader (env var overrides)
├── utils/
│   ├── driverFactory.ts                # Chrome / Firefox driver builder
│   ├── waitHelper.ts                   # Explicit waits wrapper
│   ├── screenshotHelper.ts             # Screenshot on failure
│   ├── logger.ts                       # Structured logger (CI NDJSON / pretty local)
│   ├── testData.factory.ts             # UUID-based unique test data per run
│   ├── jiraHelper.ts                   # Automatic Jira ticket on failure (ADF body)
│   └── flakyFormatter.ts              # Flaky detection (threshold-based exitCode)
├── tests/                              # Unit tests for utils and modules
├── Dockerfile                          # selenium/standalone-chrome image
├── docker-compose.yml                  # smoke + regression compose services
├── .dockerignore
├── .husky/pre-commit                   # Runs npm run validate before every commit
├── commitlint.config.ts                # Conventional commits
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
├── cucumber.js                         # Runner profiles (default, smoke, regression)
└── .github/workflows/ci.yml           # 4-job CI: code-quality → smoke → regression → pages
```

---

## Setup

### Prerequisites

- Node.js 20+
- Google Chrome (latest) — ChromeDriver managed automatically by Selenium Manager

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` for credentialed scenarios and optional Jira integration:

```
TEST_EMAIL=your@email.com
TEST_PASSWORD=yourpassword

# Optional — creates Jira tickets on failure
JIRA_BASE_URL=https://yourorg.atlassian.net
JIRA_EMAIL=you@yourorg.com
JIRA_API_TOKEN=your_token
JIRA_PROJECT_KEY=KAN
```

---

## Running Tests

**Full suite:**
```bash
npm test
```

**Headless:**
```bash
npm run test:headless
```

**Smoke suite only (fast, happy-path):**
```bash
npm run test:smoke
```

**Regression suite (all error/edge cases):**
```bash
npm run test:regression
```

**Single feature:**
```bash
npx cucumber-js features/login.feature
```

**Validate (typecheck + lint + format):**
```bash
npm run validate
```

---

## Running with Docker

```bash
# Build the image
docker compose build

# Run smoke suite
docker compose run --rm smoke

# Run regression suite
docker compose run --rm regression
```

Results are written to `./test-results/` and `./allure-results/` via volume mounts.

---

## Reports

```bash
npm run report       # Generate Allure HTML report
npm run report:open  # Open in browser
```

The CI pipeline publishes the combined Allure report to GitHub Pages after every push to `main`.

---

## Key Design Patterns

### Getter-Based Locators

Page classes use TypeScript `get` accessors instead of static fields. Each call returns a fresh `By` descriptor — no stale reference risk:

```typescript
export class LoginPage extends BasePage {
  get email(): By { return By.css("[data-qa='login-email']"); }
  get password(): By { return By.css("[data-qa='login-password']"); }
}
```

### Modules Layer

Steps never touch the DOM. They call module methods that orchestrate page interactions:

```typescript
// step_definitions/login_steps.ts
Given('I navigate to the login page', async function (this: TypedWorld) {
  this.loginModule = new LoginModule(this);
  await this.loginModule.navigateToLogin();
});
```

### Structured Logger

CI-aware: NDJSON when `process.env.CI` is truthy, human-readable locally:

```typescript
const log = Logger.create('LoginModule');
log.info('Navigating to login page');  // → ISO [INFO] [LoginModule] …
```

### Test Data Factory

UUID-based unique data per run — no hardcoded emails:

```typescript
const user = createUserData();
// { name: 'QA Test-a1b2c3d4', email: 'qaauto-a1b2c3d4@mailinator.com', password: 'Test@1234' }
```

### Flaky Detection

The `FlakyFormatter` tracks retried tests and writes `test-results/flaky-report.json`. Exceeding `FLAKY_THRESHOLD` (default `0.10`) sets `process.exitCode = 1`:

```bash
FLAKY_THRESHOLD=0.05 npm test
```

---

## Jira Integration

📋 **[View KAN Board](https://tresajohn.atlassian.net/jira/software/projects/KAN/boards/2)**

When `JIRA_API_TOKEN` is set, every failed scenario automatically creates a Jira issue with:
- ADF-formatted body (environment block, error code block, triage checklist)
- Priority: **High** for `@smoke`, **Medium** for `@regression`
- Labels: `automation-failure`, `cucumber`, `selenium`, tag-derived label
- Screenshot attachment
- Duplicate guard (skips creation if an open ticket already exists)

---

## Test Coverage

| Feature | Scenarios | Tags |
|---------|-----------|------|
| Login | Valid login, invalid credentials, empty form | @smoke (valid), @regression (others) |
| Registration | New account, duplicate email error | @regression |
| Shopping Cart | Add product, verify item names | @smoke (add), @regression (names) |
| Checkout | Full checkout flow | @smoke |
| Contact Form | Submit with valid data | @regression |
| Product Search | Keyword match, no results | @smoke (match), @regression (empty) |

Scenarios tagged `@needs_credentials` are skipped automatically when `TEST_EMAIL` / `TEST_PASSWORD` are not set.

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER` | `chrome` | Browser to use (`chrome` / `firefox`) |
| `HEADLESS` | `false` | Run headless (`true` / `false`) |
| `TEST_EMAIL` | — | Account email for credentialed scenarios |
| `TEST_PASSWORD` | — | Account password for credentialed scenarios |
| `JIRA_BASE_URL` | — | Jira instance URL |
| `JIRA_EMAIL` | — | Jira account email |
| `JIRA_API_TOKEN` | — | Jira API token |
| `JIRA_PROJECT_KEY` | `KAN` | Jira project key |
| `FLAKY_THRESHOLD` | `0.10` | Flaky rate that fails the run |
| `HUSKY` | — | Set to `0` to skip pre-commit hook (CI/Docker) |

---

## CI/CD

The `.github/workflows/ci.yml` pipeline has four jobs:

1. **code-quality** — `npm run validate` (typecheck + lint + format)
2. **smoke-tests** — needs `code-quality`, runs `@smoke` scenarios
3. **regression-tests** — needs `smoke-tests`, runs `@regression` on `main` and PRs
4. **publish-report** — merges Allure results, deploys to GitHub Pages

## Git Hooks

Husky runs `npm run validate` (typecheck → lint → format check) before every commit. Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, etc.).
