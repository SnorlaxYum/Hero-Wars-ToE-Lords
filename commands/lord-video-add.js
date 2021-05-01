const { addLordVideo, comboParser, getVideoShortcut } = require("../utils/common")
const { timeoutDeleteMessage, adminPermission } = require("../utils/discord")

module.exports = {
    name: "lord-video-add",
    syntax: "lord-video-add[+++]<lord>[+++]<combo>[+++]<player>[+++]<attackingCombo>[+++]<point>[+++]<uri>",
    example: "lv+[+++]Earth[+++]hy,ma,sy,ed,an[+++]Ardor on Youtube[+++]4ear[+++]250[+++]https://youtu.be/m2z0d6JI9L0?t=5",
    alias: ["lordv+", "lv+"],
    description: "Add a lord video",
    /**
     * add a lord video
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (adminPermission(msg)) {
            if(args.length === 0 || args.length < 6) {
                timeoutDeleteMessage(msg, 'need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)', true)
            } else {
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

                addLordVideo(args, err => {
                    if (err) {
                        console.error(err.message)
                        if (err.message.indexOf("UNIQUE constraint failed") !== -1) {
                            timeoutDeleteMessage(msg, "the video is already in the database.", true)
                        } else {
                            timeoutDeleteMessage(msg, "an internal error happened.", true)
                        }
                    } else {
                        console.info(`A row has been inserted into video with uri ${args[5]}`)
                        timeoutDeleteMessage(msg, `successfully added the video for ${args[1]} from ${args[2]}`, true)
                    }
                })
            }
        } else {
            timeoutDeleteMessage(msg, "sorry, you have no permissions to complete this action.", true)
        }
    }
}