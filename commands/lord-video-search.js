const { lordVideoWithGivenCombo } = require("../utils/common")
const { timeoutDeleteMessage } = require("../utils/discord")

module.exports = {
    name: "lord-video-search",
    syntax: "lord-video-search[+++]<combo>[+++]<combo2>[+++]......",
    alias: ["lvs"],
    example: "lvs[+++]an, sy, 3 su[+++]3 su,si,no",
    description: "Lord videos where the given combos appear. (also support a single combo)",
    /**
     * return the lord videos where the given combo appears
     * @param {String} args command arguments
     * @param {Discord.Message} msg query message
     */
    exec(args, msg) {
        if (args.length > 0) {
            try {
                lordVideoWithGivenCombo(args).then(res => {
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
            timeoutDeleteMessage(msg, "daily combo search support 1 parameter at a time.", true)
        }
    }
}