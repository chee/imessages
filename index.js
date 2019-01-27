#!/usr/bin/env -S node -r esm
import {homedir} from "os"
import path from "path"
import Knex from "knex"
import yargs from "yargs"

let applepoch = new Date("2001-01-01").getTime()

let convertAppleDateToIsoDate = date =>
	new Date(applepoch + date / 1000000).toISOString()

// let convertIsoDateToAppleDate = date =>
// 	new Date(date - applepoch).getTime() * 1000000

// The file is always in the same place, and while it would be good to be able
// to take another database other than the live one (one you’ve backed up, or
let databasePath = path.resolve(
	homedir(),
	"Library",
	"Messages",
	"chat.db"
)

let knex = Knex({
	client: "sqlite3",
	useNullAsDefault: true,
	connection: {
		filename: databasePath
	}
})

let get = field => item => item[field]

let getId = get("id")

yargs
	.command({
		command: "extract <handle> [name] [me]",
		describe: "extract messages for a handle",
		// aliases: ["$0"],
		builder (yargs) {
			return yargs
				.positional(
					"handle",
					{
						describe: "the handle whümfs messages to extract",
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
		command: "list-handles",
		aliases: ["handles"],
		describe: "list handles (like, contacts) from the database",
		async handler () {
			await knex
				.select("*")
				.from("handle")
				.map(getId)
				.then(handles => handles.forEach(handle => console.info(handle)))
			process.exit()
		}
	})
	.demandCommand(1, "you gotta chose a command")
	.help()
	.wrap(yargs.terminalWidth())
	.argv

async function extract (argv) {
	let handle = argv.handle.trim()

	let messages = await knex
		.select([
			"text",
			"is_from_me",
			"date",
			"service",
		])
		.from("message")
		.whereIn(
			"handle_id",
			knex
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

	console.info(JSON.stringify(messages, 0, "\t"))
	process.exit()
}
