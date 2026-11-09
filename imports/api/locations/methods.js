import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { check, Match } from 'meteor/check';

import RegEx from '/imports/lib/regex';
import { userHasCapabilities } from '/imports/lib/user';
import { escapeRegex, withoutUndefined } from '/imports/lib/utilities';
import { version } from '../version';

import { locationsCollection } from '/imports/collections/locations';
import { warehousesCollection } from '/imports/collections/warehouses';

/**
 * locations.create
 * creates a new location inside a warehouse
 * @param {object} params - the parameters passed to the method
 * @param {string} params.warehouseId - the id of the warehouse to create the location in
 * @param {string} params.code - the code of the location
 * @param {string} [params.name] - an optional name for the location
 * @returns {Promise<string>} resolves in the id of the new location
 */
export const locationsCreate = new ValidatedMethod({
	name: `${version}.locations.create`,
	validate(params) {
		check(withoutUndefined(params), { warehouseId: Match.Where(x => RegEx.Id.test(x)), code: String, name: Match.Maybe(String) }, { errorMessage: 'invalid location' });
	},
	async run({ warehouseId, code, name }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('locations.create.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_locations_create'] })) throw new Meteor.Error('locations.create.no-permission', 'errors.no-permission');

		//make sure the warehouse exists
		const warehouse = await warehousesCollection.findOneAsync({ _id: warehouseId, trash: { $exists: false } });
		if (!warehouse) throw new Meteor.Error('locations.create.warehouse-not-found', 'errors.not-found');

		return locationsCollection.insertAsync({
			warehouse_id: warehouseId,
			code,
			name,
			user_id: userId
		});
	}
});

/**
 * locations.update
 * updates an existing location
 * @param {object} params - the parameters passed to the method
 * @param {string} params.locationId - the id of the location to update
 * @param {string} [params.code] - the new code of the location
 * @param {string} [params.name] - the new name of the location
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const locationsUpdate = new ValidatedMethod({
	name: `${version}.locations.update`,
	validate(params) {
		check(withoutUndefined(params), { locationId: Match.Where(x => RegEx.Id.test(x)), code: Match.Maybe(String), name: Match.Maybe(String) }, { errorMessage: 'invalid location' });
	},
	async run({ locationId, code, name }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('locations.update.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_locations_update'] })) throw new Meteor.Error('locations.update.no-permission', 'errors.no-permission');

		const location = await locationsCollection.findOneAsync({ _id: locationId, trash: { $exists: false } });
		if (!location) throw new Meteor.Error('locations.update.not-found', 'errors.not-found');

		const set = {};
		if (code != null) set.code = code;
		if (name != null) set.name = name;

		return locationsCollection.updateAsync(locationId, { $set: set });
	}
});

/**
 * locations.delete
 * soft deletes a location by setting trash
 * @param {object} params - the parameters passed to the method
 * @param {string} params.locationId - the id of the location to delete
 * @returns {Promise<number>} resolves in the number of modified documents
 */
export const locationsDelete = new ValidatedMethod({
	name: `${version}.locations.delete`,
	validate(params) {
		check(withoutUndefined(params), { locationId: Match.Where(x => RegEx.Id.test(x)) }, { errorMessage: 'invalid location identifier' });
	},
	async run({ locationId }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('locations.delete.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_locations_delete'] })) throw new Meteor.Error('locations.delete.no-permission', 'errors.no-permission');

		const location = await locationsCollection.findOneAsync({ _id: locationId, trash: { $exists: false } });
		if (!location) throw new Meteor.Error('locations.delete.not-found', 'errors.not-found');

		return locationsCollection.updateAsync(locationId, { $set: { trash: new Date() } });
	}
});

/**
 * locations.lookup
 * searches locations by code and name for autocomplete
 * @param {object} params - the parameters passed to the method
 * @param {string} params.query - the search query
 * @param {string} [params.warehouseId] - limits the search to one warehouse
 * @returns {Promise<object[]>} resolves in an array of location matches
 */
export const locationsLookup = new ValidatedMethod({
	name: `${version}.locations.lookup`,
	validate(params) {
		check(withoutUndefined(params), { query: String, warehouseId: Match.Maybe(Match.Where(x => RegEx.Id.test(x))) }, { errorMessage: 'invalid lookup' });
	},
	async run({ query, warehouseId }) {
		const { userId } = this;
		if (!userId) throw new Meteor.Error('locations.lookup.not-logged-in', 'errors.not-logged-in');

		if (!await userHasCapabilities({ userId, capabilities: ['c_locations_read'] })) throw new Meteor.Error('locations.lookup.no-permission', 'errors.no-permission');

		const where = { trash: { $exists: false } };
		if (warehouseId) where.warehouse_id = warehouseId;

		//return the first 20 locations when no query was given
		if (!query.trim()) return locationsCollection.find(where, {
			fields: { warehouse_id: 1, code: 1, name: 1 },
			sort: { code: 1 },
			limit: 20
		}).fetchAsync();

		const regex = new RegExp(escapeRegex(query.trim()), 'i');
		where.$or = [
			{ code: regex },
			{ name: regex }
		];

		//only return locations for which the code or name matches the query
		return locationsCollection.find(where, {
			fields: { warehouse_id: 1, code: 1, name: 1 },
			sort: { code: 1 },
			limit: 20
		}).fetchAsync();
	}
});
