import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { check, Match } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { withoutUndefined } from '/imports/lib/utilities';
import { version } from '../version';

import { warehousesCollection } from '/imports/collections/warehouses';

/**
 * warehouses.create
 * creates a new warehouse
 * @param {object} params - the parameters passed to the method
 * @param {string} params.name - the name of the warehouse
 * @returns {Promise<string>} resolves in the id of the new warehouse
 */
export const warehousesCreate = new ValidatedMethod({
	name: `${version}.warehouses.create`,
	validate(params) {
		check(withoutUndefined(params), { name: String }, { errorMessage: 'invalid warehouse' });
	},
	async run({ name }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('warehouses.create.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_warehouses_create'] })) throw new Meteor.Error('warehouses.create.no-permission', 'errors.no-permission');

		return warehousesCollection.insertAsync({
			name,
			user_id: userId
		});
	}
});

/**
 * warehouses.update
 * updates an existing warehouse
 * @param {object} params - the parameters passed to the method
 * @param {string} params.warehouseId - the id of the warehouse to update
 * @param {string} params.name - the new name of the warehouse
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const warehousesUpdate = new ValidatedMethod({
	name: `${version}.warehouses.update`,
	validate(params) {
		check(withoutUndefined(params), { warehouseId: Match.Where(x => RegEx.Id.test(x)), name: String }, { errorMessage: 'invalid warehouse' });
	},
	async run({ warehouseId, name }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('warehouses.update.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_warehouses_update'] })) throw new Meteor.Error('warehouses.update.no-permission', 'errors.no-permission');

		const warehouse = await warehousesCollection.findOneAsync({ _id: warehouseId, trash: { $exists: false } });
		if (!warehouse) throw new Meteor.Error('warehouses.update.not-found', 'errors.not-found');

		return warehousesCollection.updateAsync(warehouseId, { $set: { name } });
	}
});

/**
 * warehouses.delete
 * soft deletes a warehouse by setting trash
 * @param {object} params - the parameters passed to the method
 * @param {string} params.warehouseId - the id of the warehouse to delete
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const warehousesDelete = new ValidatedMethod({
	name: `${version}.warehouses.delete`,
	validate(params) {
		check(withoutUndefined(params), { warehouseId: Match.Where(x => RegEx.Id.test(x)) }, { errorMessage: 'invalid warehouse identifier' });
	},
	async run({ warehouseId }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('warehouses.delete.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_warehouses_delete'] })) throw new Meteor.Error('warehouses.delete.no-permission', 'errors.no-permission');

		const warehouse = await warehousesCollection.findOneAsync({ _id: warehouseId, trash: { $exists: false } });
		if (!warehouse) throw new Meteor.Error('warehouses.delete.not-found', 'errors.not-found');

		return warehousesCollection.updateAsync(warehouseId, { $set: { trash: new Date() } });
	}
});
