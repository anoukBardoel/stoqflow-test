# stokpad

Lightweight warehouse management system built with Meteor 3 — products, warehouses with locations, and stock with adjustments.

## Requirements

- Meteor 3.x (`curl https://install.meteor.com/ | sh`)
- Node.js (the version Meteor 3 bundles or recommends)

## Setup

```bash
meteor npm install
meteor run
```

Then open http://localhost:3000.

## Demo data (seed)

To fill an empty database with demo users, warehouses, locations, products and stock:

```bash
npm run seed
```

This runs the app with the `SEED=true` environment variable set. Wait for the `seed complete` log line in the terminal, then stop the server with Ctrl+C and start it normally with `meteor run`.

The seed is idempotent: it only runs into a database without users.

### Test user credentials

All demo users share the password `demo1234`:

| User | E-mail | Role |
|------|--------|------|
| admin | admin@stokpad.test | admin |
| manager | manager@stokpad.test | manager |
| operator | operator@stokpad.test | operator |

Without a seed, the app auto-creates a fallback admin on first start: username `admin`, e-mail `admin@stokpad.local`, password `stokpad`.

### Reset the database

Stop the app, then:

```bash
meteor reset
```

Afterwards run `npm run seed` again to reseed.

## Lint

```bash
npm run lint
```

## Tests

```bash
npm test
```
