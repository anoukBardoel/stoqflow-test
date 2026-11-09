import 'meteor/aldeed:collection2/static';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

import RegEx from '/imports/lib/regex';

export const stockHistoryCollection = new Mongo.Collection('stock-history');

export const StockHistory = { data: stockHistoryCollection };

StockHistory.schema = new SimpleSchema({
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
	delta: {
		label: 'delta',
		type: SimpleSchema.Integer
	},
	quantity_before: {
		label: 'quantity before',
		type: SimpleSchema.Integer,
		min: 0
	},
	quantity_after: {
		label: 'quantity after',
		type: SimpleSchema.Integer,
		min: 0
	},
	reason: {
		label: 'reason',
		type: String,
		allowedValues: ['correction', 'damage', 'recount', 'other'],
		optional: true
	},
	user_id: {
		type: String,
		optional: true,
		regEx: RegEx.Id
	},
	created: {
		type: Date,
		autoValue() {
			if (this.isInsert && !this.isSet) return new Date();
		}
	}
});

StockHistory.data.attachSchema(StockHistory.schema);
