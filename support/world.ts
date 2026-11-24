import { World, IWorldOptions } from '@cucumber/cucumber';
import { WebDriver } from 'selenium-webdriver';
import { Config, getConfig } from '../config/config';

export class TypedWorld extends World {
  config: Config;
  driver!: WebDriver;
  timeoutMs: number;

  // per-scenario page refs (set by modules/hooks)
  loginPage?: import('../pages/LoginPage').LoginPage;
  homePage?: import('../pages/HomePage').HomePage;
  cartPage?: import('../pages/CartPage').CartPage;
  checkoutPage?: import('../pages/CheckoutPage').CheckoutPage;
  contactPage?: import('../pages/ContactPage').ContactPage;
  regPage?: import('../pages/RegistrationPage').RegistrationPage;

  constructor(options: IWorldOptions) {
    super(options);
    this.config = getConfig();
    this.timeoutMs = this.config.timeout * 1000;
  }
}
