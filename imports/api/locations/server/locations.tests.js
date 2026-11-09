import { assert } from 'chai';

import { locationsLookup } from '../methods';
import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';

describe('locations.lookup', () => {
	const userId = 'CARRENTASERXXXXXX';

	let warehouseId,
		otherWarehouseId;

	before(async () => {
		await Warehouses.data.removeAsync({});
		await Locations.data.removeAsync({});

		warehouseId = await Warehouses.data.insertAsync({ name: 'Test warehouse' });
		otherWarehouseId = await Warehouses.data.insertAsync({ name: 'Other warehouse' });

		await Locations.data.insertAsync({ warehouse_id: warehouseId, code: 'L-01' });
		await Locations.data.insertAsync({ warehouse_id: warehouseId, code: 'L-02', name: 'Dock' });
		await Locations.data.insertAsync({ warehouse_id: otherWarehouseId, code: 'L-03' });
	});

	it(
		'should throw when the user is not logged in',
		() => assert.isRejected(
			locationsLookup._execute({}, { query: 'L' }),
			/not-logged-in/
		)
	);

	it(
		'should throw when the user lacks the c_locations_read capability',
		() => assert.isRejected(
			locationsLookup._execute({ userId: 'NOACCESSUSERXXXXX' }, { query: 'L' }),
			/no-permission/
		)
	);

	it(
		'should return matches on the code',
		async () => {
			const matches = await locationsLookup._execute({ userId }, { query: 'L-0' });

			assert.lengthOf(matches, 3);
			assert.deepEqual(matches.map(m => m.code).sort(), ['L-01', 'L-02', 'L-03']);
		}
	);

	it(
		'should return matches on the name',
		async () => {
			const matches = await locationsLookup._execute({ userId }, { query: 'dock' });

			assert.lengthOf(matches, 1);
			assert.equal(matches[0].code, 'L-02');
		}
	);

	it(
		'should limit the matches to the given warehouse',
		async () => {
			const matches = await locationsLookup._execute({ userId }, { query: 'L', warehouseId });

			assert.lengthOf(matches, 2);
			assert.deepEqual(matches.map(m => m.code).sort(), ['L-01', 'L-02']);
		}
	);

	it(
		'should return the first 20 locations when no query was given',
		async () => {
			const matches = await locationsLookup._execute({ userId }, { query: '', warehouseId });

			assert.lengthOf(matches, 2);
		}
	);
});
