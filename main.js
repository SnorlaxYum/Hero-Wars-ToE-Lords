const { client } = require("./utils/discord")
const {commandCenter} = require("./utils/command")

// ready
client.on("ready", () => {
    console.info(`Logged in as ${client.user.tag}!`)
})

// query
client.on("message", msg => {
    if(msg.author.bot) {
        return
    }
    commandCenter(msg)
})
