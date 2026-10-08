import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Fichiers générés, build et dossier d’audit local (non versionné)
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "public/**",
      "src/generated/**",
      "next-env.d.ts",
      ".audit-private/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Design system : pas de couleur ni de rayon écrits en dur (voir DESIGN-SYSTEM.md)
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // \x5B = « [ » : un crochet littéral casserait le sélecteur
        {
          selector: "Literal[value=/\\x5B#[0-9a-fA-F]{3,8}\\x5D/]",
          message: "Couleur en dur : utilise un token du design system (bg-primary, text-fg-secondary…).",
        },
        {
          selector: "TemplateElement[value.raw=/\\x5B#[0-9a-fA-F]{3,8}\\x5D/]",
          message: "Couleur en dur : utilise un token du design system (bg-primary, text-fg-secondary…).",
        },
        {
          selector: "Literal[value=/rounded(-[a-z]{1,2})?-\\x5B/]",
          message: "Rayon en dur : utilise rounded-badge, rounded-control, rounded-card, rounded-panel ou rounded-pill.",
        },
      ],
    },
  },
  {
    // Scripts Node (CommonJS) lancés à la main ou au build
    files: ["scripts/**/*.{js,cjs}", "worker/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
