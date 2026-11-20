import { assert } from 'chai';

import { deliveriesProcess } from '../methods';
import { Products } from '/imports/collections/products';
import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';
import { Stock } from '/imports/collections/stock';
import { StockHistory } from '/imports/collections/stock-history';

describe('deliveries', () => {
	const adminUserId = 'CARRENTASERXXXXXX',
		readonlyUserId = 'TESTUSERXXXXXXXXX';

	let productId,
		otherProductId,
		locationId,
		otherLocationId;

	before(async () => {
		await Stock.data.removeAsync({});
		await StockHistory.data.removeAsync({});
		await Products.data.removeAsync({});
		await Warehouses.data.removeAsync({});
		await Locations.data.removeAsync({});

		productId = await Products.data.insertAsync({ code: 'SKU-001', name: 'Test product' });
		otherProductId = await Products.data.insertAsync({ code: 'SKU-002', name: 'Other product' });

		const warehouseId = await Warehouses.data.insertAsync({ name: 'Test warehouse' }),
			otherWarehouseId = await Warehouses.data.insertAsync({ name: 'Other warehouse' });

		locationId = await Locations.data.insertAsync({ warehouse_id: warehouseId, code: 'L-01' });
		otherLocationId = await Locations.data.insertAsync({ warehouse_id: otherWarehouseId, code: 'L-02' });
	});

	it(
		'should throw when the user is not logged in',
		() => assert.isRejected(
			deliveriesProcess._execute({}, { lines: [{ productId, locationId, quantity: 5 }] }),
			/not-logged-in/
		)
	);

	it(
		'should throw when the user lacks the c_deliveries_process capability',
		() => assert.isRejected(
			deliveriesProcess._execute({ userId: readonlyUserId }, { lines: [{ productId, locationId, quantity: 5 }] }),
			/no-permission/
		)
	);

	it(
		'should throw when the location does not exist',
		() => assert.isRejected(
			deliveriesProcess._execute({ userId: adminUserId }, { lines: [{ productId, locationId: 'XXXXXXXXXXXXXXXXX', quantity: 5 }] }),
			/location-not-found/
		)
	);

	it(
		'should throw when the product does not exist',
		() => assert.isRejected(
			deliveriesProcess._execute({ userId: adminUserId }, { lines: [{ productId: 'XXXXXXXXXXXXXXXXX', locationId, quantity: 5 }] }),
			/product-not-found/
		)
	);

	it(
		'should throw when the validation fails on the lines',
		() => assert.throws(
			() => deliveriesProcess._execute({ userId: adminUserId }, { lines: [{ productId, locationId, quantity: 0 }] }),
			/Match error/
		)
	);

	it(
		'should throw when the same product and location appears twice',
		() => assert.isRejected(
			deliveriesProcess._execute({ userId: adminUserId }, {
				lines: [{ productId, locationId, quantity: 5 }, { productId, locationId, quantity: 2 }]
			}),
			/duplicate-line/
		)
	);

	it(
		'should allow the same product at different locations',
		async () => {
			await deliveriesProcess._execute({ userId: adminUserId }, {
				lines: [{ productId, locationId, quantity: 2 }, { productId, locationId: otherLocationId, quantity: 3 }]
			});

			const stockDocs = await Stock.data.find({ product_id: productId }).fetchAsync(),
				total = stockDocs.reduce((sum, doc) => sum + doc.quantity, 0);

			assert.lengthOf(stockDocs, 2);
			assert.equal(total, 5);
		}
	);

	it(
		'should add the quantities to the product stock and create history entries',
		async () => {
			const processed = await deliveriesProcess._execute({ userId: adminUserId }, {
				lines: [{ productId, locationId, quantity: 5 }, { productId: otherProductId, locationId, quantity: 3 }]
			});

			assert.lengthOf(processed, 2);

			//every processed line reports its stock before and after
			const first = processed.find(line => line.productId === productId),
				second = processed.find(line => line.productId === otherProductId);

			assert.equal(first.quantityBefore, 2);
			assert.equal(first.quantityAfter, 7);
			assert.equal(second.quantityBefore, 0);
			assert.equal(second.quantityAfter, 3);

			const product = await Products.data.findOneAsync(productId),
				other = await Products.data.findOneAsync(otherProductId);

			assert.equal(product.total_stock, 10);
			assert.equal(other.total_stock, 3);

			const stockDocs = await Stock.data.find({ location_id: locationId }).fetchAsync();
			assert.lengthOf(stockDocs, 2);

			const historyCount = (await StockHistory.data.find({}).fetchAsync()).length;
			assert.equal(historyCount, 4);
		}
	);

	it(
		'should increase the stock of the same location on repeat deliveries',
		async () => {
			const stock = await Stock.data.findOneAsync({ product_id: productId, location_id: locationId });

			assert.equal(stock.quantity, 7);
		}
	);
});
