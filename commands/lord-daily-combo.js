const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("../utils/common")
const { replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermission } = require("../utils/discord")

module.exports = {
    name: "lord-daily-combo",
    syntax: "lord-daily-combo <Week> <WeekDay>",
    alias: ["lord-daily"],
    description: "Lord combos in a specific lord day (or today if no arg is specified)",
    /**
     * check the daily lord combo according to the given date
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (args.length === 0 || args.length === 2) {
            let week, weekday
            if (args.length === 0) {
                let date = weekJudge()
                week = date.week
                weekday = date.weekday
            } else {
                let [week1, weekday1] = args
                week = week1
                weekday = weekday1
            }
    
            dailyComboQuery(week, weekday).then(res => {
                if (typeof res === "string") {
                    msg.reply(res)
                } else {
                    msg.reply(res[0] + '\n' + res[1][0].join('\n'), false)
                    for (let i = 1; i < res[1].length; i++) {
                        msg.channel.send(res[1][i].join('\n'), i + 1 === res[1].length ? true : false)
                    }
                }
            }, rej => {
                msg.reply(rej)
            })
        } else {
            msg.reply("daily combo support only 0 or 2 parameters.")
        }
    }
}