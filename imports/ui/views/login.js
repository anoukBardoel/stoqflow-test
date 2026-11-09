import './login.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import i18n from '/imports/lib/i18n';

Template.login.onCreated(function loginCreated() {
	this.error = new ReactiveVar(null);
});

Template.login.helpers({
	error() {
		return Template.instance().error.get();
	}
});

Template.login.events({
	'submit .login-form'(e, t) {
		e.preventDefault();

		const email = e.target.email.value,
			password = e.target.password.value;

		t.error.set(null);

		Meteor.loginWithPassword(email, password, err => {
			if (err) return t.error.set(i18n.__('errors.not-logged-in'));

			FlowRouter.go('products.index');
		});
	}
});
