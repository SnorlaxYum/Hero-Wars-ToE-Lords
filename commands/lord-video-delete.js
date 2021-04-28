const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("../utils/common")
const { replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermission } = require("../utils/discord")

module.exports = {
    name: "lord-video-delete",
    syntax: "lord-video-delete <uri>",
    description: "Current time in Lord Format",
    /**
     * delete lord videos from the given uris
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (adminPermission(msg.member)) {
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
                        if(res.changes === 0) {
                            console.error(`No video was deleted.`)
                            msg.reply(`no video was deleted.`)
                        } else if(res.changes === 1) {
                            console.info(`Successfully deleted the video whose uri is ${args.join(' or ')}`)
                            msg.reply(`successfully deleted the video whose uri is ${args.join(' or ')}`)
                        } else {
                            console.info(`Successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                            msg.reply(`successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                        }
                    }
                })
            }
        } else {
            msg.reply("sorry, you have no permissions to complete this action.")
        }
    }
}