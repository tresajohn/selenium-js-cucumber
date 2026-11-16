const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { HomePage } = require('../../pages/HomePage');
const { CartPage } = require('../../pages/CartPage');

Given('I am on the home page', async function () {
  this.homePage = new HomePage(this.driver, this.timeoutSeconds);
  await this.homePage.navigateHome(this.config.baseUrl);
});

When('I add the first visible product to cart', async function () {
  await this.homePage.addFirstProductToCart();
});

When('I navigate to the cart page', async function () {
  this.cartPage = new CartPage(this.driver, this.timeoutSeconds);
  await this.cartPage.navigate(`${this.config.baseUrl}/view_cart`);
});

Then('I should see at least 1 item in the cart', async function () {
  const items = await this.cartPage.getCartItems();
  expect(items.length).to.be.at.least(1);
});

Then('the cart item names list should not be empty', async function () {
  const names = await this.cartPage.getCartItemNames();
  expect(names).to.not.be.empty;
});
