# Selenium JS Cucumber BDD

![CI](https://github.com/tresajohn/selenium-js-cucumber/actions/workflows/ci.yml/badge.svg)

End-to-end test suite for [automationexercise.com](https://automationexercise.com) built with **Selenium WebDriver (JavaScript)** and **Cucumber.js** (BDD / Gherkin).

This is one of three portfolio frameworks demonstrating the same test coverage across different languages and tools:
- **Python** — `selenium-webdriver` + Behave (this repo's sister project)
- **JavaScript (this repo)** — `selenium-webdriver` + Cucumber.js
- **JavaScript** — Playwright + Cucumber.js _(coming soon)_

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| `selenium-webdriver` ^4.x | Browser automation |
| `@cucumber/cucumber` ^10.x | BDD framework (Gherkin) |
| `chai` ^4.x | Assertions |
| `dotenv` ^16.x | Environment variable management |
| Node.js 18+ | Runtime |

---

## Project Structure

```
selenium-js-cucumber/
├── features/
│   ├── *.feature                  # Gherkin scenarios
│   └── step_definitions/          # Step implementations
├── pages/                         # Page Object Model
│   ├── BasePage.js                # Shared helpers (navigate, click, typeText…)
│   ├── LoginPage.js
│   ├── RegistrationPage.js
│   ├── HomePage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   └── ContactPage.js
├── support/
│   ├── world.js                   # Cucumber World (shared driver + config)
│   └── hooks.js                   # Before/After — driver lifecycle + screenshots
├── config/
│   ├── config.json                # Base configuration
│   └── config.js                  # Config loader (env var overrides)
├── utils/
│   ├── driverFactory.js           # Chrome / Firefox driver builder
│   ├── waitHelper.js              # Explicit waits wrapper
│   └── screenshotHelper.js        # Screenshot on failure
├── reports/                       # HTML report output (gitignored)
├── screenshots/                   # Failure screenshots (gitignored)
├── .env.example                   # Environment variable template
└── cucumber.js                    # Cucumber runner config
```

---

## Setup

### Prerequisites

- Node.js 18+
- Google Chrome (latest)
- ChromeDriver is managed automatically by Selenium Manager

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your credentials if you want to run scenarios tagged `@needs_credentials`:

```
TEST_EMAIL=your@email.com
TEST_PASSWORD=yourpassword
```

---

## Running Tests

**Run the full suite:**
```bash
npm test
```

**Run headless:**
```bash
npm run test:headless
```

**Run a single feature:**
```bash
npx cucumber-js features/login.feature
npx cucumber-js features/cart.feature
npx cucumber-js features/product_search.feature
```

**Run with HTML report:**
Reports are generated automatically at `reports/cucumber-report.html` on every run.

---

## Test Coverage

| Feature | Scenarios | Tag |
|---------|-----------|-----|
| Login | Valid login, invalid credentials, empty form | `@needs_credentials` on valid login |
| Registration | New account, duplicate email error | — |
| Shopping Cart | Add product, verify item names | — |
| Checkout | Full checkout flow | `@needs_credentials` |
| Contact Form | Submit with valid data | — |
| Product Search | Keyword match, no results | — |

Scenarios tagged `@needs_credentials` are **skipped** automatically when `TEST_EMAIL` / `TEST_PASSWORD` are not set in `.env`. All other scenarios run without credentials.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER` | `chrome` | Browser to use (`chrome` / `firefox`) |
| `HEADLESS` | `false` | Run headless (`true` / `false`) |
| `TEST_EMAIL` | — | Account email for credentialed scenarios |
| `TEST_PASSWORD` | — | Account password for credentialed scenarios |
| `JIRA_BASE_URL` | — | Jira base URL (optional integration) |
| `JIRA_EMAIL` | — | Jira account email |
| `JIRA_API_TOKEN` | — | Jira API token |
| `JIRA_PROJECT_KEY` | `SJS` | Jira project key for bug reports |
