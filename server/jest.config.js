export default {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  testEnvironment: "node",
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: [
    "controllers/**/*.js",
    "daos/**/*.js",
    "utils/**/*.js",
    "!**/*.test.js",
    "!**/node_modules/**",
  ],
};
