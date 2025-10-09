/** @type {import("eslint").Linter.Config} */
export const nestjs = {
    extends: [
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
      "prettier",
      "turbo",
    ],
    plugins: ["@typescript-eslint/eslint-plugin"],
    parser: "@typescript-eslint/parser",
    ignorePatterns: [
      ".*.js",
      "*.setup.js",
      "*.config.js",
      ".turbo/",
      "dist/",
      "coverage/",
      "node_modules/",
    ],
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
    env: {
      node: true,
      jest: true,
    },
  };