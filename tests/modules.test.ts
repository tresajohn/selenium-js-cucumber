import { LoginModule } from '../modules/LoginModule';
import { CartModule } from '../modules/CartModule';

function test_login_module_exports() {
  const proto = LoginModule.prototype as unknown as Record<string, unknown>;
  if (typeof proto.login !== 'function') throw new Error('LoginModule.login missing');
  if (typeof proto.isLoggedIn !== 'function') throw new Error('LoginModule.isLoggedIn missing');
  console.log('PASS: LoginModule interface');
}

function test_cart_module_exports() {
  const proto = CartModule.prototype as unknown as Record<string, unknown>;
  if (typeof proto.addFirstProductToCart !== 'function')
    throw new Error('CartModule.addFirstProductToCart missing');
  if (typeof proto.viewCart !== 'function') throw new Error('CartModule.viewCart missing');
  console.log('PASS: CartModule interface');
}

test_login_module_exports();
test_cart_module_exports();
