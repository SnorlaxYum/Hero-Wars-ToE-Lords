const Discord = require("discord.js")
const client = new Discord.Client()
const { logger } = require("./log")
const {adminRoles} = require("../adminRoles.json")

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

/**
 * reply a query message (both query message and reply messages will be deleted if a timeout is specified)
 * @param {Object|String} content discord message
 * @param {Number} timeout after this number of ms the messages will be deleted
 * @param {Object} msg query message
 */
function replyQueryMessagesImport(content, timeout, msg) {
    msg.reply(content).then(reply => {
        if (timeout > 0) {
            reply.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
            msg.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
        }
    })
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if a timeout is specified)
 * @param {Object|String} content discord message
 * @param {Number} timeout after this number of ms the messages will be deleted
 * @param {Object} msg query message
 */
function sendMessagesImport(content, timeout, msg) {
    msg.channel.send(content).then(msg2 => {
        if (timeout > 0) {
            msg2.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e, 'error'))
            msg.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
        }
    })
}

/**
 * judge timeout number
 * @param {Number} timeout after this number of ms the messages will be deleted if they're in a channel not intended for bots
 * @param {Object} msg query message
 */
function judgeTimeoutImport(timeout, msg) {
    if (msg.channel.name.startsWith('bot-command')) {
        return -1
    }
    return timeout
}

/**
 * reply a query message (both query message and reply messages will be deleted if the obtained timeout is positive )
 * @param {Object|String} content discord message 
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Object} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function replyQueryMessagesWrapperImport(content, delNotification=true, msg, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(timeout)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    replyQueryMessagesImport(content, timeout, msg)
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if the obtained timeout is positive)
 * @param {Object|String} content discord message 
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Object} msg query message
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function sendMessagesWrapperImport(content, delNotification=true, msg, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(timeout)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    sendMessagesImport(content, timeout, msg)
}

/**
 * see if the querying person has the permission to delete or add videos
 * @param {Object} msg query message
 */
function adminPermissionImport(msg) {
    const rolesList = Array.from(msg.member.roles.cache.values()).map(i => i.name), guildId = msg.member.guild.id
    return adminRoles.filter(admin => rolesList.indexOf(admin.name) !== -1).filter(admin => admin.guildId === guildId).length > 0
}

module.exports = { Discord, client, replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermissionImport }