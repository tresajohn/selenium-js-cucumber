import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { LoginModule } from '../../modules/LoginModule';
import { CartModule } from '../../modules/CartModule';
import { CheckoutModule } from '../../modules/CheckoutModule';

Given('I am logged in as a registered user', async function (this: TypedWorld) {
  this.loginModule = new LoginModule(this);
  await this.loginModule.navigateToLogin();
  await this.loginModule.login(this.config.testEmail, this.config.testPassword);
  expect(await this.loginModule.isLoggedIn()).to.be.true;
});

Given('I have a product in my cart', async function (this: TypedWorld) {
  this.cartModule = new CartModule(this);
  await this.cartModule.goHome();
  await this.cartModule.addFirstProductToCart();
});

When('I proceed to checkout from cart', async function (this: TypedWorld) {
  this.checkoutModule = new CheckoutModule(this);
  await this.checkoutModule.proceedToCheckout();
});

When('I confirm and pay for the order', async function (this: TypedWorld) {
  await this.checkoutModule!.confirmOrder();
});

Then('I should see the order placed confirmation', async function (this: TypedWorld) {
  expect(await this.checkoutModule!.isOrderPlaced()).to.be.true;
});
