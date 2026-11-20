import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

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

/**
 * Publishes all stock documents of a set of products
 * @param {string[]} productIds - the ids of the products to publish stock for
 */
Meteor.publish('stock.by-products', async function stockByProductsPub(productIds) {
	const { userId } = this;
	if (!userId) return this.ready();

	check({ productIds }, { productIds: [Match.Where(x => RegEx.Id.test(x))] }, { errorMessage: 'invalid product identifiers' });

	if (!await userHasCapabilities({ userId, capabilities: ['c_stock_read', 'c_stock_adjust'] })) return this.ready();

	return stockCollection.find({
		product_id: { $in: productIds }
	}, {
		fields: { product_id: 1, location_id: 1, quantity: 1, modified: 1 }
	});
});
