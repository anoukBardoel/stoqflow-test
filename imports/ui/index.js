import { Template } from 'meteor/templating';

import i18n from '/imports/lib/i18n';

import '/imports/ui/views/app/not_found.html';
import '/imports/ui/layouts/render';
import '/imports/ui/layouts/app_layout';
import '/imports/ui/layouts/mount';
import '/imports/ui/views/app/login';
import '/imports/ui/views/products/index';
import '/imports/ui/views/warehouses/index';
import '/imports/ui/views/warehouses/single';
import '/imports/ui/views/stock/index';
import '/imports/ui/views/stock/adjust';
import '/imports/ui/views/deliveries/index';
import '/imports/ui/views/search/index';
import '/imports/ui/app.less';

//universe:i18n only registers a __ helper, expose it as i18n as well
Template.registerHelper('i18n', (key, ...args) => i18n.__(key, ...args));
