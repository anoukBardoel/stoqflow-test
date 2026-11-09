import { Meteor } from 'meteor/meteor';

import { productsCollection } from '/imports/collections/products';
import { warehousesCollection } from '/imports/collections/warehouses';
import { locationsCollection } from '/imports/collections/locations';
import { stockCollection } from '/imports/collections/stock';
import { stockHistoryCollection } from '/imports/collections/stock-history';

Meteor.startup(async function() {
	await productsCollection.rawCollection().createIndex({ code: 1 }, { unique: true });
	await warehousesCollection.rawCollection().createIndex({ name: 1 });
	await locationsCollection.rawCollection().createIndex({ warehouse_id: 1, code: 1 }, { unique: true });
	await stockCollection.rawCollection().createIndex({ product_id: 1, location_id: 1 }, { unique: true });
	await stockHistoryCollection.rawCollection().createIndex({ product_id: 1, created: -1 });
});
