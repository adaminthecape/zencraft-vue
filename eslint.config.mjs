import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: [
			'node_modules',
			'dist',
			'test.ts',
			'tsup*',
			'eslint*',
			'.git*',
			'.eslint*'
		],
	},
	{
		files: ['src/**/*.ts'],
	},
	{
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		},
	},
    ...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
		}
	},
];