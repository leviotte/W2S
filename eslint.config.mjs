import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Extra plugins voor stricter linten
const extraPlugins = [
  "jsx-a11y", // accessibility
  "@typescript-eslint", // strictere TS checks
  "import", // import sorting / consistency
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: extraPlugins,
    rules: {
      // Accessibility basics
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      
      // TypeScript stricter rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off", // optioneel
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Import consistency
      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
        }
      ],
      
      // Next.js / React best practices
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
    languageOptions: {
      globals: {
        ...require("globals").browser,
      },
    },
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  // Override default ignores van eslint-config-next
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
