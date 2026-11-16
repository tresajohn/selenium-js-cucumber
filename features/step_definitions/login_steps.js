const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { LoginPage } = require('../../pages/LoginPage');
const { RegistrationPage } = require('../../pages/RegistrationPage');

Given('I navigate to the login page', async function () {
  this.loginPage = new LoginPage(this.driver);
  await this.loginPage.navigate(`${this.config.baseUrl}/login`);
});

When('I login with email {string} and password {string}', async function (email, password) {
  const actualEmail = email === 'valid' ? this.config.testEmail : email;
  const actualPw = password === 'valid' ? this.config.testPassword : password;
  await this.loginPage.login(actualEmail, actualPw);
});

When('I submit login with empty email and password', async function () {
  await this.loginPage.click(LoginPage.SUBMIT);
});

Then('I should be logged in successfully', async function () {
  expect(await this.loginPage.isLoggedIn()).to.be.true;
});

Then('I should see the login error {string}', async function (message) {
  const actual = await this.loginPage.getErrorMessage();
  expect(actual).to.include(message);
});

Then('I should remain on the login page', async function () {
  const url = await this.driver.getCurrentUrl();
  expect(url).to.include('/login');
});

When('I sign up with a unique email and name {string}', async function (name) {
  const uniqueEmail = `qaauto${Date.now()}@mailinator.com`;
  await this.loginPage.fillSignup(name, uniqueEmail);
  this.regPage = new RegistrationPage(this.driver);
  await this.regPage.completeRegistration('Test@1234');
});

When('I sign up with email {string} and name {string}', async function (email, name) {
  await this.loginPage.fillSignup(name, email);
});

Then('I should see the account created confirmation', async function () {
  expect(await this.regPage.isRegistered()).to.be.true;
});

Then('I should see the signup error {string}', async function (message) {
  const actual = await this.loginPage.getSignupError();
  expect(actual).to.include(message);
});
