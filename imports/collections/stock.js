import 'meteor/aldeed:collection2/static';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

import RegEx from '/imports/lib/regex';

export const stockCollection = new Mongo.Collection('stock');

export const Stock = { data: stockCollection };

Stock.schema = new SimpleSchema({
	product_id: {
		label: 'product',
		type: String,
		regEx: RegEx.Id
	},
	location_id: {
		label: 'location',
		type: String,
		regEx: RegEx.Id
	},
	quantity: {
		label: 'quantity',
		type: SimpleSchema.Integer,
		min: 0
	},
	created: {
		type: Date,
		autoValue() {
			if (this.isInsert && !this.isSet) return new Date();
		}
	},
	modified: {
		type: Date,
		optional: true
	},
	user_id: {
		type: String,
		optional: true,
		regEx: RegEx.Id
	}
});

Stock.data.attachSchema(Stock.schema);
