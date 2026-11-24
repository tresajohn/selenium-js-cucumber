import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { ContactModule } from '../../modules/ContactModule';

Given('I navigate to the contact page', async function (this: TypedWorld) {
  this.contactModule = new ContactModule(this);
  await this.contactModule.navigateToContact();
});

When('I fill in the contact form with valid details', async function (this: TypedWorld) {
  await this.contactModule!.fill({
    name: 'Tresa QA',
    email: 'tresa.qa@test.com',
    subject: 'Portfolio Test',
    message: 'This is an automated test message from Selenium JS framework.',
  });
});

When('I submit the contact form', async function (this: TypedWorld) {
  await this.contactModule!.submit();
});

Then('I should see the contact success message', async function (this: TypedWorld) {
  const msg = await this.contactModule!.getSuccessMessage();
  expect(msg.toLowerCase()).to.include('success');
});
