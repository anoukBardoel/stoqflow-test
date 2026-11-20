import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { check, Match } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { withoutUndefined } from '/imports/lib/utilities';
import { version } from '../version';

import { productsCollection } from '/imports/collections/products';
import { locationsCollection } from '/imports/collections/locations';
import { stockAdjust } from '/imports/api/stock/methods';

/**
 * deliveries.process
 * processes a delivery without storing it: every line's quantity is added
 * to the stock at the line's location by reusing the stock.adjust method,
 * which keeps the stock history and the product totals consistent
 * @param {object} params - the parameters passed to the method
 * @param {Array<{productId: string, locationId: string, quantity: number}>} params.lines - the delivered products with their location and quantity
 * @returns {Promise<Array<{productId: string, locationId: string, quantity: number, quantityBefore: number, quantityAfter: number}>>} resolves in the processed lines with their stock before and after
 */
export const deliveriesProcess = new ValidatedMethod({
	name: `${version}.deliveries.process`,
	validate(params) {
		check(
			withoutUndefined(params),
			{
				lines: [
					{
						productId: Match.Where(x => RegEx.Id.test(x)),
						locationId: Match.Where(x => RegEx.Id.test(x)),
						quantity: Match.Where(x => Number.isInteger(x) && x > 0)
					}
				]
			},
			{ errorMessage: 'invalid delivery' }
		);
	},
	async run({ lines }) {
		const { userId } = this;

		if (!userId) throw new Meteor.Error(
			'deliveries.process.not-logged-in',
			'errors.not-logged-in'
		);

		if (
			!(await userHasCapabilities({
				userId,
				capabilities: ['c_deliveries_process']
			}))
		) throw new Meteor.Error(
			'deliveries.process.no-permission',
			'errors.no-permission'
		);

		//the same product may arrive at several locations but the same
		//product and location combination may only appear once
		const seen = new Set();

		for (const line of lines) {
			//We make a unique key for each product and location combination to check for duplicates
			const key = `${line.productId}:${line.locationId}`;

			if (seen.has(key)) throw new Meteor.Error(
				'deliveries.process.duplicate-line',
				'deliveries.duplicate-line'
			);

			seen.add(key);
		}

		//every line references an existing product and location
		await Promise.all(
			lines.map(async line => {
				const product = await productsCollection.findOneAsync({
					_id: line.productId,
					trash: { $exists: false }
				});
				if (!product) throw new Meteor.Error(
					'deliveries.process.product-not-found',
					'errors.not-found'
				);

				const location = await locationsCollection.findOneAsync({
					_id: line.locationId,
					trash: { $exists: false }
				});
				if (!location) throw new Meteor.Error(
					'deliveries.process.location-not-found',
					'errors.not-found'
				);
			})
		);

		//apply every line through the stock.adjust method so the stock
		//documents, the history and the product totals stay consistent
		//the lines are unique per product and location so the calls share no documents
		const applied = await Promise.all(
			lines.map(line => stockAdjust._execute(
				{ userId },
				{
					productId: line.productId,
					locationId: line.locationId,
					delta: line.quantity
				}
			))
		);

		return applied;
	}
});
