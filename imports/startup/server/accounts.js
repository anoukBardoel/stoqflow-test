import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { setUserRole } from '/imports/app/roles/tools';
import { ROLE_CAPABILITIES } from '/imports/app/roles/capabilities';

Meteor.startup(async function accountsStartup() {
	//the seed brings its own demo users, stay out of its way
	if (process.env.SEED === 'true') return;

	//refresh the capability snapshot of every user from their role, so role
	//changes do not have to be pushed manually onto every user document
	const knownRoles = Object.keys(ROLE_CAPABILITIES),
		roleUsers = await Meteor.users.find({
			role: {
				$in: knownRoles
			}
		}, {
			fields: {
				role: 1
			}
		}).fetchAsync();

	await Promise.all(roleUsers.map(user => setUserRole({ userId: user._id, role: user.role })));

	//create a default admin when there are no users yet
	if ((await Meteor.users.find().countAsync()) === 0) {
		const userId = await Accounts.createUserAsync({
			username: 'admin',
			email: 'admin@stokpad.local',
			password: 'stokpad'
		});

		await setUserRole({ userId, role: 'admin' });
	}
});
