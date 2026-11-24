import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  get passwordField(): By {
    return By.css("[data-qa='password']");
  }
  get firstName(): By {
    return By.css("[data-qa='first_name']");
  }
  get lastName(): By {
    return By.css("[data-qa='last_name']");
  }
  get address(): By {
    return By.css("[data-qa='address']");
  }
  get state(): By {
    return By.css("[data-qa='state']");
  }
  get city(): By {
    return By.css("[data-qa='city']");
  }
  get zipcode(): By {
    return By.css("[data-qa='zipcode']");
  }
  get mobile(): By {
    return By.css("[data-qa='mobile_number']");
  }
  get createAccount(): By {
    return By.css("[data-qa='create-account']");
  }
  get accountCreated(): By {
    return By.css("[data-qa='account-created'] b");
  }

  async completeRegistration(password = 'Test@1234'): Promise<void> {
    await this._dismissConsent();
    await this.typeText(this.passwordField, password);
    await this.typeText(this.firstName, 'Test');
    await this.typeText(this.lastName, 'User');
    await this.typeText(this.address, '123 Test Street');
    await this.typeText(this.state, 'TestState');
    await this.typeText(this.city, 'TestCity');
    await this.typeText(this.zipcode, '12345');
    await this.typeText(this.mobile, '1234567890');
    await this.click(this.createAccount);
    await this.wait.untilVisible(this.accountCreated);
  }

  async isRegistered(): Promise<boolean> {
    return this.isVisible(this.accountCreated);
  }
}
