import { ReactiveDict } from 'meteor/reactive-dict';

//small stand-in for kadira:blaze-layout, which is not compatible with Meteor 3
export const layoutState = new ReactiveDict('layout');

/**
 * Renders the given view inside the app layout
 * @param {string} templateName - the snake_case name of the template to render
 * @returns {void}
 */
export const renderLayout = function(templateName) {
	layoutState.set('main', templateName);
};
