---
name: methods
description: How to create and use ValidatedMethod definitions in StokPad including the check-validate pattern, capability guards, error handling, and method naming conventions. Load this when creating or modifying Meteor methods.
---

## ValidatedMethod Pattern in StokPad

StokPad uses `meteor/mdg:validated-method` for all server methods. Methods live in `imports/api/{entity}/methods.js` and are versioned through `imports/api/version.js`.

### Basic Structure

```javascript
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { check, Match } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { withoutUndefined } from '/imports/lib/utilities';
import { version } from '../version';

export const myMethod = new ValidatedMethod({
	name: `${version}.entity.action`,
	validate(params) {
		check(withoutUndefined(params), { param1: String, param2: Match.Maybe(String) }, { errorMessage: 'invalid entity' });
	},
	async run({ param1, param2 }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('entity.action.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_entity_action'] })) throw new Meteor.Error('entity.action.no-permission', 'errors.no-permission');

		// Business logic...
	}
});
```

### Method Naming Convention

Method names follow the pattern `{version}.{entity}.{action}`, with the version interpolated from `imports/api/version.js`:

```javascript
name: `${version}.products.lookup`   // -> v1.products.lookup
```

Exports are camelCase of the action: `productsLookup`, `stockAdjust`.

### Method Registration

Method files must be imported by the barrel at `imports/api/methods.js` — that is what registers
them on the server. Views import the methods they call directly for the client-side stub,
but without the barrel entry the method throws `Method not found` at runtime.

### Validation Rules

- Always pass the params through `withoutUndefined` first, so optional `Match.Maybe` fields pass `check()`
- Use `Match.Where(x => RegEx.Id.test(x))` for id parameters
- Give every `check()` a third argument with a short `{ errorMessage: '...' }` message
- `check()` failures throw before `run()` is entered, no manual validation inside `run()`

### Authentication and Capability Guard

Every method starts with the same two guards, in this order:

```javascript
const { userId } = this;
if (!userId) throw new Meteor.Error('entity.action.not-logged-in', 'errors.not-logged-in');

if (!await userHasCapabilities({ userId, capabilities: ['c_entity_action'] })) throw new Meteor.Error('entity.action.no-permission', 'errors.no-permission');
```

- The error code is always `{entity}.{action}.not-logged-in` / `{entity}.{action}.no-permission`
- The second Meteor.Error argument is always an i18n key from `imports/i18n/en.i18n.json`, shared keys live under `errors.*` (`errors.not-logged-in`, `errors.no-permission`, `errors.not-found`)

### Error Style

```javascript
// Meteor.Error(code, i18nKey) — the code is entity.action.reason, the reason
// suffix doubles as the test-matching pattern
throw new Meteor.Error('products.create.code-taken', 'errors.code-taken');
throw new Meteor.Error('stock.adjust.negative-stock', 'errors.negative-stock');
```

When a document is missing use the shared `errors.not-found` key with an entity-specific code, for example `products.update.not-found`.

### Client Calls

```javascript
// From a template event, always the async variant
const matches = await Meteor.callAsync('v1.products.lookup', { query: value });
```

### Testing Methods

Use `._execute` with a fake connection carrying the test user id, never `Meteor.call` (see the `testing` skill):

```javascript
const result = await productsCreate._execute({ userId: 'CARRENTASERXXXXXX' }, { code: 'SKU-001', name: 'Test product' });
```
