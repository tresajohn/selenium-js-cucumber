import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { LoginPage } from '../../pages/LoginPage';
import { RegistrationPage } from '../../pages/RegistrationPage';

Given('I navigate to the login page', async function (this: TypedWorld) {
  this.loginPage = new LoginPage(this.driver, this.config.timeout);
  await this.loginPage.navigate(`${this.config.baseUrl}/login`);
});

When(
  'I login with email {string} and password {string}',
  async function (this: TypedWorld, email: string, password: string) {
    const actualEmail = email === 'valid' ? this.config.testEmail : email;
    const actualPw = password === 'valid' ? this.config.testPassword : password;
    await this.loginPage!.login(actualEmail, actualPw);
  }
);

When('I submit login with empty email and password', async function (this: TypedWorld) {
  await this.loginPage!.click(this.loginPage!.submit);
});

Then('I should be logged in successfully', async function (this: TypedWorld) {
  expect(await this.loginPage!.isLoggedIn()).to.be.true;
});

Then('I should see the login error {string}', async function (this: TypedWorld, message: string) {
  const actual = await this.loginPage!.getErrorMessage();
  expect(actual).to.include(message);
});

Then('I should remain on the login page', async function (this: TypedWorld) {
  const url = await this.driver.getCurrentUrl();
  expect(url).to.include('/login');
});

When(
  'I sign up with a unique email and name {string}',
  async function (this: TypedWorld, name: string) {
    const uniqueEmail = `qaauto${Date.now()}@mailinator.com`;
    await this.loginPage!.fillSignup(name, uniqueEmail);
    this.regPage = new RegistrationPage(this.driver);
    await this.regPage.completeRegistration('Test@1234');
  }
);

When(
  'I sign up with email {string} and name {string}',
  async function (this: TypedWorld, email: string, name: string) {
    const actualEmail = email === 'valid' ? this.config.testEmail : email;
    await this.loginPage!.fillSignup(name, actualEmail);
  }
);

Then('I should see the account created confirmation', async function (this: TypedWorld) {
  expect(await this.regPage!.isRegistered()).to.be.true;
});

Then('I should see the signup error {string}', async function (this: TypedWorld, message: string) {
  const actual = await this.loginPage!.getSignupError();
  expect(actual).to.include(message);
});
