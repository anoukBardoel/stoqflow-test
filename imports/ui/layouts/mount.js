import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';

let topLevelView = null,
	topLevelTemplate = null;

/**
 * Mounts the top level template on the document body, swapping the
 * login view and the app layout whenever the login state changes
 * @returns {void}
 */
function mountTopLevel() {
	const template = Meteor.userId() ? Template.app_layout : Template.login;

	if (topLevelTemplate === template) return;

	if (topLevelView) Blaze.remove(topLevelView);

	topLevelView = Blaze.render(template, document.body);
	topLevelTemplate = template;
}

Meteor.startup(() => {
	Tracker.autorun(() => {
		//redo the mount when the login state flips
		Meteor.userId();
		Tracker.nonreactive(mountTopLevel);
	});
});
