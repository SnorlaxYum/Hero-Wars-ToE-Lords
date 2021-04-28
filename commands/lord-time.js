const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("../utils/common")
const { replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermission } = require("../utils/discord")

module.exports = {
    name: "lord-time",
    syntax: "lord-time",
    description: "Current time in Lord Format",
    /**
     * add a lord video
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
        let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        msg.reply(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
    }
}