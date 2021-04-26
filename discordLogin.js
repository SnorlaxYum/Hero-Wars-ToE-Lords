const Discord = require("discord.js")
const client = new Discord.Client()
const { recordLog } = require("./log")

try {
    client.login(process.env.TOKEN).then(res => {
        recordLog("Login Request success")
    }, rej => {
        recordLog("Request rejection")
        recordLog(rej, 'error')
    })
} catch (e) {
    recordLog("Request error")
    recordLog(e, 'error')
}

module.exports = { Discord, client }