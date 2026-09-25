/** Unit tests: pure services and helpers (no database). */
module.exports = {
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }] },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
};
