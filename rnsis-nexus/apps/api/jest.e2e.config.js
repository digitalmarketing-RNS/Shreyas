/** End-to-end tests: boot the full Nest app against a real Postgres database. */
module.exports = {
  rootDir: '.',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: true }] },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 120000,
};
