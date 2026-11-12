import './index.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { currentUserHasCapabilities } from '/imports/lib/user';
import { Warehouses } from '/imports/collections/warehouses';
import { Products } from '/imports/collections/products';
import { Locations } from '/imports/collections/locations';
import { Stock } from '/imports/collections/stock';

//shared state for the adjust modal
const editingAdjustment = new ReactiveVar(null);

Template.stock_index.onCreated(function stockIndexCreated() {
	this.subscribe('products.all');
	this.subscribe('warehouses.all');

	this.autorun(() => {
		const warehouseId = FlowRouter.getParam('warehouseId');
		if (!warehouseId) return;

		this.subscribe('locations.by-warehouse', warehouseId);
		this.subscribe('stock.by-warehouse', warehouseId);
	});
});

Template.stock_index.helpers({
	canAdjust: () => currentUserHasCapabilities(['c_stock_adjust']),
	editing: () => !!editingAdjustment.get(),
	warehouses() {
		return Warehouses.data.find({ trash: { $exists: false } }, { sort: { name: 1 } }).fetch().map(w => ({
			_id: w._id,
			name: w.name,
			selected: w._id === FlowRouter.getParam('warehouseId')
		}));
	},
	warehouseId: () => FlowRouter.getParam('warehouseId'),
	rows() {
		const warehouseId = FlowRouter.getParam('warehouseId');
		if (!warehouseId) return [];

		//carry the adjust permission on the rows, the template cannot reach it over ../
		const canAdjust = currentUserHasCapabilities(['c_stock_adjust']);

		//join the stock docs with their product and location
		return Stock.data.find({}).fetch().map(s => {
			const location = Locations.data.findOne(s.location_id) || {},
				product = Products.data.findOne(s.product_id) || {};

			return {
				_id: s._id,
				product_id: s.product_id,
				location_id: s.location_id,
				productCode: product.code,
				productName: product.name,
				locationCode: location.code,
				quantity: s.quantity,
				canAdjust
			};
		}).sort((a, b) => (a.locationCode || '').localeCompare(b.locationCode || ''));
	}
});

Template.stock_index.events({
	'change .stock-warehouse-picker'(e) {
		const value = e.target.value;

		//switch to the picked warehouse
		FlowRouter.go('stock.single', { warehouseId: value });
	},
	'click .stock-adjust-open'() {
		editingAdjustment.set({});
	},
	'click .stock-adjust-row'(e) {
		const stock = Stock.data.findOne(e.currentTarget.dataset.stockId);

		editingAdjustment.set({
			product_id: stock.product_id,
			location_id: stock.location_id
		});
	}
});

export { editingAdjustment };
