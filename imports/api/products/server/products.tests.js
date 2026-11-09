import { assert } from 'chai';

import { productsLookup } from '../methods';
import { Products } from '/imports/collections/products';

describe('products.lookup', () => {
	const userId = 'CARRENTASERXXXXXX';

	before(async () => {
		await Products.data.removeAsync({});

		await Products.data.insertAsync({ code: 'ABC-1', name: 'Alpha wrench' });
		await Products.data.insertAsync({ code: 'ABC-2', name: 'Beta bolt' });
		await Products.data.insertAsync({ code: 'XYZ-1', name: 'Box (large)' });
		await Products.data.insertAsync({ code: 'ABC-1', name: 'Trashed product', trash: new Date() });
	});

	it(
		'should throw when the user is not logged in',
		() => assert.isRejected(
			productsLookup._execute({}, { query: 'ABC' }),
			/not-logged-in/
		)
	);

	it(
		'should throw when the user lacks the c_products_read capability',
		() => assert.isRejected(
			productsLookup._execute({ userId: 'NOACCESSUSERXXXXX' }, { query: 'ABC' }),
			/no-permission/
		)
	);

	it(
		'should return matches on the code',
		async () => {
			const matches = await productsLookup._execute({ userId }, { query: 'ABC' });

			assert.lengthOf(matches, 2);
			assert.deepEqual(matches.map(m => m.code).sort(), ['ABC-1', 'ABC-2']);
		}
	);

	it(
		'should return matches on the name regardless of case',
		async () => {
			const matches = await productsLookup._execute({ userId }, { query: 'wrench' });

			assert.lengthOf(matches, 1);
			assert.equal(matches[0].code, 'ABC-1');
		}
	);

	it(
		'should not choke on special regex characters in the query',
		async () => {
			const matches = await productsLookup._execute({ userId }, { query: '(large)' });

			assert.lengthOf(matches, 1);
			assert.equal(matches[0].code, 'XYZ-1');
		}
	);

	it(
		'should not return trashed products',
		async () => {
			const matches = await productsLookup._execute({ userId }, { query: 'Trashed' });

			assert.lengthOf(matches, 0);
		}
	);

	it(
		'should return at most 20 results',
		async () => {
			await Promise.all(Array.from({ length: 25 }, (_, i) => Products.data.insertAsync({ code: `LIM-${i}`, name: `Limit product ${i}` })));

			const matches = await productsLookup._execute({ userId }, { query: 'LIM' });

			assert.lengthOf(matches, 20);
		}
	);
});
