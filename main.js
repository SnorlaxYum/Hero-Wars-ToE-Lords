const { client } = require("./utils/discord")
const {commandCenter} = require("./utils/command")

// ready
client.on("ready", () => {
    console.info(`Logged in as ${client.user.tag}!`)
})

// query
client.on("message", msg => {
    commandCenter(msg.content, msg.channel, msg.member, msg.reply, msg.delete)
})
