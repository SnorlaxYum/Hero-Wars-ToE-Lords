const { client } = require("./utils/discordUtil")
const { logger } = require("./utils/log")
const { weekJudge, dailyComboQuery } = require("./utils/util")

let ready = false

// ready
client.on("ready", () => {
    logger.log(`${client.user.tag} is gonna send the daily report!`)
    const { week, weekday } = weekJudge()
    let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'toe-daily')
    if (!channels) return
    if (!ready && channels) {
        ready = true
        channels.forEach(channel => {
            dailyComboQuery(week, weekday)
                .then(res => {
                    if (typeof res === "string") {
                        channel.send(res).then(process.exit)
                    } else {
                        let pros = [channel.send(res[0] + '\n' + res[1][0].join('\n'))]
                        for (let i = 1; i < res[1].length; i++) {
                            pros.push(channel.send(res[1][i].join('\n')))
                        }
                        Promise.all(pros).then(process.exit)
                    }
                }, rej => {
                    channel.send(rej).then(process.exit)
                })
                .catch(e => logger.error(e))
        })
    }
})
