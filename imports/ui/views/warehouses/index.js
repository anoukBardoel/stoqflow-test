import './index.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import i18n from '/imports/lib/i18n';
import { currentUserHasCapabilities } from '/imports/lib/user';
import { Warehouses } from '/imports/collections/warehouses';

const editingWarehouse = new ReactiveVar(null),
	modalError = new ReactiveVar(null);

Template.warehouses_index.onCreated(function warehousesIndexCreated() {
	this.subscribe('warehouses.all');
});

Template.warehouses_index.helpers({
	canCreate: () => currentUserHasCapabilities(['c_warehouses_create']),
	editing: () => !!editingWarehouse.get(),
	warehouse: () => editingWarehouse.get(),
	warehouseId: () => editingWarehouse.get()?._id,
	error: () => modalError.get(),
	warehouses() {
		return Warehouses.data.find({ trash: { $exists: false } }, { sort: { name: 1 } }).fetch();
	}
});

Template.warehouses_index.events({
	'click .warehouses-add'() {
		modalError.set(null);
		editingWarehouse.set({});
	},
	'click .warehouses-edit'(e) {
		modalError.set(null);
		editingWarehouse.set(Warehouses.data.findOne(e.currentTarget.dataset.id));
	},
	'click .warehouses-delete'(e) {
		//ask the user to confirm before deleting
		if (!window.confirm(i18n.__('app.delete-confirm'))) return;

		Meteor.callAsync('v1.warehouses.delete', { warehouseId: e.currentTarget.dataset.id }).catch(err => console.error(err));
	},
	'click .modal-cancel'() {
		editingWarehouse.set(null);
	},
	async 'submit .warehouses-modal'(e) {
		e.preventDefault();

		const warehouse = editingWarehouse.get(),
			name = e.target.name.value.trim();

		modalError.set(null);

		try {
			if (warehouse._id) {
				await Meteor.callAsync('v1.warehouses.update', { warehouseId: warehouse._id, name });
			} else {
				await Meteor.callAsync('v1.warehouses.create', { name });
			}

			editingWarehouse.set(null);
		} catch (err) {
			modalError.set(i18n.__(err.reason) || err.reason);
		}
	}
});
