import 'meteor/aldeed:collection2/static';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

import RegEx from '/imports/lib/regex';

export const locationsCollection = new Mongo.Collection('locations');

export const Locations = { data: locationsCollection };

Locations.schema = new SimpleSchema({
	warehouse_id: {
		label: 'warehouse',
		type: String,
		regEx: RegEx.Id
	},
	code: {
		label: 'code',
		type: String,
		max: 32
	},
	name: {
		label: 'name',
		type: String,
		max: 64,
		optional: true
	},
	trash: {
		type: Date,
		optional: true
	},
	created: {
		type: Date,
		autoValue() {
			if (this.isInsert && !this.isSet) return new Date();
		}
	},
	user_id: {
		type: String,
		optional: true,
		regEx: RegEx.Id
	}
});

Locations.data.attachSchema(Locations.schema);
