import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { locationsCollection } from '/imports/collections/locations';
import { stockCollection } from '/imports/collections/stock';

/**
 * Publishes all stock documents for the locations of one warehouse
 * @param {string} warehouseId - the id of the warehouse to publish stock for
 */
Meteor.publish('stock.by-warehouse', async function stockByWarehousePub(warehouseId) {
	const { userId } = this;
	if (!userId) return this.ready();

	check({ warehouseId }, { warehouseId: Match.Where(x => RegEx.Id.test(x)) }, { errorMessage: 'invalid warehouse identifier' });

	if (!await userHasCapabilities({ userId, capabilities: ['c_stock_read', 'c_stock_adjust'] })) return this.ready();

	const locations = await locationsCollection.find({
		warehouse_id: warehouseId,
		trash: { $exists: false }
	}, {
		fields: { _id: 1 }
	}).fetchAsync();

	return stockCollection.find({
		location_id: { $in: locations.map(l => l._id) }
	}, {
		fields: { product_id: 1, location_id: 1, quantity: 1, modified: 1 }
	});
});
