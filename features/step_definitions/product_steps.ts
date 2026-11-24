import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';

When('I search for {string}', async function (this: TypedWorld, keyword: string) {
  await this.homePage!.searchProduct(keyword);
});

Then(
  'I should see at least {int} product in the results',
  async function (this: TypedWorld, count: number) {
    const results = await this.homePage!.getProductNames();
    expect(results.length).to.be.at.least(count);
  }
);

Then(
  'I should see {int} products in the results',
  async function (this: TypedWorld, count: number) {
    const results = await this.homePage!.getProductNames();
    expect(results.length).to.equal(count);
  }
);
