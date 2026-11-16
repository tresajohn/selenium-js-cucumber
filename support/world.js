const { setWorldConstructor } = require('@cucumber/cucumber');
const { getConfig } = require('../config/config');

class CustomWorld {
  constructor() {
    this.config = getConfig();
    this.driver = null;
  }
}

setWorldConstructor(CustomWorld);
