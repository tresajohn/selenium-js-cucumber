module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: ['support/**/*.ts', 'features/step_definitions/**/*.ts'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'allure-cucumberjs/reporter',
      './utils/flakyFormatter.ts',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    retry: 1,
    publish: false,
  },
  smoke: {
    requireModule: ['tsx/cjs'],
    require: ['support/**/*.ts', 'features/step_definitions/**/*.ts'],
    tags: '@smoke',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: { snippetInterface: 'async-await' },
    publish: false,
  },
  regression: {
    requireModule: ['tsx/cjs'],
    require: ['support/**/*.ts', 'features/step_definitions/**/*.ts'],
    tags: '@regression',
    format: ['progress-bar', 'allure-cucumberjs/reporter'],
    formatOptions: { snippetInterface: 'async-await' },
    publish: false,
  },
};
