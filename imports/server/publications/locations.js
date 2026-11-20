import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { locationsCollection } from '/imports/collections/locations';

/**
 * Publishes all locations of one warehouse
 * @param {string} warehouseId - the id of the warehouse to publish locations for
 */
Meteor.publish('locations.by-warehouse', async function locationsByWarehousePub(warehouseId) {
	const { userId } = this;
	if (!userId) return this.ready();

	check({ warehouseId }, { warehouseId: Match.Where(x => RegEx.Id.test(x)) }, { errorMessage: 'invalid warehouse identifier' });

	if (!await userHasCapabilities({ userId, capabilities: ['c_locations_read'] })) return this.ready();

	return locationsCollection.find({
		warehouse_id: warehouseId,
		trash: { $exists: false }
	}, {
		fields: { warehouse_id: 1, code: 1, name: 1, created: 1 },
		sort: { code: 1 }
	});
});

/**
 * Publishes all locations of every warehouse
 */
Meteor.publish('locations.all', async function locationsAllPub() {
	const { userId } = this;
	if (!userId) return this.ready();

	if (!await userHasCapabilities({ userId, capabilities: ['c_locations_read'] })) return this.ready();

	return locationsCollection.find({
		trash: { $exists: false }
	}, {
		fields: { warehouse_id: 1, code: 1, name: 1, created: 1 },
		sort: { code: 1 }
	});
});
