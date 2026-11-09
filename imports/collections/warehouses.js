import 'meteor/aldeed:collection2/static';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

import RegEx from '/imports/lib/regex';

export const warehousesCollection = new Mongo.Collection('warehouses');

export const Warehouses = { data: warehousesCollection };

Warehouses.schema = new SimpleSchema({
	name: {
		label: 'name',
		type: String,
		max: 64
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

Warehouses.data.attachSchema(Warehouses.schema);
