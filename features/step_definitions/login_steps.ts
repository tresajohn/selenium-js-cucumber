import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TypedWorld } from '../../support/world';
import { LoginModule } from '../../modules/LoginModule';

Given('I navigate to the login page', async function (this: TypedWorld) {
  this.loginModule = new LoginModule(this);
  await this.loginModule.navigateToLogin();
});

When(
  'I login with email {string} and password {string}',
  async function (this: TypedWorld, email: string, password: string) {
    const actualEmail = email === 'valid' ? this.config.testEmail : email;
    const actualPw = password === 'valid' ? this.config.testPassword : password;
    await this.loginModule!.login(actualEmail, actualPw);
  }
);

When('I submit login with empty email and password', async function (this: TypedWorld) {
  await this.loginModule!.clickLoginSubmit();
});

Then('I should be logged in successfully', async function (this: TypedWorld) {
  expect(await this.loginModule!.isLoggedIn()).to.be.true;
});

Then('I should see the login error {string}', async function (this: TypedWorld, message: string) {
  const actual = await this.loginModule!.getErrorMessage();
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
    await this.loginModule!.fillSignup(name, uniqueEmail);
    await this.loginModule!.completeRegistration('Test@1234');
  }
);

When(
  'I sign up with email {string} and name {string}',
  async function (this: TypedWorld, email: string, name: string) {
    const actualEmail = email === 'valid' ? this.config.testEmail : email;
    await this.loginModule!.fillSignup(name, actualEmail);
  }
);

Then('I should see the account created confirmation', async function (this: TypedWorld) {
  expect(await this.loginModule!.isRegistered()).to.be.true;
});

Then('I should see the signup error {string}', async function (this: TypedWorld, message: string) {
  const actual = await this.loginModule!.getSignupError();
  expect(actual).to.include(message);
});
