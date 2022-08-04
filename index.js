#!/usr/bin/env node
import Knex from "knex"
import yargs from "yargs"

// apple have made their own epoch, the first of jan 2001
let applepoch = new Date("2001-01-01").getTime()

// they save their dates in microseconds since that epoch, so we add their
// epoch to the date and divide it by a million to make it like a unix date,
// which is the number of seconds since 1970-01-01
let convertAppleDateToIsoDate = date => {
	return new Date(applepoch + date / 1000000).toISOString()
}

let get = field => item => item[field]

let getId = get("id")

function getKnex() {
	let knex
	return function (filename) {
		if (!knex) {
			knex = Knex({
				client: "sqlite3",
				useNullAsDefault: true,
				connection: {
					filename
				}
			})
		}
		return knex
	}
}

let knex = getKnex()

yargs
	.command({
		command: "extract <database> <handle> [name] [me]",
		describe: "extract messages for a handle",
		builder (yargs) {
			return yargs
				.positional(
					"database",
					{
						describe: "chat.db (found at ~/Library/Messages/chat.db)",
						type: "string"
					}
				)
				.positional(
					"handle",
					{
						describe: "the handle whose messages to extract (see list-handles)",
						type: "string"
					}
				)
				.positional(
					"name",
					{
						describe: "the name to use for `handle`",
						type: "string"
					}
				)
				.positional(
					"me",
					{
						describe: "the name to use for `me`",
						type: "string",
						default: "me"
					}
				)
		},
		handler: extract
	})
	.command({
		command: "list-handles <database>",
		aliases: ["handles"],
		describe: "list handles (like, contacts) from the database",
		builder (yargs) {
			return yargs
				.positional(
					"database",
					{
						describe: "chat.db (found at ~/Library/Messages/chat.db)",
						type: "string"
					}
				)
		},
		async handler (argv) {
			await knex(argv.database)
				.select("*")
				.from("handle")

				.then(handles => handles.forEach(handle => process.stdout.write(handle.id + "\n")))
			process.exit()
		}
	})
	.demandCommand(1, "you gotta chose a command")
	.help()
	.wrap(yargs.terminalWidth())
	.argv

async function extract (argv) {
	let handle = argv.handle.trim()

	let messages = await knex(argv.database)
		.select([
			"text",
			"is_from_me",
			"date",
			"service",
		])
		.from("message")
		.whereIn(
			"handle_id",
			knex(argv.database)
				.select("ROWID")
				.from("handle")
				.where({
					id: handle
				})
		)
		.orderBy("date", "asc")
		.then(messages => {
			messages.forEach(message => {
				message.date = convertAppleDateToIsoDate(message.date)
				message.from = message.is_from_me ? argv.me : argv.name
				message.to = message.is_from_me ? argv.name : argv.me
				delete message.is_from_me
			})

			return messages

		})

	process.stdout.write(JSON.stringify(messages, 0, "\t") + "\n")
	process.exit()
}
