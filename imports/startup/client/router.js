import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { renderLayout } from '/imports/ui/layouts/render';

//redirect to login when there is no user
FlowRouter.triggers.enter([function loginGate(context, redirect) {
	//never gate the login route itself
	if (context.route.name === 'login') return;

	//give accounts a chance to resume the session before kicking the user out
	if (!Meteor.userId() && !Meteor.loggingIn()) redirect('/login');
}]);

FlowRouter.route('/', {
	name: 'products.index',
	action() {
		renderLayout('products_index');
	}
});

FlowRouter.route('/warehouses', {
	name: 'warehouses.index',
	action() {
		renderLayout('warehouses_index');
	}
});

FlowRouter.route('/warehouses/:warehouseId', {
	name: 'warehouses.single',
	action() {
		renderLayout('warehouses_single');
	}
});

FlowRouter.route('/stock', {
	name: 'stock.index',
	action() {
		renderLayout('stock_index');
	}
});

FlowRouter.route('/stock/:warehouseId', {
	name: 'stock.single',
	action() {
		renderLayout('stock_index');
	}
});

FlowRouter.route('/deliveries', {
	name: 'deliveries.index',
	action() {
		renderLayout('deliveries_index');
	}
});

FlowRouter.route('/login', {
	name: 'login',
	triggersEnter: [
		//already logged in, go home
		function loginGate(context, redirect) {
			if (Meteor.userId()) redirect('products.index');
		}
	],
	//the login view is mounted by imports/ui/layouts/mount
	action() {}
});

FlowRouter.notFound = {
	action() {
		renderLayout('not_found');
	}
};
