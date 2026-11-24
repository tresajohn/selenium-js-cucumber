import { TypedWorld } from '../support/world';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

export class CheckoutModule {
  private world: TypedWorld;

  constructor(world: TypedWorld) {
    this.world = world;
  }

  async proceedToCheckout(): Promise<void> {
    this.world.cartPage = new CartPage(this.world.driver, this.world.timeoutMs);
    await this.world.cartPage.navigate(`${this.world.config.baseUrl}/view_cart`);
    await this.world.cartPage.proceedToCheckout();
  }

  async confirmOrder(): Promise<void> {
    this.world.checkoutPage = new CheckoutPage(this.world.driver, this.world.timeoutMs);
    await this.world.checkoutPage.confirmOrder();
  }

  async isOrderPlaced(): Promise<boolean> {
    return this.world.checkoutPage!.isOrderPlaced();
  }

  async getConfirmationMessage(): Promise<string> {
    return this.world.checkoutPage!.getSuccessMessage();
  }
}
