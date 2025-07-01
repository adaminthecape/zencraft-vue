import js from "@eslint/js";
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended
});

const eslintConfig = [
	...compat.config({
		"globals": {
			"defineProps": "readonly",
			"defineEmits": "readonly",
			"defineExpose": "readonly",
			"defineSlots": "readonly",
			"defineModel": "readonly",
			"defineOptions": "readonly",
			"defineAsyncComponent": "readonly",
			"defineCustomElement": "readonly",
			"defineSSRCustomElement": "readonly",
			"withDefaults": "readonly"
		},
		"parser": 'vue-eslint-parser',
		"parserOptions": {
			"parser": '@typescript-eslint/parser',
			"ecmaVersion": 2020,
			"sourceType": 'module',
		},
		"extends": [
			"eslint:recommended",
			"plugin:vue/vue3-recommended",
			"plugin:vue/vue3-essential",
			"plugin:vue/vue3-strongly-recommended",
			"plugin:import/recommended",
			"plugin:@typescript-eslint/eslint-recommended",
			"plugin:@typescript-eslint/recommended"
		],
		"plugins": ["vue"],
		"overrides": [
			{
				"env": {
					"browser": true,
					"es2021": true
				},
				"settings": {
				},
				"files": [
					"src/**/*.{js,ts,jsx,tsx}",
				],
				"parserOptions": {
					"ecmaVersion": "latest",
					"sourceType": "module"
				}
			}
		],
		"rules": {
			"semi": [
				"error",
				"always"
			],
			"space-before-function-paren": [
				"error",
				{
					"anonymous": "always",
					"named": "never",
					"asyncArrow": "always"
				}
			],
			"no-console": [
				"off"
			],
			"arrow-body-style": [
				"off"
			],
			"arrow-parens": [
				"error",
				"always"
			],
			"brace-style": [
				"error",
				"allman"
			],
			"class-methods-use-this": [
				"off"
			],
			"global-require": [
				"off"
			],
			"import/named": ["off"],
			"import/prefer-default-export": [
				"off"
			],
			"import/extensions": [
				"off"
			],
			"import/no-unresolved": "off",
			"import/newline-after-import": [
				"error"
			],
			"import/no-dynamic-require": [
				"off"
			],
			"indent": [
				"error",
				"tab",
				{
					"SwitchCase": 1
				}
			],
			"keyword-spacing": [
				"error",
				{
					"after": false,
					"before": true,
					"overrides": {
						"case": {
							"after": true
						},
						"const": {
							"after": true
						},
						"export": {
							"after": true
						},
						"from": {
							"after": true,
							"before": true
						},
						"import": {
							"after": true
						},
						"let": {
							"after": true
						},
						"return": {
							"after": true
						},
						"default": {
							"after": true
						}
					}
				}
			],
			"linebreak-style": [
				"off"
			],
			"lines-around-comment": [
				"off"
			],
			"max-len": [
				"warn",
				300,
				4,
				{
					"ignoreComments": true,
					"ignorePattern": "^import\\s.+\\sfrom\\s.+;$",
					"ignoreUrls": true
				}
			],
			"no-inline-comments": [
				"off"
			],
			"no-param-reassign": [
				"off"
			],
			"no-shadow": [
				"off"
			],
			"no-tabs": [
				"off"
			],
			"no-underscore-dangle": [
				"off"
			],
			"object-curly-newline": [
				"error",
				{
					"consistent": true
				}
			],
			"one-var": [
				"error",
				{
					"const": "never",
					// "let": "off",
					"var": "always"
				}
			],
			"padding-line-between-statements": [
				"error",
				{
					"blankLine": "always",
					"next": "*",
					"prev": [
						"block",
						"block-like",
						"break",
						"case",
						"cjs-export",
						"cjs-import",
						"class",
						"const",
						"continue",
						"debugger",
						"default",
						"directive",
						"do",
						"empty",
						"export",
						"for",
						"function",
						"if",
						"import",
						"let",
						"multiline-block-like",
						"multiline-expression",
						"return",
						"switch",
						"throw",
						"try",
						"var",
						"while",
						"with"
					]
				},
				{
					"blankLine": "always",
					"next": "return",
					"prev": "expression"
				},
				{
					"blankLine": "any",
					"next": "const",
					"prev": "const"
				},
				{
					"blankLine": "never",
					"next": "*",
					"prev": "case"
				},
				{
					"blankLine": "never",
					"next": "import",
					"prev": "import"
				},
				{
					"blankLine": "never",
					"next": "let",
					"prev": "const"
				}
			],
			"prefer-destructuring": [
				"warn",
				{
					"AssignmentExpression": {
						"array": false,
						"object": false
					},
					"VariableDeclarator": {
						"array": true,
						"object": true
					}
				},
				{
					"enforceForRenamedProperties": false
				}
			],
			"import/no-cycle": [
				"off"
			],
			"unicorn/filename-case": [
				"off",
				{
					"case": "camelCase"
				}
			],
			"no-multiple-empty-lines": [
				"error",
				{
					"max": 1
				}
			],
			"implicit-arrow-linebreak": [
				"off"
			],
			"operator-linebreak": [
				"error",
				"after"
			],
			"no-else-return": [
				"error",
				{
					"allowElseIf": true
				}
			],
			"no-trailing-spaces": ["error", { "ignoreComments": false }],
			"@typescript-eslint/no-unused-vars": ["warn"],
			"@typescript-eslint/no-explicit-any": ["warn", { "fixToUnknown": false }],
			"@typescript-eslint/no-require-imports": ["warn"],
			"@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
			// "@typescript-eslint/no-use-before-define": [
			// 	"error",
			// 	{
			// 		"functions": false,
			// 		"classes": true,
			// 		"variables": true
			// 	}
			// ]
		}
	})
];

export default eslintConfig;