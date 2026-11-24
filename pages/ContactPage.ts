import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class ContactPage extends BasePage {
  get name(): By {
    return By.css("[data-qa='name']");
  }
  get email(): By {
    return By.css("[data-qa='email']");
  }
  get subject(): By {
    return By.css("[data-qa='subject']");
  }
  get message(): By {
    return By.css("[data-qa='message']");
  }
  get submitBtn(): By {
    return By.css("[data-qa='submit-button']");
  }
  get successMsg(): By {
    return By.css('.contact-form .alert-success');
  }

  async fillContactForm(
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    await this.typeText(this.name, name);
    await this.typeText(this.email, email);
    await this.typeText(this.subject, subject);
    await this.typeText(this.message, message);
  }

  async submitForm(): Promise<void> {
    await this.click(this.submitBtn);
    try {
      await this.driver.switchTo().alert().accept();
    } catch {
      // no alert
    }
  }

  async getSuccessMessage(): Promise<string> {
    return this.getText(this.successMsg);
  }
}
