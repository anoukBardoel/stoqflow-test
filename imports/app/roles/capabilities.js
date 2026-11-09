//export a list of all assignable capabilities
export const capabilities = [
	//Products
	'c_products_create',
	'c_products_read',
	'c_products_update',
	'c_products_delete',

	//Warehouses
	'c_warehouses_create',
	'c_warehouses_read',
	'c_warehouses_update',
	'c_warehouses_delete',

	//Locations
	'c_locations_create',
	'c_locations_read',
	'c_locations_update',
	'c_locations_delete',

	//Stock
	'c_stock_read',
	'c_stock_adjust'
];

//map roles to capability lists
export const ROLE_CAPABILITIES = {
	admin: capabilities,
	manager: [
		'c_products_create',
		'c_products_read',
		'c_products_update',
		'c_products_delete',
		'c_warehouses_create',
		'c_warehouses_read',
		'c_warehouses_update',
		'c_locations_create',
		'c_locations_read',
		'c_locations_update',
		'c_stock_read',
		'c_stock_adjust'
	],
	operator: [
		'c_products_read',
		'c_warehouses_read',
		'c_locations_read',
		'c_stock_read',
		'c_stock_adjust'
	],
	readonly: [
		'c_products_read',
		'c_warehouses_read',
		'c_locations_read',
		'c_stock_read'
	]
};
