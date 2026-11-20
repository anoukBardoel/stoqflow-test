import { assert } from 'chai';
import { Meteor } from 'meteor/meteor';

//the publications register on import, the app entry does not run in test mode
import './locations';
import './stock';

import { Products } from '/imports/collections/products';
import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';
import { Stock } from '/imports/collections/stock';

describe('publications', () => {
	const adminUserId = 'CARRENTASERXXXXXX';

	let productId,
		locationId;

	before(async () => {
		await Stock.data.removeAsync({});
		await Products.data.removeAsync({});
		await Warehouses.data.removeAsync({});
		await Locations.data.removeAsync({});

		productId = await Products.data.insertAsync({ code: 'SKU-001', name: 'Test product' });

		const warehouseId = await Warehouses.data.insertAsync({ name: 'Test warehouse' });

		locationId = await Locations.data.insertAsync({ warehouse_id: warehouseId, code: 'L-01' });

		await Stock.data.insertAsync({ product_id: productId, location_id: locationId, quantity: 7 });
	});

	/**
	 * invokes a publish handler with a fake subscription context
	 * @param {string} name - the name of the publication
	 * @param {object} userId - the user id to publish for
	 * @param {object[]} args - the publication arguments
	 * @returns {Promise<object[]>} the published documents
	 */
	async function fetchPublished(name, userId, args = []) {
		const handler = Meteor.server.publish_handlers[name];
		assert.isOk(handler, `publication ${name} is not registered`);

		const result = await handler.call({ userId, added() {}, changed() {}, removed() {}, ready() {} }, ...args),
			cursors = Array.isArray(result) ? result : [result],
			pages = await Promise.all(cursors.map(cursor => cursor.fetchAsync()));

		return pages.flat();
	}

	it('should publish the location of every warehouse for locations.all', async () => {
		const docs = await fetchPublished('locations.all', adminUserId),
			published = docs.find(doc => doc._id === locationId);

		assert.isOk(published, 'location not published');
		assert.equal(published.code, 'L-01');
		assert.isOk(published.warehouse_id, 'warehouse_id missing on the published location');
	});

	it('should publish the stock of the given products for stock.by-products', async () => {
		const docs = await fetchPublished('stock.by-products', adminUserId, [[productId]]),
			published = docs.find(doc => doc.product_id === productId);

		assert.isOk(published, 'stock not published');
		assert.equal(published.location_id, locationId);
		assert.equal(published.quantity, 7);
	});
});
