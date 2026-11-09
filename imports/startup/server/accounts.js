import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { setUserRole } from '/imports/app/roles/tools';

Meteor.startup(async function accountsStartup() {
	//the seed brings its own demo users, stay out of its way
	if (process.env.SEED === 'true') return;

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
