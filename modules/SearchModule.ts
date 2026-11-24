import { TypedWorld } from '../support/world';

export class SearchModule {
  private world: TypedWorld;

  constructor(world: TypedWorld) {
    this.world = world;
  }

  async search(keyword: string): Promise<void> {
    await this.world.homePage!.searchProduct(keyword);
  }

  async getResultCount(): Promise<number> {
    const names = await this.world.homePage!.getProductNames();
    return names.length;
  }

  async getResultNames(): Promise<string[]> {
    return this.world.homePage!.getProductNames();
  }
}
