import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Decorative layer behind real content is an intentional pattern here —
      // it must never capture pointer events or hide the content it sits under.
      "@next/next/no-img-element": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "image/**",
    "scripts/**",
    "**/*.md",
  ]),
]);