const Discord = require("discord.js")
const client = new Discord.Client()
const { logger } = require("./log")
const adminRoles = require("../adminRoles")

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
 * @param {Function} mreply
 * @param {Function} mdel
 */
function replyQueryMessagesImport(content, timeout, mreply, mdel) {
    mreply(content).then(reply => {
        if (timeout > 0) {
            reply.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
            mdel({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
        }
    })
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if a timeout is specified)
 * @param {Object|String} content discord message
 * @param {Number} timeout after this number of ms the messages will be deleted
 * @param {Object} channel
 * @param {Function} mdel
 */
function sendMessagesImport(content, timeout, channel, mdel) {
    channel.send(content).then(msg2 => {
        if (timeout > 0) {
            msg2.delete({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e, 'error'))
            mdel({ timeout })
                .then(msg1 => logger.info(`Deleted message from ${msg1.author.username}.`))
                .catch(e => logger.error(e))
        }
    })
}

/**
 * judge timeout number
 * @param {Number} timeout after this number of ms the messages will be deleted if they're in a channel not intended for bots
 * @param {Object} channel
 */
function judgeTimeoutImport(timeout, channel) {
    if (channel.name.startsWith('bot-command')) {
        return -1
    }
    return timeout
}

/**
 * reply a query message (both query message and reply messages will be deleted if the obtained timeout is positive )
 * @param {Object|String} content discord message 
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Object} channel
 * @param {Function} mreply
 * @param {Function} mdel
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function replyQueryMessagesWrapperImport(content, delNotification=true, channel, mreply, mdel, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(timeout, channel)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    replyQueryMessagesImport(content, timeout, mreply, mdel)
}

/**
 * send a message after a query message is sent (both query message and reply messages will be deleted if the obtained timeout is positive)
 * @param {Object|String} content discord message 
 * @param {Boolean} delNotification whether to show delete notification text
 * @param {Object} channel
 * @param {Function} mdel
 * @param {Number} timeout after this number of ms the messages will be deleted if the obtained timeout is positive
 */
function sendMessagesWrapperImport(content, delNotification=true, channel, mdel, timeout = 60 * 1000) {
    timeout = judgeTimeoutImport(timeout, channel)
    if (timeout >= 0 && delNotification) {
        if (typeof content === "string")
            content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        else
            content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
    }
    sendMessagesImport(content, timeout, channel, mdel)
}

/**
 * see if the querying person has the permission to delete or add videos
 * @param {Object} member
 * @param {String} guildId
 */
function adminPermissionImport(rolesValues, guildId) {
    const rolesList = Array.from(rolesValues).map(i => i.name)
    return adminRoles.filter(admin => rolesList.indexOf(admin.name) !== -1).filter(admin => admin.guildId === guildId).length > 0
}
module.exports = { Discord, client, replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermissionImport }