import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * Tool that checks if a user has one of the given capabilities,
 * capabilities are stored directly on the user document
 * @param {object} params - the parameters passed to the tool
 * @param {string} params.userId - the id of the user to check
 * @param {string[]} params.capabilities - the capabilities to check for
 * @returns {Promise<boolean>} whether the user has one of the capabilities
 */
export const userHasCapabilities = async function({ userId, capabilities }) {
	check({ userId }, { userId: String }, { errorMessage: 'invalid user identifier' });
	check({ capabilities }, { capabilities: [String] }, { errorMessage: 'invalid capability' });

	const user = await Meteor.users.findOneAsync(userId, { fields: { capabilities: 1 } });

	return !!user && (user.capabilities || []).some(c => capabilities.includes(c));
};

/**
 * Client-side variant of userHasCapabilities for the current user,
 * reads the capabilities straight off the reactive user document
 * @param {string[]} capabilities - the capabilities to check for
 * @returns {boolean} whether the current user has one of the capabilities
 */
export const currentUserHasCapabilities = function(capabilities) {
	const user = Meteor.user();

	return !!user && (user.capabilities || []).some(c => capabilities.includes(c));
};
