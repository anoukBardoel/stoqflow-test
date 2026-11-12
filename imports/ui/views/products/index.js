import './index.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import i18n from '/imports/lib/i18n';
import { currentUserHasCapabilities } from '/imports/lib/user';
import { Products } from '/imports/collections/products';

//shared state for the search and the add/edit modal
const searchResults = new ReactiveVar(null),
	searchQuery = new ReactiveVar(''),
	editingProduct = new ReactiveVar(null),
	modalError = new ReactiveVar(null);

let searchTimer;

Template.products_index.onCreated(function productsIndexCreated() {
	this.subscribe('products.all');
});

Template.products_index.helpers({
	searchQuery: () => searchQuery.get(),
	canCreate: () => currentUserHasCapabilities(['c_products_create']),
	canUpdate: () => currentUserHasCapabilities(['c_products_update']),
	canDelete: () => currentUserHasCapabilities(['c_products_delete']),
	editing: () => !!editingProduct.get(),
	/**
	 * helper that translates the unit of the product in the data context
	 * @returns {string} the translated unit label
	 */
	unitLabel() {
		return i18n.__(`unit.${this.unit}`);
	},
	products() {
		//when searching, show the lookup results instead of the full list
		const results = searchResults.get();
		if (results) return results;

		//carry the action permissions on the rows, the template cannot reach them over ../
		const canUpdate = currentUserHasCapabilities(['c_products_update']),
			canDelete = currentUserHasCapabilities(['c_products_delete']);

		return Products.data.find({ trash: { $exists: false } }, { sort: { code: 1 } }).fetch().map(product => ({
			...product,
			canUpdate,
			canDelete
		}));
	}
});

Template.products_index.events({
	'input .products-search'(e) {
		const value = e.target.value;

		clearTimeout(searchTimer);
		searchTimer = setTimeout(async function() {
			searchQuery.set(value);

			//empty query means no search, show the full list again
			if (!value.trim()) return searchResults.set(null);

			const matches = await Meteor.callAsync('v1.products.lookup', { query: value }).catch(err => {
				console.error(err);
				return [];
			});

			searchResults.set(matches);
		}, 300);
	},
	'click .products-add'() {
		modalError.set(null);
		editingProduct.set({});
	},
	'click .products-edit'(e) {
		modalError.set(null);
		editingProduct.set(Products.data.findOne(e.currentTarget.dataset.id));
	},
	async 'click .products-delete'(e) {
		//ask the user to confirm before deleting
		if (!window.confirm(i18n.__('app.delete-confirm'))) return;

		await Meteor.callAsync('v1.products.delete', { productId: e.currentTarget.dataset.id }).catch(err => console.error(err));

		searchResults.set(null);
	}
});

Template.products_modal.helpers({
	product: () => editingProduct.get(),
	productId: () => editingProduct.get()?._id,
	error: () => modalError.get()
});

Template.products_modal.events({
	'click .modal-cancel'() {
		editingProduct.set(null);
	},
	async 'submit .products-modal'(e) {
		e.preventDefault();

		const product = editingProduct.get(),
			code = e.target.code.value.trim().toUpperCase(),
			name = e.target.name.value.trim(),
			unit = e.target.unit.value;

		modalError.set(null);

		try {
			if (product._id) {
				await Meteor.callAsync('v1.products.update', { productId: product._id, name, unit });
			} else {
				await Meteor.callAsync('v1.products.create', { code, name, unit });
			}

			editingProduct.set(null);
			searchResults.set(null);
		} catch (err) {
			modalError.set(i18n.__(err.reason) || err.reason);
		}
	}
});
