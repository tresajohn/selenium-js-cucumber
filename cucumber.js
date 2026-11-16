module.exports = {
  default: {
    require: ['support/**/*.js', 'features/step_definitions/**/*.js'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'allure-cucumberjs/reporter'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    publish: false
  }
};
