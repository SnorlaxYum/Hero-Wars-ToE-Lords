const Discord = require("discord.js")
const client = new Discord.Client()
const { logger } = require("./log")

try {
    client.login(process.env.TOKEN).then(res => {
        logger.info("Login Request success")
    }, rej => {
        logger.info("Request rejection")
        logger.error(rej)
    })
} catch (e) {
    logger.info("Request error")
    logger.error(e)
}

module.exports = { Discord, client }