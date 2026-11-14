import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const testGlobals = {
  vi: "readonly",
  describe: "readonly",
  it: "readonly",
  test: "readonly",
  expect: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  afterAll: "readonly",
};

const reactRules = {
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  "react-refresh/only-export-components": [
    "warn",
    { allowConstantExport: true },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "coverage",
      "node_modules",
      "playwright-report",
      "test-results",
    ],
  },
  js.configs.recommended,
  {
    // Plain JS files in the repo, such as eslint.config.js.
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactRules,
      // Ignore capitalised imports (React, components) that JSX uses implicitly.
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactRules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The locale provider and its useLocale hook live together on purpose.
    files: ["src/i18n/LocaleContext.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["scripts/**/*.ts", "vite.config.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "src/test/**/*.{ts,tsx}",
      "e2e/**/*.{ts,tsx}",
    ],
    languageOptions: {
      globals: testGlobals,
    },
  }
);
