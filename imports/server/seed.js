import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { faker } from '@faker-js/faker';

import { setUserRole } from '/imports/app/roles/tools';
import { productsCollection } from '/imports/collections/products';
import { warehousesCollection } from '/imports/collections/warehouses';
import { locationsCollection } from '/imports/collections/locations';
import { stockCollection } from '/imports/collections/stock';
import { stockHistoryCollection } from '/imports/collections/stock-history';

//demo accounts created by the seed, all share the password from the readme
const demoUsers = [
		{ username: 'admin', email: 'admin@stokpad.test', password: 'demo1234', role: 'admin' },
		{ username: 'manager', email: 'manager@stokpad.test', password: 'demo1234', role: 'manager' },
		{ username: 'operator', email: 'operator@stokpad.test', password: 'demo1234', role: 'operator' }
	],
	//warehouses to create with their location codes, aisle-bay-level style
	warehousePlan = [
		{ name: 'Main warehouse', locations: ['A-01.01', 'A-01.02', 'A-01.03', 'A-02.01', 'A-02.02', 'A-02.03', 'B-01.01', 'B-01.02', 'B-02.01'] },
		{ name: 'Overflow warehouse', locations: ['C-01.01', 'C-01.02', 'C-02.01', 'D-01.01', 'D-01.02', 'D-02.01'] }
	],
	units = ['pcs', 'kg', 'l'];

/**
 * Creates a demo user with the given role
 * @param {object} params - the parameters passed to the helper
 * @param {string} params.username - the username of the demo user
 * @param {string} params.email - the email of the demo user
 * @param {string} params.password - the password of the demo user
 * @param {string} params.role - the role to assign to the demo user
 * @returns {Promise<string>} the id of the created user
 */
const createDemoUser = async function({ username, email, password, role }) {
	const userId = await Accounts.createUserAsync({ username, email, password });

	await setUserRole({ userId, role });

	return userId;
};

/**
 * Builds a unique sku-like product code
 * @param {Set<string>} used - the codes that are already taken
 * @returns {string} a fresh unique product code
 */
const buildProductCode = function(used) {
	let code = `SKU-${faker.string.alphanumeric({ length: 5, casing: 'upper' })}`;

	while (used.has(code)) code = `SKU-${faker.string.alphanumeric({ length: 5, casing: 'upper' })}`;

	used.add(code);

	return code;
};

Meteor.startup(async function seedStartup() {
	if (process.env.SEED !== 'true') return;

	//keep the seed idempotent, demo data only goes into an empty database
	if ((await Meteor.users.find().countAsync()) > 0) {
		console.warn('seed skipped, users already exist');
		return;
	}

	console.warn('seeding demo data');

	//demo users with their roles
	const users = {};

	await Promise.all(demoUsers.map(async demo => {
		users[demo.role] = await createDemoUser(demo);
	}));

	const adminId = users.admin,

		//warehouses with their locations
		warehouseIds = await Promise.all(warehousePlan.map(plan => warehousesCollection.insertAsync({ name: plan.name, user_id: adminId }))),
		locationIds = await Promise.all(warehouseIds.flatMap((warehouseId, index) => warehousePlan[index].locations.map(code => locationsCollection.insertAsync({ warehouse_id: warehouseId, code, user_id: adminId })))),
		//products with realistic codes names and units
		usedCodes = new Set(),
		createdProducts = await Promise.all(Array.from({ length: 30 }, () => {
			const code = buildProductCode(usedCodes);

			return productsCollection.insertAsync({
				code,
				name: faker.commerce.productName(),
				unit: faker.helpers.arrayElement(units),
				user_id: adminId
			}).then(_id => ({ _id, code }));
		}));

	//initial stock, written the same way the stock adjust method writes it
	//so stock documents history entries and product totals stay consistent
	await Promise.all(createdProducts.map(async product => {
		const chosenLocations = faker.helpers.arrayElements(locationIds, faker.number.int({ min: 1, max: 3 }));

		await Promise.all(chosenLocations.map(async locationId => {
			const quantity = faker.number.int({ min: 10, max: 200 });

			await stockCollection.insertAsync({ product_id: product._id, location_id: locationId, quantity, user_id: adminId });

			await stockHistoryCollection.insertAsync({
				product_id: product._id,
				location_id: locationId,
				delta: quantity,
				quantity_before: 0,
				quantity_after: quantity,
				user_id: adminId
			});

			await productsCollection.updateAsync(product._id, { $inc: { total_stock: quantity } });
		}));
	}));

	console.warn('seed complete');
});
