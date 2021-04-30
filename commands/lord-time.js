const { weekJudge } = require("../utils/common")
const { timeoutDeleteMessage } = require("../utils/discord")

module.exports = {
    name: "lord-time",
    syntax: "lord-time <timeString>",
    example: "lc 2021-04-05T13:00:00+0800",
    alias: ["toe-time", "toe-clock", "lord-clock", "tc", "lc"],
    description: "given time (current time if no argument is given to the command) in Lord Time Format.",
    /**
     * add a lord video
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        const padNum = num => String(num).padStart(2, "0")
        let week, weekday, time
        try {
            let curPos = args[0] ? weekJudge(args[0]) : weekJudge()
            week = curPos.week
            weekday = curPos.weekday
            time = curPos.time
        } catch(e) {
            throw e
        }
        let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        timeoutDeleteMessage(msg, `Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`, true) 
    }
}