import './app_layout.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { layoutState } from './render';

/**
 * helper that returns the name of the logged in user
 * @returns {string} the user's name or an empty string
 */
function currentUserName() {
	const user = Meteor.user();

	return user?.username || user?.emails?.[0]?.address || '';
}

Template.app_layout.helpers({
	userName: currentUserName,
	main: () => layoutState.get('main')
});

Template.app_layout.events({
	'click .app-nav-logout'() {
		Meteor.logout();
	}
});
