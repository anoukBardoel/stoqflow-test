import { Meteor } from 'meteor/meteor';

import { userHasCapabilities } from '/imports/lib/user';
import { productsCollection } from '/imports/collections/products';

/**
 * Publishes all products
 */
Meteor.publish('products.all', async function productsAllPub() {
	const { userId } = this;
	if (!userId) return this.ready();

	if (!await userHasCapabilities({ userId, capabilities: ['c_products_read'] })) return this.ready();

	return productsCollection.find({
		trash: { $exists: false }
	}, {
		fields: { code: 1, name: 1, unit: 1, total_stock: 1, created: 1 },
		sort: { code: 1 }
	});
});
