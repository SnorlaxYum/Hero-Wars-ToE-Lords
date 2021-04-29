const { deleteLordVideos, getVideoShortcut } = require("../utils/common")
const { timeoutDeleteMessage, adminPermission } = require("../utils/discord")

module.exports = {
    name: "lord-video-delete",
    syntax: "lord-video-delete <uri>",
    alias: ["lordv-", "lv-"],
    description: "Delete a lord video",
    /**
     * delete lord videos from the given uris
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (adminPermission(msg)) {
            if (args.length === 0) {
                msg.reply('this API needs at least one uri to complete')
            } else {
                args = args.map(uri => {
                    return getVideoShortcut(uri)[0]
                })
                deleteLordVideos(args, (err, res) => {
                    if (err) {
                        msg.reply(err.message)
                    } else {
                        if (res.changes === 0) {
                            console.error(`No video was deleted.`)
                            timeoutDeleteMessage(msg, `no video was deleted.`, true)
                        } else if (res.changes === 1) {
                            console.info(`Successfully deleted the video whose uri is ${args.join(' or ')}`)
                            timeoutDeleteMessage(msg, `successfully deleted the video whose uri is ${args.join(' or ')}`, true)
                        } else {
                            console.info(`Successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                            timeoutDeleteMessage(msg, `successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`, true)
                        }
                    }
                })
            }
        } else {
            timeoutDeleteMessage(msg, "sorry, you have no permissions to complete this action.", true)
        }
    }
}