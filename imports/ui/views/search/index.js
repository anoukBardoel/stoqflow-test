import './index.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';
import { Stock } from '/imports/collections/stock';

let searchTimer;

const searchQuery = new ReactiveVar(''),
	searchResults = new ReactiveVar(null),
	warehouseFilter = new ReactiveVar('');

Template.search_index.onCreated(function searchIndexCreated() {
	this.subscribe('warehouses.all');
	this.subscribe('locations.all');

	//subscribe to the stock of the matched products
	this.autorun(() => {
		const matches = searchResults.get();
		if (!matches) return;

		this.subscribe('stock.by-products', matches.map(match => match._id));
	});
});

Template.search_index.helpers({
	searchQuery: () => searchQuery.get(),
	products: () => searchResults.get() || [],
	warehouses() {
		return Warehouses.data.find({ trash: { $exists: false } }, { sort: { name: 1 } }).fetch().map(w => ({
			_id: w._id,
			name: w.name,
			selected: w._id === warehouseFilter.get()
		}));
	},
	/**
	 * helper that joins the matched products with their stock, locations and
	 * warehouses, filtered by the picked warehouse
	 * @returns {object[]} rows with product, warehouse, location and quantity
	 */
	rows() {
		const matches = searchResults.get();
		if (!matches) return [];

		const filter = warehouseFilter.get();

		return matches.flatMap(match => Stock.data.find({ product_id: match._id }).fetch().map(doc => {
			const location = Locations.data.findOne(doc.location_id) || {},
				warehouse = Warehouses.data.findOne(location.warehouse_id) || {};

			return {
				code: match.code,
				name: match.name,
				warehouseId: location.warehouse_id,
				warehouseName: warehouse.name || '?',
				locationCode: location.code || '?',
				locationName: location.name || '',
				quantity: doc.quantity
			};
		}))
			.filter(row => !filter || row.warehouseId === filter)
			.sort((a, b) => a.code.localeCompare(b.code) || a.warehouseName.localeCompare(b.warehouseName) || a.locationCode.localeCompare(b.locationCode));
	}
});

Template.search_index.events({
	'input .search-input'(e) {
		const value = e.target.value;

		clearTimeout(searchTimer);
		searchTimer = setTimeout(async function() {
			searchQuery.set(value);

			//an empty query clears the grid
			if (!value.trim()) return searchResults.set(null);

			const matches = await Meteor.callAsync('v1.products.lookup', { query: value }).catch(err => {
				console.error(err);
				return [];
			});

			searchResults.set(matches);
		}, 300);
	},
	'change .search-warehouse-picker'(e) {
		warehouseFilter.set(e.target.value);
	}
});
