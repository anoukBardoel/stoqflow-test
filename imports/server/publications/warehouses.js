import { Meteor } from 'meteor/meteor';

import { userHasCapabilities } from '/imports/lib/user';
import { warehousesCollection } from '/imports/collections/warehouses';

/**
 * Publishes all warehouses
 */
Meteor.publish('warehouses.all', async function warehousesAllPub() {
	const { userId } = this;
	if (!userId) return this.ready();

	if (!await userHasCapabilities({ userId, capabilities: ['c_warehouses_read'] })) return this.ready();

	return warehousesCollection.find({
		trash: { $exists: false }
	}, {
		fields: { name: 1, created: 1 },
		sort: { name: 1 }
	});
});
