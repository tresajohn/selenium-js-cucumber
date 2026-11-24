import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { CartModule } from '../../modules/CartModule';

Given('I am on the home page', async function (this: TypedWorld) {
  this.cartModule = new CartModule(this);
  await this.cartModule.goHome();
});

When('I add the first visible product to cart', async function (this: TypedWorld) {
  await this.cartModule!.addFirstProductToCart();
});

When('I navigate to the cart page', async function (this: TypedWorld) {
  await this.cartModule!.viewCart();
});

Then('I should see at least 1 item in the cart', async function (this: TypedWorld) {
  const count = await this.cartModule!.getItemCount();
  expect(count).to.be.at.least(1);
});

Then('the cart item names list should not be empty', async function (this: TypedWorld) {
  const names = await this.cartModule!.getCartItemNames();
  expect(names).to.not.be.empty;
});
