import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { ROLE_CAPABILITIES } from './capabilities';

/**
 * Sets a user's role and writes the matching capabilities onto the user doc
 * @param {object} params - the parameters passed to the tool
 * @param {string} params.userId - the id of the user to update
 * @param {string} params.role - the role to assign, must be a key of ROLE_CAPABILITIES
 * @returns {Promise<number>} the number of modified documents
 */
export const setUserRole = async function({ userId, role }) {
	check({ userId }, { userId: String }, { errorMessage: 'invalid user identifier' });
	check({ role }, { role: String }, { errorMessage: 'invalid role' });

	const roleCapabilities = ROLE_CAPABILITIES[role];
	if (!roleCapabilities) throw new Meteor.Error('users.set-role.unknown-role', 'errors.unknown-role');

	return Meteor.users.updateAsync(userId, { $set: { role, capabilities: roleCapabilities } });
};

/**
 * Grants an extra capability to a user without touching their role
 * @param {object} params - the parameters passed to the tool
 * @param {string} params.userId - the id of the user to update
 * @param {string} params.capability - the capability to grant
 * @returns {Promise<number>} the number of modified documents
 */
export const grantCapability = async function({ userId, capability }) {
	check({ userId }, { userId: String }, { errorMessage: 'invalid user identifier' });
	check({ capability }, { capability: String }, { errorMessage: 'invalid capability' });

	return Meteor.users.updateAsync(userId, { $addToSet: { capabilities: capability } });
};

/**
 * Revokes a capability from a user without touching their role
 * @param {object} params - the parameters passed to the tool
 * @param {string} params.userId - the id of the user to update
 * @param {string} params.capability - the capability to revoke
 * @returns {Promise<number>} the number of modified documents
 */
export const revokeCapability = async function({ userId, capability }) {
	check({ userId }, { userId: String }, { errorMessage: 'invalid user identifier' });
	check({ capability }, { capability: String }, { errorMessage: 'invalid capability' });

	return Meteor.users.updateAsync(userId, { $pull: { capabilities: capability } });
};
