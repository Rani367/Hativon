import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const sourceFiles = ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"];

export default defineConfig([
  ...nextVitals,
  {
    files: sourceFiles,
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Public pages use plain links and images on purpose: a full page load keeps
    // the browser's own back button, and the photo morph needs the same image
    // URL on both pages. See src/app/(public)/public.css.
    files: [
      "src/app/(public)/**",
      "src/app/not-found.tsx",
      "src/components/public/**",
      "src/components/studio/**",
    ],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
