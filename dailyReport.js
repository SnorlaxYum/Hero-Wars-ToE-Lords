const {client} = require("./discordLogin")
const {recordLog} = require("./log")
const {weekJudge, dailyComboQuery} = require("./main")

let ready = false

// ready
client.on("ready", () => {
    recordLog(`Logged in as ${client.user.tag}!`)
    const {week, weekday} = weekJudge()
    let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'bot-commands')
    if(!channels) return
    if(!ready && channels) {
        ready = true
        channels.forEach(channel => {
            dailyComboQuery(week, weekday)
                .then(res => {
                    if(typeof res === "string") {
                        channel.send(res).then(process.exit)
                    } else {
                        let pros = [channel.send(res[0]+'\n'+res[1][0].join('\n'))]
                        for(let i = 1; i < res[1].length; i++) {
                            pros.push(channel.send(res[1][i].join('\n')))
                        }
                        Promise.all(process.exit)
                    }
                }, rej => {
                    channel.send(rej).then(process.exit)
                })
                .catch(e => recordLog(e, 'error'))
        })
    }
})