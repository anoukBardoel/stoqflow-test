# AGENTS.md - StokPad Codebase Guide

You are an expert level coding engineer with deep knowledge of the StokPad (lightweight Warehouse Management System) codebase. You are familiar with Meteor.js 3.x, Blaze templates, and the architecture of StokPad. You understand the workflow for code changes in this codebase: plan, build, review, test.

## Skills Reference

Detailed domain knowledge is available as on-demand skills. Load the relevant skill when working in a specific area:

- **`methods`** — How to create and use ValidatedMethod definitions (naming conventions, check-validate pattern, capability guards, error handling)
- **`testing`** — Comprehensive testing guide (Mocha/Chai patterns, global test users, method testing with `._execute`, run commands)

## Build & Run Commands

```bash
# Start development server
meteor npm start

# Start with demo data seeded (first run)
npm run seed

# Run linting
npm run lint
```

### Code Validation

```bash
# Always run after code generation
npm run lint
```

**Requirement:** All generated code must pass ESLint validation before completion.

## Testing

**Framework:** Mocha with Chai assertions and chai-as-promised, running via `meteortesting:mocha`.

```bash
# Run the whole suite once and exit
npm test
```

Test files are colocated with the module they test under `imports/api/{entity}/server/{entity}.tests.js`, shared users come from `globalSetup.tests.js`. See the `testing` skill for the full conventions.

## Code Conventions

- Indentation with **tabs**, never spaces
- **Single quotes** for all strings
- **No trailing commas** in objects and arrays
- JSDoc on every function, with a **hyphen before the description** of each `@param` and `@returns`
- Comments are lowercase without a space after `//`
- One `const` statement with consecutive declarations instead of many separate ones
- All user-facing strings go through `universe:i18n`, no hardcoded UI text (english and german files under `imports/i18n/`)
- Reusable, generic utilities belong in `imports/lib` — prefer extracting shared helpers there over adding to existing `imports/app` module files; keep modifications to existing app modules minimal unless a task explicitly calls for touching them
- Server-side MongoDB operations are always async: `insertAsync()`, `findOneAsync()`, `updateAsync()`, `countAsync()`, `fetchAsync()`

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Blaze templates | snake_case | `products_index` |
| Variables/functions | camelCase | `productId`, `buildProductCode` |
| Collections | PascalCase | `Products`, `Warehouses` |
| Method names | `version.entity.action` | `v1.products.create` |
| Capabilities | `c_{entity}_{action}` | `c_products_create` |
| Meteor.Error codes | `entity.action.reason` | `products.create.code-taken` |
| Event params | `e` for event, `t` for template instance | |

## Directory Structure

```
imports/
├── api/              # Versioned ValidatedMethod definitions
│   └── v1/
│       ├── version.js          # Current api version string
│       └── {entity}/
│           ├── methods.js      # ValidatedMethod definitions
│           └── server/
│               └── {entity}.tests.js
├── app/              # App-level modules (roles, capabilities)
├── collections/      # MongoDB collection definitions with SimpleSchema
├── i18n/             # Translation files (en.i18n.json, de.i18n.json)
├── lib/              # Shared utilities
├── server/           # Server-only code (publications, seed)
├── startup/          # Startup scripts (both/, client/, server/)
└── ui/               # Blaze templates and styles
```

## Key Patterns

### ValidatedMethod (Quick Reference)

```javascript
export const myMethod = new ValidatedMethod({
	name: `${version}.entity.action`,
	validate(params) {
		check(withoutUndefined(params), { param1: String });
	},
	async run({ param1 }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('entity.action.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_entity_action'] })) throw new Meteor.Error('entity.action.no-permission', 'errors.no-permission');

		// Implementation...
	}
});
```

Load the `methods` skill for the full pattern.

### Error Handling

```javascript
// Throw Meteor.Error for client-facing errors, second argument is an i18n key
throw new Meteor.Error('products.create.code-taken', 'errors.code-taken');
```

### i18n

```javascript
import i18n from '/imports/lib/i18n';

i18n.__('products.singular');                 // In javascript
{{ i18n 'products.singular' }}                // In blaze templates
```

### Collection Access

```javascript
// Collections expose .data for the actual Mongo.Collection and .schema for the SimpleSchema
Products.data.findOneAsync({ _id: productId });
Products.schema;
```

## Commit Conventions

- Prefix every commit message with an `STK-###` ticket number, followed by a terse description: `STK-102 products create update delete and lookup methods`
- Keep commits small and logical, one concern per commit
- Never commit broken or half-working states

## Dependencies

- **Validation:** simpl-schema, meteor/check
- **Testing:** chai, chai-as-promised, @faker-js/faker
- **UI:** Blaze templates, LESS stylesheets
