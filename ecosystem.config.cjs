// pm2 ecosystem file for this app only. Every command in package.json
// references `--only vqbank` so other pm2 processes on this machine are
// never touched by start / stop / restart / delete.
//
// Must be CommonJS (.cjs) because package.json sets "type": "module".
module.exports = {
	apps: [
		{
			name: 'vqbank',

			// Built JS entry. Run `pnpm build` before `pnpm pm2:start`.
			script: 'dist/app.js',

			// Pin the interpreter to the same Node version `engines.node`
			// requires. This way the pm2 daemon itself can run under any
			// Node version (including the one your other apps need) and
			// only this app uses Node 22.
			interpreter: '/home/harshitrvpi/.nvm/versions/node/v22.22.3/bin/node',

			// Load env vars natively via Node 22's --env-file, replacing
			// env-cmd in production. Keeps secrets out of the pm2 dump.
			node_args: '--env-file=./env/prod.env',

			cwd: __dirname,

			// Fork mode (single Node process). pm2 cluster mode + ESM
			// (`"type": "module"` in package.json) bootstraps unreliably
			// — workers die silently in pm2's CommonJS wrapper before
			// the app code runs. Sessions live in MongoDB so cluster
			// would have been safe in theory, but on a small host
			// shared with other apps the single-process model is also
			// cheaper. If you ever need to scale, the proper fix is
			// putting the app in front of an nginx upstream block with
			// multiple fork instances on adjacent ports.
			exec_mode: 'fork',
			instances: 1,

			autorestart: true,
			watch: false,
			max_memory_restart: '500M',

			// Restart backoff: don't hammer Mongo if it's down at boot.
			min_uptime: '10s',
			max_restarts: 10,
			restart_delay: 2000,

			// Logs land under ./logs (already gitignored). pm2 creates the dir.
			out_file: 'logs/vqbank.out.log',
			error_file: 'logs/vqbank.err.log',
			merge_logs: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
		},
	],
};