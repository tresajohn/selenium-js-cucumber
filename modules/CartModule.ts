import { TypedWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';

export class CartModule {
  private world: TypedWorld;

  constructor(world: TypedWorld) {
    this.world = world;
  }

  async goHome(): Promise<void> {
    this.world.homePage = new HomePage(this.world.driver, this.world.timeoutMs);
    await this.world.homePage.navigateHome(this.world.config.baseUrl);
  }

  async addFirstProductToCart(): Promise<void> {
    await this.world.homePage!.addFirstProductToCart();
  }

  async viewCart(): Promise<void> {
    this.world.cartPage = new CartPage(this.world.driver, this.world.timeoutMs);
    await this.world.cartPage.navigate(`${this.world.config.baseUrl}/view_cart`);
  }

  async getItemCount(): Promise<number> {
    const items = await this.world.cartPage!.getCartItems();
    return items.length;
  }

  async getCartItemNames(): Promise<string[]> {
    return this.world.cartPage!.getCartItemNames();
  }
}
