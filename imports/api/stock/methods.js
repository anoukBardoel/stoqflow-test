import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { check, Match } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { withoutUndefined } from '/imports/lib/utilities';
import { version } from '../version';

import { productsCollection } from '/imports/collections/products';
import { locationsCollection } from '/imports/collections/locations';
import { stockCollection } from '/imports/collections/stock';
import { stockHistoryCollection } from '/imports/collections/stock-history';

/**
 * Adjusts stock of a product at a location
 * @param {object} params - the parameters passed to the method
 * @param {string} params.productId - the id of the product to adjust
 * @param {string} params.locationId - the id of the location to adjust at
 * @param {number} params.delta - the signed quantity to adjust with
 * @param {string} [params.reason] - an optional reason for the adjustment
 * @returns {Promise<object>} resolves in the before and after quantities
 */
export const stockAdjust = new ValidatedMethod({
	name: `${version}.stock.adjust`,
	validate(params) {
		check(withoutUndefined(params), { productId: Match.Where(x => RegEx.Id.test(x)), locationId: Match.Where(x => RegEx.Id.test(x)), delta: Number, reason: Match.Maybe(String) }, { errorMessage: 'invalid adjustment' });
	},
	async run({ productId, locationId, delta, reason }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('stock.adjust.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_stock_adjust'] })) throw new Meteor.Error('stock.adjust.no-permission', 'errors.no-permission');

		const product = await productsCollection.findOneAsync({ _id: productId, trash: { $exists: false } });
		if (!product) throw new Meteor.Error('stock.adjust.product-not-found', 'errors.not-found');

		const location = await locationsCollection.findOneAsync({ _id: locationId, trash: { $exists: false } });
		if (!location) throw new Meteor.Error('stock.adjust.location-not-found', 'errors.not-found');

		const stock = await stockCollection.findOneAsync({ product_id: productId, location_id: locationId }),
			quantityBefore = stock ? stock.quantity : 0,
			quantityAfter = quantityBefore + delta;

		if (delta === 0) throw new Meteor.Error('stock.adjust.zero-delta', 'errors.zero-delta');
		if (quantityAfter < 0) throw new Meteor.Error('stock.adjust.negative-stock', 'errors.negative-stock');

		//upsert the stock doc for this product and location
		if (stock) {
			await stockCollection.updateAsync(stock._id, { $set: { quantity: quantityAfter, modified: new Date() } });
		} else {
			await stockCollection.insertAsync({
				product_id: productId,
				location_id: locationId,
				quantity: quantityAfter,
				user_id: userId
			});
		}

		await stockHistoryCollection.insertAsync({
			product_id: productId,
			location_id: locationId,
			delta,
			quantity_before: quantityBefore,
			quantity_after: quantityAfter,
			reason,
			user_id: userId
		});

		await productsCollection.updateAsync(productId, { $inc: { total_stock: delta } });

		return { productId, locationId, quantityBefore, quantityAfter };
	}
});
