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
 * reply a query message (both query message and reply messages will be deleted if a timeout is specified)
 * @param {Object|String} content sending content
 * @param {Discord.Message} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted
 */
function replyQueryMessagesImport(content, msg, timeout) {
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
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if a timeout is specified)
 * @param {Object|String} content discord message
 * @param {Discord.Message} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted
 */
function sendMessagesImport(content, msg, timeout) {
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

/**
 * judge timeout number
 * @param {Discord.Message} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted if they're in a channel not intended for bots
 */
function judgeTimeoutImport(msg, timeout) {
    if (msg.channel.name.startsWith('bot-command')) {
        return -1
    }
    return timeout
}

/**
 * reply a query message (both query message and reply messages will be deleted if the obtained timeout is positive )
 * @param {Object|String} content sending content 
 * @param {Discord.Message} msg query message
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function replyQueryMessagesWrapperImport(content, msg, delNotification=true, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(timeout, msg.channel)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    replyQueryMessagesImport(content, msg, timeout)
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if the obtained timeout is positive)
 * @param {Object|String} content discord message 
 * @param {Discord.Message} msg query message
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function sendMessagesWrapperImport(content, msg, delNotification=true, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(msg, timeout)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    sendMessagesImport(content, msg, timeout)
}

/**
 * see if the querying person has the permission to delete or add videos
 * @param {Discord.Message} msg query message
 */
function adminPermission(msg) {
    const rolesList = Array.from(msg.member.roles.cache.values()).map(i => i.name)
    return adminRoles.filter(admin => rolesList.indexOf(admin.name) !== -1).filter(admin => admin.guildId === msg.member.guild.id).length > 0
}
module.exports = { Discord, client, replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermission }