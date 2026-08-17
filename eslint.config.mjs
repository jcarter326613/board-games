import eslintConfigPrettier from "eslint-config-prettier"
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin"
import typescriptEslintParser from "@typescript-eslint/parser"

export default [
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "packages/db/src/migrations/**",
        ],
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: typescriptEslintParser,
            parserOptions: {
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslintPlugin,
        },
        rules: {
            ...typescriptEslintPlugin.configs.recommended.rules,
            ...eslintConfigPrettier.rules,
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
        },
    },
]
