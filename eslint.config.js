import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended, 
    {
        // Only json files
        files: ["**/*.{js}"],
        
        // Define the environment
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },

        //Default rules
        rules: {
            "no-unused-vars": "warn",   // Warns if you leave variables unused
            "no-console": "off",        // Allows console.log
            "semi": ["error", "always"], // Forces semicolons
            "browser" : true
        }
    },
    {
        //Files to ignore
        ignores: ["eslint-results.sarif"]
    }
];