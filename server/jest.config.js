export const transform = {
  "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
};
export const moduleFileExtensions = ["js", "jsx", "ts", "tsx", "json", "node"];
export const testMatch = ["**/tests/unit/**/*.test.js"];
export const testEnvironment = "node";
