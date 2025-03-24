/// <reference types="jest" />

declare global {
  // Add missing Jest global functions
  const describe: jest.Describe;
  const test: jest.It;
  const it: jest.It;
  const expect: jest.Expect;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const jest: typeof import('jest');
}

export {}; 