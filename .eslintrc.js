module.exports = {
	root: true,
	env: {
		browser: true,
		es2022: true,
		meteor: true,
		mocha: true,
		mongo: true
	},
	plugins: [
		'import',
		'meteor',
		'promise',
		'jsdoc'
	],
	extends: [
		'airbnb-base',
		'plugin:meteor/recommended',
		'plugin:import/errors',
		'plugin:import/warnings'
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		requireConfigFile: false,
		allowImportExportEverywhere: true
	},
	settings: {
		'import/resolver': 'meteor'
	},
	globals: {
		ValidationError: 'readonly'
	},
	rules: {
		'max-len': 0,
		camelcase: 0,
		'no-restricted-syntax': 0,
		eqeqeq: 'off',
		curly: 0,
		quotes: ['warn', 'single'],
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'no-tabs': 0,
		indent: ['error', 'tab'],
		'newline-per-chained-call': 0,
		semi: ['warn', 'always'],
		'arrow-parens': ['warn', 'as-needed'],
		'comma-dangle': ['warn', 'never'],
		'spaced-comment': 0,
		'no-underscore-dangle': 'off',
		'dot-notation': 0,
		'vars-on-top': 0,
		'one-var': [1, 'consecutive'],
		'prefer-template': 0,
		'no-plusplus': 0,
		'prefer-promise-reject-errors': 0,
		'prefer-arrow-callback': [1, { allowNamedFunctions: true, allowUnboundThis: true }],
		'object-curly-spacing': [1, 'always'],
		'object-curly-newline': [
			'error',
			{
				ObjectExpression: {
					consistent: true
				},
				ObjectPattern: {
					consistent: true
				},
				ImportDeclaration: 'never',
				ExportDeclaration: 'never'
			}
		],
		'object-shorthand': ['error', 'always', { avoidQuotes: false }],
		'prefer-destructuring': [1, { array: false, object: true }, { enforceForRenamedProperties: false }],
		'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
		'no-continue': 0,
		'func-name-matching': 0,
		'func-names': [1, 'as-needed'],
		'no-throw-literal': 0,
		'no-param-reassign': 0,
		'consistent-return': 0,
		'no-shadow': 0,
		'no-return-assign': 0,
		'no-constructor-return': 0,
		'promise/no-nesting': 'warn',
		'promise/catch-or-return': ['warn', { allowFinally: true }],
		'import/no-extraneous-dependencies': 'off',
		'import/prefer-default-export': 'off',
		'import/no-absolute-path': 'off',
		'import/no-cycle': 'off',
		'import/no-unresolved': ['error', { ignore: ['chai'] }],
		'meteor/no-session': 0,
		'meteor/audit-argument-checks': 0,
		'no-alert': 0,
		'meteor/eventmap-params': ['error', { eventParamName: 'e', templateInstanceParamName: 't' }],
		'meteor/template-names': [2, 'snake-case'],
		'jsdoc/check-alignment': 1,
		'jsdoc/check-param-names': 1,
		'jsdoc/check-tag-names': 1,
		'jsdoc/check-types': 1,
		'jsdoc/no-undefined-types': 1,
		'jsdoc/require-description': 1,
		'jsdoc/require-jsdoc': 1,
		'jsdoc/require-hyphen-before-param-description': 1,
		'jsdoc/require-param': 1,
		'jsdoc/require-param-description': 1,
		'jsdoc/require-param-name': 1,
		'jsdoc/require-param-type': 1,
		'jsdoc/require-returns': 1,
		'jsdoc/require-returns-check': 1,
		'jsdoc/require-returns-description': 1,
		'jsdoc/require-returns-type': 1,
		'jsdoc/valid-types': 1
	}
};
