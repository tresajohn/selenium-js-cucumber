import { TypedWorld } from '../support/world';
import { IWorldOptions } from '@cucumber/cucumber';

function test_typed_world_has_config_and_driver_fields() {
  const opts = {
    attach: async () => {},
    log: async () => {},
    link: async () => {},
    parameters: {},
  } as unknown as IWorldOptions;
  const world = new TypedWorld(opts);
  if (!('config' in world)) throw new Error('TypedWorld missing config');
  console.log('PASS: TypedWorld has config field');
}
test_typed_world_has_config_and_driver_fields();
