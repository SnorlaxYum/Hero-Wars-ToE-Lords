const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("../common")
const { replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermission } = require("../discord")

module.exports = {
    name: "lord-video-add",
    syntax: "lord-video-add[+++]<lord>[+++]<combo>[+++]<player>[+++]<attackingCombo>[+++]<point>[+++]<uri>",
    description: "Current time in Lord Format",
    /**
     * add a lord video
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (adminPermission(msg.member)) {
            args[0] = /\w+/.exec(args[0])[0]
            if (args[0] !== "All") {
                try {
                    args[1] = comboParser(args[1])
                    args[3] = comboParser(args[3])
                } catch (e) {
                    return msg.reply(e.message)
                }
            }
            args[4] = parseInt(args[4])

            // video uri convert
            let videoFinaluri = getVideoShortcut(args[5])
            args[5] = videoFinaluri[0]
            args.push(videoFinaluri[1])

            if (args.length < 6) {
                msg.reply('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
            } else {
                addLordVideo(args, err => {
                    if (err) {
                        console.error(err.message)
                        if (err.message.indexOf("UNIQUE constraint failed") !== -1) {
                            msg.reply("the video is already in the database.")
                        } else {
                            msg.reply("an internal error happened.")
                        }
                    } else {
                        console.info(`A row has been inserted into video with uri ${args[5]}`)
                        msg.reply(`successfully added the video for ${args[1]} from ${args[2]}`)
                    }
                })
            }
        } else {
            msg.reply("sorry, you have no permissions to complete this action.")
        }
    }
}