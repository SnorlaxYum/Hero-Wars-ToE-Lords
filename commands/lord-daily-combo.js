const { dailyComboQuery, weekJudge } = require("../utils/common")
const { timeoutDeleteMessage } = require("../utils/discord")

module.exports = {
    name: "lord-daily-combo",
    syntax: "lord-daily-combo <timeString>",
    example: "ld 2021-04-05T13:00:00+0800",
    alias: ["daily-lord", "lord-daily", "lord-combo", "lord-combo-daily", "lord-daily-video", "toe-lords", "toe-daily-lord", "toe-lord-daily", "toe-lord-combo", "ld"],
    description: "Lord combos in a specific lord day (or today if no arg is specified)",
    /**
     * check the daily lord combo according to the given date
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (args.length <= 1) {
            let week, weekday, date
            if (args.length === 0) {
                date = weekJudge()
                week = date.week
                weekday = date.weekday
            } else {
                try {
                    date = weekJudge(args[0])
                } catch(e) {
                    throw e
                }
                week = date.week
                weekday = date.weekday
            }
            
            try {
                dailyComboQuery(week, weekday).then(res => {
                    if (typeof res === "string") {
                        timeoutDeleteMessage(msg, res, true)
                    } else {
                        timeoutDeleteMessage(msg, res[0] + '\n' + res[1][0].join('\n'), true, false)
                        for (let i = 1; i < res[1].length; i++) {
                            timeoutDeleteMessage(msg, res[1][i].join('\n'), false, i+1 === res[1].length ? true : false)
                        }
                    }
                }, rej => {
                    timeoutDeleteMessage(msg, rej, true)
                })
            } catch(e) {
                throw e
            }
        } else {
            timeoutDeleteMessage(msg, "daily combo support only no more than 1 parameters.", true)
        }
    }
}