module.exports = {
  default: {
    require: ['support/**/*.js', 'features/step_definitions/**/*.js'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true
  }
};
