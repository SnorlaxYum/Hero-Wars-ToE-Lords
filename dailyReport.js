const { client } = require("./utils/discord")
const { weekJudge, dailyComboQuery } = require("./utils/common")

let ready = false

// ready
client.on("ready", () => {
    console.log(`${client.user.tag} is gonna send the daily report!`)
    const { week, weekday } = weekJudge()
    let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'toe-daily')
    if (!channels) return
    if (!ready && channels) {
        ready = true
        new Promise(resolve => {
            let pros = []
            channels.forEach((channel, index) => {
                dailyComboQuery(week, weekday)
                    .then(res => {
                        if (typeof res === "string") {
                            pros.push(channel.send(res))
                        } else {
                            pros.push(channel.send(res[0] + '\n' + res[1][0].join('\n')))
                            for (let i = 1; i < res[1].length; i++) {
                                pros.push(channel.send(res[1][i].join('\n')))
                            }
                        }
                        if(index === channels.length-1) {
                            resolve(pros)
                        }
                    }, rej => {
                        pros.push(channel.send(rej))
                        if(index === channels.length-1) {
                            resolve(pros)
                        }
                    })
                    .catch(e => {
                        console.error(e)
                        pros.push(channel.send("An internal error happened."))
                        if(index === channels.length-1) {
                            resolve(pros)
                        }
                    })
            })
        }).then(pros => {
            Promise.all(pros).then(process.exit)
        })
    }
})
