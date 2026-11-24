import { TypedWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';

export class LoginModule {
  private world: TypedWorld;

  constructor(world: TypedWorld) {
    this.world = world;
  }

  async navigateToLogin(): Promise<void> {
    this.world.loginPage = new LoginPage(this.world.driver, this.world.config.timeout);
    await this.world.loginPage.navigate(`${this.world.config.baseUrl}/login`);
  }

  async login(email: string, password: string): Promise<void> {
    await this.world.loginPage!.login(email, password);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.world.loginPage!.isLoggedIn();
  }

  async getErrorMessage(): Promise<string> {
    return this.world.loginPage!.getErrorMessage();
  }

  async clickLoginSubmit(): Promise<void> {
    await this.world.loginPage!.click(this.world.loginPage!.submit);
  }

  async fillSignup(name: string, email: string): Promise<void> {
    await this.world.loginPage!.fillSignup(name, email);
  }

  async completeRegistration(password: string): Promise<void> {
    this.world.regPage = new RegistrationPage(this.world.driver);
    await this.world.regPage.completeRegistration(password);
  }

  async isRegistered(): Promise<boolean> {
    return this.world.regPage!.isRegistered();
  }

  async getSignupError(): Promise<string> {
    return this.world.loginPage!.getSignupError();
  }

  async logout(): Promise<void> {
    const url = await this.world.driver.getCurrentUrl();
    if (!url.includes('/login')) {
      await this.world.driver.get(`${this.world.config.baseUrl}/logout`);
    }
  }
}
