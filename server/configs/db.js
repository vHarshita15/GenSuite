import { neon } from '@neondatabase/serverless'

let sql;
if (process.env.DATABASE_URL) {
	sql = neon(process.env.DATABASE_URL);
} else {
	sql = function () {
		return Promise.reject(new Error('No DATABASE_URL configured. Set DATABASE_URL to enable DB operations.'));
	};
}

export default sql;