import { Meteor } from 'meteor/meteor';

/**
 * Publishes the current user's own document to itself,
 * without it the client cannot react to roles and capabilities
 * @returns {void}
 */
Meteor.publish(null, function currentUserPublication() {
	//not logged in, nothing to publish
	if (!this.userId) return [];

	return Meteor.users.find({ _id: this.userId }, {
		fields: {
			username: 1,
			emails: 1,
			profile: 1,
			role: 1,
			capabilities: 1
		}
	});
});
