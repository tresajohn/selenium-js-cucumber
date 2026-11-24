import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { SearchModule } from '../../modules/SearchModule';

When('I search for {string}', async function (this: TypedWorld, keyword: string) {
  this.searchModule = new SearchModule(this);
  await this.searchModule.search(keyword);
});

Then(
  'I should see at least {int} product in the results',
  async function (this: TypedWorld, count: number) {
    const results = await this.searchModule!.getResultNames();
    expect(results.length).to.be.at.least(count);
  }
);

Then(
  'I should see {int} products in the results',
  async function (this: TypedWorld, count: number) {
    const results = await this.searchModule!.getResultNames();
    expect(results.length).to.equal(count);
  }
);
