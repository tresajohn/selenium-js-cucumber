import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { ContactPage } from '../../pages/ContactPage';

Given('I navigate to the contact page', async function (this: TypedWorld) {
  this.contactPage = new ContactPage(this.driver, this.config.timeout);
  await this.contactPage.navigate(`${this.config.baseUrl}/contact_us`);
});

When('I fill in the contact form with valid details', async function (this: TypedWorld) {
  await this.contactPage!.fillContactForm(
    'Tresa QA',
    'tresa.qa@test.com',
    'Portfolio Test',
    'This is an automated test message from Selenium JS framework.'
  );
});

When('I submit the contact form', async function (this: TypedWorld) {
  await this.contactPage!.submitForm();
});

Then('I should see the contact success message', async function (this: TypedWorld) {
  const msg = await this.contactPage!.getSuccessMessage();
  expect(msg.toLowerCase()).to.include('success');
});
