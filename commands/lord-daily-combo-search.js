const { lordVideoWithGivenCombo } = require("../utils/common")
const { timeoutDeleteMessage } = require("../utils/discord")

module.exports = {
    name: "lord-daily-combo-search",
    syntax: "lord-daily-combo-search <combo>",
    alias: ["daily-lord", "lord-daily", "lord-combo", "lord-combo-daily", "lord-daily-video", "toe-lords", "toe-daily-lord", "toe-lord-daily", "toe-lord-combo", "ld"],
    description: "Lord videos where the given combo appears.",
    /**
     * return the lord videos where the given combo appears
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (args.length === 1) {
            lordVideoWithGivenCombo(args[0]).then(res => {
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
        } else {
            timeoutDeleteMessage(msg, "daily combo search support 1 parameter at a time.", true)
        }
    }
}