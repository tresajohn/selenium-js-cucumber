const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { ContactPage } = require('../../pages/ContactPage');

Given('I navigate to the contact page', async function () {
  this.contactPage = new ContactPage(this.driver);
  await this.contactPage.navigate(`${this.config.baseUrl}/contact_us`);
});

When('I fill in the contact form with valid details', async function () {
  await this.contactPage.fillContactForm(
    'Tresa QA',
    'tresa.qa@test.com',
    'Portfolio Test',
    'This is an automated test message from Selenium JS framework.'
  );
});

When('I submit the contact form', async function () {
  await this.contactPage.submitForm();
});

Then('I should see the contact success message', async function () {
  const msg = await this.contactPage.getSuccessMessage();
  expect(msg.toLowerCase()).to.include('success');
});
