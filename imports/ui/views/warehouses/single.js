import './single.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import i18n from '/imports/lib/i18n';
import { currentUserHasCapabilities } from '/imports/lib/user';
import { Warehouses } from '/imports/collections/warehouses';
import { Locations } from '/imports/collections/locations';

const editingLocation = new ReactiveVar(null),
	modalError = new ReactiveVar(null);

Template.warehouses_single.onCreated(function warehousesSingleCreated() {
	this.autorun(() => {
		this.subscribe('locations.by-warehouse', FlowRouter.getParam('warehouseId'));
	});
});

Template.warehouses_single.helpers({
	canCreate: () => currentUserHasCapabilities(['c_locations_create']),
	editing: () => !!editingLocation.get(),
	location: () => editingLocation.get(),
	locationId: () => editingLocation.get()?._id,
	error: () => modalError.get(),
	warehouse() {
		return Warehouses.data.findOne(FlowRouter.getParam('warehouseId'));
	},
	locations() {
		return Locations.data.find({ trash: { $exists: false } }, { sort: { code: 1 } }).fetch();
	}
});

Template.warehouses_single.events({
	'click .locations-add'() {
		modalError.set(null);
		editingLocation.set({});
	},
	'click .locations-edit'(e) {
		modalError.set(null);
		editingLocation.set(Locations.data.findOne(e.currentTarget.dataset.id));
	},
	'click .locations-delete'(e) {
		//ask the user to confirm before deleting
		if (!window.confirm(i18n.__('app.delete-confirm'))) return;

		Meteor.callAsync('v1.locations.delete', { locationId: e.currentTarget.dataset.id }).catch(err => console.error(err));
	},
	'click .modal-cancel'() {
		editingLocation.set(null);
	},
	async 'submit .locations-modal'(e) {
		e.preventDefault();

		const location = editingLocation.get(),
			warehouseId = FlowRouter.getParam('warehouseId'),
			code = e.target.code.value.trim().toUpperCase(),
			name = e.target.name.value.trim() || undefined;

		modalError.set(null);

		try {
			if (location._id) {
				await Meteor.callAsync('v1.locations.update', { locationId: location._id, code, name });
			} else {
				await Meteor.callAsync('v1.locations.create', { warehouseId, code, name });
			}

			editingLocation.set(null);
		} catch (err) {
			modalError.set(i18n.__(err.reason) || err.reason);
		}
	}
});
