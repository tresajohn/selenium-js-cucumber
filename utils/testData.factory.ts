import { randomUUID } from 'crypto';

export interface UserData {
  name: string;
  email: string;
  password: string;
}

export interface ContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function uuid8(): string {
  return randomUUID().slice(0, 8);
}

export function createUserData(overrides?: Partial<UserData>): UserData {
  const id = uuid8();
  const defaults: UserData = {
    name: `QA Test-${id}`,
    email: `qaauto-${id}@mailinator.com`,
    password: 'Test@1234',
  };
  return { ...defaults, ...overrides };
}

export function createContactData(overrides?: Partial<ContactData>): ContactData {
  const id = uuid8();
  const defaults: ContactData = {
    name: `QA Test-${id}`,
    email: `qaauto-${id}@mailinator.com`,
    subject: `Automated Test ${id}`,
    message: `Portfolio test run — ${id}`,
  };
  return { ...defaults, ...overrides };
}
