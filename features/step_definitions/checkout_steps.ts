import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { LoginPage } from '../../pages/LoginPage';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

Given('I am logged in as a registered user', async function (this: TypedWorld) {
  const loginPage = new LoginPage(this.driver, this.config.timeout);
  await loginPage.navigate(`${this.config.baseUrl}/login`);
  await loginPage.login(this.config.testEmail, this.config.testPassword);
  expect(await loginPage.isLoggedIn()).to.be.true;
});

Given('I have a product in my cart', async function (this: TypedWorld) {
  this.homePage = new HomePage(this.driver, this.config.timeout);
  await this.homePage.navigateHome(this.config.baseUrl);
  await this.homePage.addFirstProductToCart();
});

When('I proceed to checkout from cart', async function (this: TypedWorld) {
  this.cartPage = new CartPage(this.driver, this.config.timeout);
  await this.cartPage.navigate(`${this.config.baseUrl}/view_cart`);
  await this.cartPage.proceedToCheckout();
});

When('I confirm and pay for the order', async function (this: TypedWorld) {
  this.checkoutPage = new CheckoutPage(this.driver, this.config.timeout);
  await this.checkoutPage.confirmOrder();
});

Then('I should see the order placed confirmation', async function (this: TypedWorld) {
  expect(await this.checkoutPage!.isOrderPlaced()).to.be.true;
});
