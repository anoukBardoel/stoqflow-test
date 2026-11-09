import { assert } from 'chai';

import { stockAdjust } from '../methods';
import { Products } from '/imports/collections/products';
import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';
import { Stock } from '/imports/collections/stock';
import { StockHistory } from '/imports/collections/stock-history';

describe('stock', () => {
	const adminUserId = 'CARRENTASERXXXXXX',
		readonlyUserId = 'TESTUSERXXXXXXXXX';

	let productId,
		locationId;

	before(async () => {
		await Stock.data.removeAsync({});
		await StockHistory.data.removeAsync({});
		await Products.data.removeAsync({});
		await Warehouses.data.removeAsync({});
		await Locations.data.removeAsync({});

		productId = await Products.data.insertAsync({ code: 'SKU-001', name: 'Test product' });

		const warehouseId = await Warehouses.data.insertAsync({ name: 'Test warehouse' });

		locationId = await Locations.data.insertAsync({ warehouse_id: warehouseId, code: 'L-01' });
	});

	it(
		'should throw when the user is not logged in',
		() => assert.isRejected(
			stockAdjust._execute({}, { productId, locationId, delta: 5 }),
			/not-logged-in/
		)
	);

	it(
		'should throw when the user lacks the c_stock_adjust capability',
		() => assert.isRejected(
			stockAdjust._execute({ userId: readonlyUserId }, { productId, locationId, delta: 5 }),
			/no-permission/
		)
	);

	it(
		'should throw when the product does not exist',
		() => assert.isRejected(
			stockAdjust._execute({ userId: adminUserId }, { productId: 'XXXXXXXXXXXXXXXXX', locationId, delta: 5 }),
			/product-not-found/
		)
	);

	it(
		'should throw when the location does not exist',
		() => assert.isRejected(
			stockAdjust._execute({ userId: adminUserId }, { productId, locationId: 'XXXXXXXXXXXXXXXXX', delta: 5 }),
			/location-not-found/
		)
	);

	it(
		'should throw when the delta is zero',
		() => assert.isRejected(
			stockAdjust._execute({ userId: adminUserId }, { productId, locationId, delta: 0 }),
			/zero-delta/
		)
	);

	it(
		'should throw when the adjustment would result in negative stock',
		() => assert.isRejected(
			stockAdjust._execute({ userId: adminUserId }, { productId, locationId, delta: -5 }),
			/negative-stock/
		)
	);

	it(
		'should adjust the stock and upsert the same stock document on repeat',
		async () => {
			const first = await stockAdjust._execute({ userId: adminUserId }, { productId, locationId, delta: 10 });

			assert.equal(first.quantityBefore, 0);
			assert.equal(first.quantityAfter, 10);

			const second = await stockAdjust._execute({ userId: adminUserId }, { productId, locationId, delta: -4 });

			assert.equal(second.quantityBefore, 10);
			assert.equal(second.quantityAfter, 6);

			const count = await Stock.data.find({ product_id: productId, location_id: locationId }).countAsync();

			assert.equal(count, 1, 'there is only one stock document');

			const stock = await Stock.data.findOneAsync({ product_id: productId, location_id: locationId });

			assert.equal(stock.quantity, 6);
		}
	);

	it(
		'should write a stock history entry with the before and after quantity',
		async () => {
			const entries = await StockHistory.data.find({
				product_id: productId,
				location_id: locationId
			}, {
				sort: { created: 1 }
			}).fetchAsync();

			assert.lengthOf(entries, 2);

			assert.equal(entries[0].delta, 10);
			assert.equal(entries[0].quantity_before, 0);
			assert.equal(entries[0].quantity_after, 10);

			assert.equal(entries[1].delta, -4);
			assert.equal(entries[1].quantity_before, 10);
			assert.equal(entries[1].quantity_after, 6);
		}
	);

	it(
		'keeps product stock totals consistent',
		async () => {
			const product = await Products.data.findOneAsync(productId);

			assert.equal(product.total_stock, 6);
		}
	);
});
