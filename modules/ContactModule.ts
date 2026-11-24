import { TypedWorld } from '../support/world';
import { ContactPage } from '../pages/ContactPage';
import { ContactData } from '../utils/testData.factory';

export class ContactModule {
  private world: TypedWorld;

  constructor(world: TypedWorld) {
    this.world = world;
  }

  async navigateToContact(): Promise<void> {
    this.world.contactPage = new ContactPage(this.world.driver, this.world.config.timeout);
    await this.world.contactPage.navigate(`${this.world.config.baseUrl}/contact_us`);
  }

  async fill(data: ContactData): Promise<void> {
    await this.world.contactPage!.fillContactForm(
      data.name,
      data.email,
      data.subject,
      data.message
    );
  }

  async submit(): Promise<void> {
    await this.world.contactPage!.submitForm();
  }

  async fillAndSubmit(data: ContactData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }

  async getSuccessMessage(): Promise<string> {
    return this.world.contactPage!.getSuccessMessage();
  }
}
