import './index.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import i18n from '/imports/lib/i18n';
import { currentUserHasCapabilities } from '/imports/lib/user';
import { Warehouses } from '/imports/collections/warehouses';
import { Products } from '/imports/collections/products';
import { Locations } from '/imports/collections/locations';

//state of the delivery form
let lineKey = 0;

const lines = new ReactiveVar([]),
	warehouseId = new ReactiveVar(null),
	formError = new ReactiveVar(null),
	formResult = new ReactiveVar(null);

/**
 * looks up a product by its exact code
 * @param {string} code - the code typed or picked by the user
 * @returns {object|null} the matching product document
 */
function lookupProduct(code) {
	return Products.data.findOne({ code: code.trim().toUpperCase(), trash: { $exists: false } }) || null;
}

/**
 * looks up a location of the picked warehouse by its exact code
 * @param {string} code - the code typed or picked by the user
 * @returns {object|null} the matching location document
 */
function lookupLocation(code) {
	const picked = warehouseId.get();
	if (!picked) return null;

	return Locations.data.findOne({ warehouse_id: picked, code: code.trim().toUpperCase(), trash: { $exists: false } }) || null;
}

/**
 * returns the current lines without their internal key
 * @returns {Array<{productId: string, locationId: string, quantity: number}>} the plain line list
 */
function plainLines() {
	return lines.get().map(line => ({
		productId: line.productId,
		locationId: line.locationId,
		quantity: line.quantity
	}));
}

Template.deliveries_index.onCreated(function deliveriesIndexCreated() {
	this.subscribe('products.all');
	this.subscribe('warehouses.all');

	//subscribe to the locations of the picked warehouse
	this.autorun(() => {
		const picked = warehouseId.get();
		if (!picked) return;

		this.subscribe('locations.by-warehouse', picked);
	});
});

Template.deliveries_index.helpers({
	canProcess: () => currentUserHasCapabilities(['c_deliveries_process']),
	error: () => formError.get(),
	result: () => formResult.get(),
	warehouses() {
		return Warehouses.data.find({ trash: { $exists: false } }, { sort: { name: 1 } }).fetch().map(w => ({
			_id: w._id,
			name: w.name,
			selected: w._id === warehouseId.get()
		}));
	},
	locations() {
		return Locations.data.find({}, { sort: { code: 1 } }).fetch();
	},
	productOptions() {
		return Products.data.find({ trash: { $exists: false } }, { sort: { code: 1 } }).fetch();
	},
	/**
	 * helper that resolves the code of the product in the line data context
	 * @returns {string} the code of the picked product
	 */
	lineCode() {
		return Products.data.findOne(this.productId)?.code || this.code;
	},
	/**
	 * helper that resolves the name of the product in the line data context,
	 * it fills in automatically once the code is picked
	 * @returns {string} the name of the picked product
	 */
	productName() {
		return Products.data.findOne(this.productId)?.name || '';
	},
	/**
	 * helper that resolves the code of the location in the line data context
	 * @returns {string} the code of the picked location
	 */
	lineLocationCode() {
		return Locations.data.findOne(this.locationId)?.code || this.locationCode;
	},
	lines() {
		return lines.get();
	},
	/**
	 * helper that summarizes the processed lines as text
	 * @returns {string} 'Processed: 2x SKU-001 to L-01, 3x SKU-002 to L-02'
	 */
	resultText() {
		const summary = formResult.get().map(line => {
			const product = Products.data.findOne(line.productId) || {},
				location = Locations.data.findOne(line.locationId) || {};

			return i18n.__('deliveries.lines-item', {
				quantity: line.quantity,
				code: product.code || '?',
				location: location.code || '?'
			});
		}).join(', ');

		return i18n.__('deliveries.processed', { lines: summary });
	}
});

Template.deliveries_index.events({
	'change .deliveries-warehouse-picker'(e) {
		warehouseId.set(e.target.value || null);
	},
	'click .deliveries-add-line'() {
		const current = lines.get();

		current.push({ key: ++lineKey, code: '', productId: null, locationCode: '', locationId: null, quantity: 1 });

		lines.set(current);
	},
	'change .deliveries-line-code'(e) {
		const current = lines.get(),
			line = current.find(x => x.key === Number(e.currentTarget.dataset.key)),
			product = lookupProduct(e.target.value);

		if (!line) return;

		//picking a valid code fills in the product, otherwise the line stays empty
		line.code = product?.code || '';
		line.productId = product?._id || null;

		lines.set(current);
	},
	'change .deliveries-line-location'(e) {
		const current = lines.get(),
			line = current.find(x => x.key === Number(e.currentTarget.dataset.key)),
			location = lookupLocation(e.target.value);

		if (!line) return;

		//picking a valid code fills in the location, otherwise the line stays empty
		line.locationCode = location?.code || '';
		line.locationId = location?._id || null;

		lines.set(current);
	},
	'change .deliveries-line-quantity'(e) {
		const current = lines.get(),
			line = current.find(x => x.key === Number(e.currentTarget.dataset.key));

		if (!line) return;

		line.quantity = Math.max(1, parseInt(e.target.value, 10) || 0);

		lines.set(current);
	},
	'click .deliveries-line-remove'(e) {
		lines.set(lines.get().filter(x => x.key !== Number(e.currentTarget.dataset.key)));
	},
	async 'submit .deliveries-form'(e) {
		e.preventDefault();

		const allLines = plainLines(),
			validLines = allLines.filter(line => line.productId && line.locationId),
			seen = new Set();

		formError.set(null);
		formResult.set(null);

		//validate the form before calling the server
		if (!warehouseId.get()) return formError.set(i18n.__('deliveries.warehouse-required'));
		if (validLines.length < allLines.length) return formError.set(i18n.__('deliveries.line-incomplete'));
		if (!validLines.length) return formError.set(i18n.__('deliveries.no-lines'));

		//the same product and location combination may only appear once
		const duplicate = validLines.some(line => {
			const key = `${line.productId}:${line.locationId}`;

			if (seen.has(key)) return true;

			seen.add(key);

			return false;
		});

		if (duplicate) return formError.set(i18n.__('deliveries.duplicate-line'));

		try {
			const processed = await Meteor.callAsync('v1.deliveries.process', { lines: validLines });

			formResult.set(processed);
			lines.set([]);
		} catch (err) {
			formError.set(i18n.__(err.reason) || err.reason);
		}
	}
});
