/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 60000,
    clearMocks: true,
    restoreMocks: true,
    // Transform JS files through babel-jest so Jest (CJS mode) can parse
    // frontend ESM files (import/export) without changing production code.
    transform: {
        '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }]
    },
    moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/shared/$1'
    }
};
