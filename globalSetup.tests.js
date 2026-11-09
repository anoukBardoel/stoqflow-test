import { Meteor } from 'meteor/meteor';
import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { ROLE_CAPABILITIES } from '/imports/app/roles/capabilities';

//make assert.isRejected available for async method tests
use(chaiAsPromised);

before(async function globalSetup() {
	await Meteor.users.removeAsync({});

	//make a test user with all capabilities
	await Meteor.users.insertAsync({
		_id: 'CARRENTASERXXXXXX',
		username: 'test-admin-user',
		emails: [
			{
				address: 'test-admin@stokpad.local',
				verified: true
			}
		],
		role: 'admin',
		capabilities: ROLE_CAPABILITIES.admin
	});

	//make a test user that only has the read capabilities
	await Meteor.users.insertAsync({
		_id: 'TESTUSERXXXXXXXXX',
		username: 'test-readonly-user',
		emails: [
			{
				address: 'test-readonly@stokpad.local',
				verified: true
			}
		],
		role: 'readonly',
		capabilities: ROLE_CAPABILITIES.readonly
	});

	//make a test user without any capabilities
	await Meteor.users.insertAsync({
		_id: 'NOACCESSUSERXXXXX',
		username: 'test-nocaps-user',
		emails: [
			{
				address: 'test-nocaps@stokpad.local',
				verified: true
			}
		],
		role: 'guest',
		capabilities: []
	});

	console.warn('GLOBAL TESTS SETUP DONE');
});
