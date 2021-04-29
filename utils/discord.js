const Discord = require("discord.js")
const client = new Discord.Client()
const adminRoles = require("../adminRoles")

try {
    client.login(process.env.TOKEN).then(res => {
        console.info("Login Request success")
    }, rej => {
        console.info("Request rejection")
        console.error(rej)
    })
} catch (e) {
    console.info("Request error")
    console.error(e)
}

/**
 * judge timeout number
 * @param {Discord.Message} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted if they're in a channel not intended for bots
 */
function judgeTimeout(msg, timeout) {
    if (msg.channel.name.startsWith('bot-command')) {
        return -1
    }
    return timeout
}

/**
 * judge timeout number and decide whether to delete the messages after the timeout
 * @param {Discord.Message} msg query message
 * @param {Object|String} content the content of the message to be sent
 * @param {Boolean} isReply whether the message to be sent is a reply message or not
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function timeoutDeleteMessage(msg, content, isReply=false, delNotification=true, timeout = 60 * 1000) {
    timeout = judgeTimeout(msg, timeout)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    if(isReply) {
        msg.reply(content).then(reply => {
            if (timeout > 0) {
                reply.delete({ timeout })
                    .then(msg1 => console.info(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => console.error(e))
                msg.delete({ timeout })
                    .then(msg1 => console.info(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => console.error(e))
            }
        })
    } else {
        msg.channel.send(content).then(msg2 => {
            if (timeout > 0) {
                msg2.delete({ timeout })
                    .then(msg1 => console.info(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => console.error(e, 'error'))
                msg.delete({ timeout })
                    .then(msg1 => console.info(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => console.error(e))
            }
        })
    }
}

/**
 * see if the querying person has the permission to delete or add videos
 * @param {Discord.Message} msg query message
 */
function adminPermission(msg) {
    const rolesList = Array.from(msg.member.roles.cache.values()).map(i => i.name)
    return adminRoles.filter(admin => rolesList.indexOf(admin.name) !== -1).filter(admin => admin.guildId === msg.member.guild.id).length > 0
}
module.exports = { Discord, client, timeoutDeleteMessage, adminPermission }