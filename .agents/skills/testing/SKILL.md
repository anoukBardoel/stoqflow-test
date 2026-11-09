---
name: testing
description: Comprehensive testing guide for StokPad including Mocha/Chai patterns, global test users, method testing with ._execute, test file structure, and run commands. Load this when writing or modifying tests.
---

## Testing Patterns in StokPad

### Framework & Setup

**Stack:** Mocha + Chai assertions + chai-as-promised, running via `meteortesting:mocha`.

**Test file naming:** `*.tests.js`, colocated with the module they test in `imports/api/{entity}/server/{entity}.tests.js`.

**Run commands:**

```bash
# Run the whole suite once and exit (the command for agents/CI)
npm test

# Raw equivalent
TEST_CLIENT=0 meteor test --once --driver-package=meteortesting:mocha --exclude-archs=web.cordova,web.browser.legacy
```

**Agent test-runner gotchas:**
- `meteor test` without `--once` never exits: the mocha driver stays in watch mode. Always use `npm test`
- A cold start takes a while, allow a generous shell timeout (120s) and do not assume a hang too early

### Global Test Users

`globalSetup.tests.js` (repo root) wipes the users collection and recreates three fixed users before any suite runs:

| id | role | purpose |
|----|------|---------|
| `CARRENTASERXXXXXX` | admin, all capabilities | the acting user in happy-path tests |
| `TESTUSERXXXXXXXXX` | readonly | asserts capability rejections |
| `NOACCESSUSERXXXXX` | guest, no capabilities | asserts the empty-capabilities edge |

The ids are 17 characters of the Meteor id character set so they pass `RegEx.Id`. Suites may wipe domain collections (`Products.data.removeAsync({})` etc.) in a `before` hook but never the users collection.

### Method Testing with ._execute

Call the method object directly with a fake connection context, never through `Meteor.call`:

```javascript
import { stockAdjust } from '../methods';

// happy path, admin user from globalSetup
const result = await stockAdjust._execute({ userId: 'CARRENTASERXXXXXX' }, { productId, locationId, delta: 10 });

// rejections with chai-as-promised
assert.isRejected(
	stockAdjust._execute({ userId: 'TESTUSERXXXXXXXXX' }, { productId, locationId, delta: 5 }),
	/no-permission/
);
```

- The first argument is the connection context, only `userId` matters
- Match on the Meteor.Error code suffix with a regex (`/not-logged-in/`, `/no-permission/`, `/not-found/`)
- Cover at least: not logged in, no permission, missing referenced documents, domain rule violations, then the happy path including persistence effects

### Async Patterns

- All collection reads and writes on the server are async: use `insertAsync()`, `findOneAsync()`, `countAsync()`, `fetchAsync()` and await them
- Suite-level fixtures go in a `before(async () => { ... })` hook, never top-level code outside mocha hooks
