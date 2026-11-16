const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { LoginPage } = require('../../pages/LoginPage');
const { HomePage } = require('../../pages/HomePage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutPage } = require('../../pages/CheckoutPage');

Given('I am logged in as a registered user', async function () {
  const loginPage = new LoginPage(this.driver);
  await loginPage.navigate(`${this.config.baseUrl}/login`);
  await loginPage.login(this.config.testEmail, this.config.testPassword);
  expect(await loginPage.isLoggedIn()).to.be.true;
});

Given('I have a product in my cart', async function () {
  this.homePage = new HomePage(this.driver);
  await this.homePage.navigateHome(this.config.baseUrl);
  await this.homePage.addFirstProductToCart();
});

When('I proceed to checkout from cart', async function () {
  this.cartPage = new CartPage(this.driver);
  await this.cartPage.navigate(`${this.config.baseUrl}/view_cart`);
  await this.cartPage.click(CartPage.PROCEED_CHECKOUT);
});

When('I confirm and pay for the order', async function () {
  this.checkoutPage = new CheckoutPage(this.driver);
  await this.checkoutPage.confirmOrder();
});

Then('I should see the order placed confirmation', async function () {
  expect(await this.checkoutPage.isOrderPlaced()).to.be.true;
});
