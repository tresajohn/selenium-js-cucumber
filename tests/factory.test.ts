import { createUserData, createContactData } from '../utils/testData.factory';

function test_user_data_unique_per_call() {
  const a = createUserData();
  const b = createUserData();
  if (a.email === b.email) throw new Error('emails not unique');
  if (!a.email.includes('@mailinator.com')) throw new Error('wrong email domain');
  console.log('PASS: unique user data');
}

function test_user_data_override() {
  const d = createUserData({ name: 'Override' });
  if (d.name !== 'Override') throw new Error('override not applied');
  console.log('PASS: override applied');
}

function test_contact_data_unique() {
  const a = createContactData();
  const b = createContactData();
  if (a.subject === b.subject) throw new Error('subjects not unique');
  console.log('PASS: unique contact data');
}

test_user_data_unique_per_call();
test_user_data_override();
test_contact_data_unique();
