import './adjust.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import i18n from '/imports/lib/i18n';
import { editingAdjustment } from './index';
import { Products } from '/imports/collections/products';
import { Locations } from '/imports/collections/locations';

const productMatches = new ReactiveVar([]),
	locationMatches = new ReactiveVar([]),
	selectedProductId = new ReactiveVar(null),
	selectedLocationId = new ReactiveVar(null),
	adjustResult = new ReactiveVar(null),
	adjustError = new ReactiveVar(null);

let productTimer,
	locationTimer;

/**
 * Resolves the exact product behind a typed input value
 * @param {HTMLInputElement} input - the product input element
 * @returns {Promise<string|null>} the product id or null when nothing matches
 */
async function resolveProductId(input) {
	const value = input ? input.value.trim() : '';
	if (!value) return null;

	const matches = await Meteor.callAsync('v1.products.lookup', { query: value }).catch(() => []);
	const match = matches.find(p => p.code === value || p.name === value);

	return match ? match._id : null;
}

/**
 * Resolves the exact location behind a typed input value
 * @param {HTMLInputElement} input - the location input element
 * @returns {Promise<string|null>} the location id or null when nothing matches
 */
async function resolveLocationId(input) {
	const value = input ? input.value.trim() : '';
	if (!value) return null;

	const matches = await Meteor.callAsync('v1.locations.lookup', {
		query: value,
		warehouseId: FlowRouter.getParam('warehouseId') || undefined
	}).catch(() => []);
	const match = matches.find(l => l.code === value || l.name === value);

	return match ? match._id : null;
}

Template.stock_adjust.onCreated(function stockAdjustCreated() {
	const adjustment = editingAdjustment.get();

	selectedProductId.set(adjustment.product_id || null);
	selectedLocationId.set(adjustment.location_id || null);
	adjustResult.set(null);
	adjustError.set(null);
	productMatches.set([]);
	locationMatches.set([]);

	//prefill the inputs when the adjustment came from a stock row
	if (adjustment.product_id) {
		const product = Products.data.findOne(adjustment.product_id);
		if (product) selectedProductId.set(product._id);
	}
	if (adjustment.location_id) {
		const location = Locations.data.findOne(adjustment.location_id);
		if (location) selectedLocationId.set(location._id);
	}
});

Template.stock_adjust.onRendered(function stockAdjustRendered() {
	const adjustment = editingAdjustment.get();

	//fill the visible inputs once they exist
	if (adjustment.product_id) {
		const product = Products.data.findOne(adjustment.product_id);
		if (product) this.$('.adjust-product').val(product.code);
	}
	if (adjustment.location_id) {
		const location = Locations.data.findOne(adjustment.location_id);
		if (location) this.$('.adjust-location').val(location.code);
	}
});

Template.stock_adjust.helpers({
	productCode() {
		const product = Products.data.findOne(selectedProductId.get());

		return product?.code || '';
	},
	locationCode() {
		const location = Locations.data.findOne(selectedLocationId.get());

		return location?.code || '';
	},
	productMatches: () => productMatches.get(),
	locationMatches: () => locationMatches.get(),
	result: () => adjustResult.get(),
	error: () => adjustError.get(),
	adjustedText() {
		const result = adjustResult.get();

		return i18n.__('stock.adjusted', { before: result.quantityBefore, after: result.quantityAfter });
	}
});

Template.stock_adjust.events({
	'input .adjust-product'(e) {
		const value = e.target.value;

		clearTimeout(productTimer);
		productTimer = setTimeout(async function() {
			//search products through the lookup method
			if (!value.trim()) return productMatches.set([]);

			const matches = await Meteor.callAsync('v1.products.lookup', { query: value }).catch(err => {
				console.error(err);
				return [];
			});

			productMatches.set(matches);
		}, 300);
	},
	'change .adjust-product'(e) {
		//map the typed code back to a product id
		const match = productMatches.get().find(p => p.code === e.target.value || p.name === e.target.value);

		selectedProductId.set(match ? match._id : null);
	},
	'input .adjust-location'(e) {
		const value = e.target.value;

		clearTimeout(locationTimer);
		locationTimer = setTimeout(async function() {
			//search locations inside the current warehouse only
			if (!value.trim()) return locationMatches.set([]);

			const matches = await Meteor.callAsync('v1.locations.lookup', {
				query: value,
				warehouseId: FlowRouter.getParam('warehouseId') || undefined
			}).catch(err => {
				console.error(err);
				return [];
			});

			locationMatches.set(matches);
		}, 300);
	},
	'change .adjust-location'(e) {
		//map the typed code back to a location id
		const match = locationMatches.get().find(l => l.code === e.target.value || l.name === e.target.value);

		selectedLocationId.set(match ? match._id : null);
	},
	'click .modal-cancel'() {
		editingAdjustment.set(null);
	},
	async 'submit .stock-adjust-modal'(e) {
		e.preventDefault();

		let productId = selectedProductId.get(),
			locationId = selectedLocationId.get();

		//the change event can fire before the debounced lookup resolved, fall back to an exact match
		if (!productId) productId = await resolveProductId(e.target.querySelector('.adjust-product'));
		if (!locationId) locationId = await resolveLocationId(e.target.querySelector('.adjust-location'));

		const delta = Number(e.target.delta.value),
			reason = e.target.reason.value || undefined;

		adjustError.set(null);
		adjustResult.set(null);

		if (!productId || !locationId) return adjustError.set(i18n.__('stock.select-product-location'));

		try {
			const result = await Meteor.callAsync('v1.stock.adjust', { productId, locationId, delta, reason });

			adjustResult.set(result);
		} catch (err) {
			adjustError.set(i18n.__(err.reason) || err.reason);
		}
	}
});
