import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["public/build", "vendor", "var"] },
    {
        files: ["assets/**/*.{ts,tsx}", "tests/Browser/**/*.ts"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
        languageOptions: {
            globals: globals.browser,
        },
    },
    // Les composants générés par shadcn/ui exportent aussi leurs variantes, ce que React Refresh signale à tort.
    {
        files: ["assets/components/ui/**/*.tsx"],
        rules: {
            "react-refresh/only-export-components": "off",
        },
    },
);
