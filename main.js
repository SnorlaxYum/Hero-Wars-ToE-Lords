const { client } = require("./utils/discord")
const { logger } = require("./utils/log")
const {commandCenter} = require("./utils/command")

// ready
client.on("ready", () => {
    logger.info(`Logged in as ${client.user.tag}!`)
})

// query
client.on("message", msg => {
    commandCenter(msg.content, msg.channel, msg.member, o => msg.reply(o), o => msg.delete(o))
})
