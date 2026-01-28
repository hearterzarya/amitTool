import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Extension folders with third-party minified code
    "admin-extension/**",
    "extention/**",
    "**/*.min.js",
    // Script files (often use require() and any types)
    "scripts/**",
    "prisma/seed*.ts",
    "prisma/seed*.cjs",
  ]),
  // Allow any types in API routes (Next.js API routes often need any for request/response)
  {
    files: ["src/app/api/**/*.ts", "src/app/api/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
