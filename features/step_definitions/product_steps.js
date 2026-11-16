const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I search for {string}', async function (keyword) {
  await this.homePage.searchProduct(keyword);
});

Then('I should see at least {int} product in the results', async function (count) {
  const results = await this.homePage.getSearchResults();
  expect(results.length).to.be.at.least(count);
});

Then('I should see {int} products in the results', async function (count) {
  const results = await this.homePage.getSearchResults();
  expect(results.length).to.equal(count);
});
