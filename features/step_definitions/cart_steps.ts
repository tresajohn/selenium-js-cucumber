import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';

Given('I am on the home page', async function (this: TypedWorld) {
  this.homePage = new HomePage(this.driver, this.config.timeout);
  await this.homePage.navigateHome(this.config.baseUrl);
});

When('I add the first visible product to cart', async function (this: TypedWorld) {
  await this.homePage!.addFirstProductToCart();
});

When('I navigate to the cart page', async function (this: TypedWorld) {
  this.cartPage = new CartPage(this.driver, this.config.timeout);
  await this.cartPage.navigate(`${this.config.baseUrl}/view_cart`);
});

Then('I should see at least 1 item in the cart', async function (this: TypedWorld) {
  const items = await this.cartPage!.getCartItems();
  expect(items.length).to.be.at.least(1);
});

Then('the cart item names list should not be empty', async function (this: TypedWorld) {
  const names = await this.cartPage!.getCartItemNames();
  expect(names).to.not.be.empty;
});
