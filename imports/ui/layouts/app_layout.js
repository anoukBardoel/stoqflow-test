import './app_layout.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { layoutState } from './render';

/**
 * helper that returns the name of the logged in user
 * @returns {string} the user's name or an empty string
 */
function currentUserName() {
	const user = Meteor.user();

	return user?.username || user?.emails?.[0]?.address || '';
}

/**
 * helper that marks a nav entry active when the current route name starts with the prefix
 * @param {string} prefix - the route name prefix to match against
 * @returns {string} 'active' when the current route matches, otherwise an empty string
 */
function activeNav(prefix) {
	//watchPathChange makes this helper rerun on every route change
	FlowRouter.watchPathChange();

	const routeName = FlowRouter.getRouteName() || '';

	return routeName.startsWith(prefix) ? 'active' : '';
}

Template.app_layout.helpers({
	userName: currentUserName,
	main: () => layoutState.get('main'),
	activeNav
});

Template.app_layout.events({
	'click .app-nav-logout'() {
		Meteor.logout();
	}
});
