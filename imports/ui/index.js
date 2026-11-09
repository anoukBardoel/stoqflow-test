import { Template } from 'meteor/templating';

import i18n from '/imports/lib/i18n';

import '/imports/ui/views/not_found.html';
import '/imports/ui/layouts/render';
import '/imports/ui/layouts/app_layout';
import '/imports/ui/layouts/mount';
import '/imports/ui/views/login';
import '/imports/ui/views/products_index';
import '/imports/ui/views/warehouses_index';
import '/imports/ui/views/warehouses_single';
import '/imports/ui/views/stock_index';
import '/imports/ui/views/stock_adjust';
import '/imports/ui/app.less';

//universe:i18n only registers a __ helper, expose it as i18n as well
Template.registerHelper('i18n', (key, ...args) => i18n.__(key, ...args));
