const Discord = require("discord.js")
const client = new Discord.Client()

try{
    client.login(process.env.TOKEN).then(res => {
        recordActivity("Login Request success")
    }, rej => {
        recordActivity("Request rejection")
        recordActivity(rej, 'error')
    })
} catch(e) {
    recordActivity("Request error")
    recordActivity(e, 'error')
}

module.exports = {Discord, client}