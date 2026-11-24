import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  get email(): By {
    return By.css("[data-qa='login-email']");
  }
  get password(): By {
    return By.css("[data-qa='login-password']");
  }
  get submit(): By {
    return By.css("[data-qa='login-button']");
  }
  get errorMsg(): By {
    return By.xpath("//p[contains(text(),'Your email or password is incorrect')]");
  }
  get logoutLink(): By {
    return By.css("a[href='/logout']");
  }
  get signupName(): By {
    return By.css("[data-qa='signup-name']");
  }
  get signupEmail(): By {
    return By.css("[data-qa='signup-email']");
  }
  get signupSubmit(): By {
    return By.css("[data-qa='signup-button']");
  }
  get signupError(): By {
    return By.xpath("//p[contains(text(),'Email Address already exist')]");
  }

  async login(email: string, password: string): Promise<void> {
    await this.typeText(this.email, email);
    await this.typeText(this.password, password);
    await this.click(this.submit);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMsg);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.isVisible(this.logoutLink);
  }

  async fillSignup(name: string, email: string): Promise<void> {
    await this.typeText(this.signupName, name);
    await this.typeText(this.signupEmail, email);
    await this.click(this.signupSubmit);
  }

  async getSignupError(): Promise<string> {
    return this.getText(this.signupError);
  }
}
