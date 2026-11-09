import 'meteor/aldeed:collection2/static';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

import RegEx from '/imports/lib/regex';

export const productsCollection = new Mongo.Collection('products');

export const Products = { data: productsCollection };

Products.schema = new SimpleSchema({
	code: {
		label: 'code',
		type: String,
		max: 32,
		regEx: RegEx.Code
	},
	name: {
		label: 'name',
		type: String,
		max: 128
	},
	unit: {
		label: 'unit',
		type: String,
		allowedValues: ['pcs', 'kg', 'l'],
		defaultValue: 'pcs'
	},
	total_stock: {
		type: SimpleSchema.Integer,
		defaultValue: 0
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

Products.data.attachSchema(Products.schema);
