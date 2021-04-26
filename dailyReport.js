const {client} = require("./discordLogin")
const {recordLog} = require("./log")
const {weekJudge, dailyComboQuery} = require("./main")

// ready
client.on("ready", () => {
    recordLog(`Logged in as ${client.user.tag}!`)
})

try{
    client.login(process.env.TOKEN).then(res => {
        recordLog("Login Request success")
        const {week, weekday} = weekJudge()
        let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'toe-daily')
        if(!channels) return
        if(channels) {
            channels.forEach(channel => {
                dailyComboQuery(week, weekday).then(res => {
                    if(typeof res === "string") {
                        channel.send(res)
                    } else {
                        channel.send(res[0]+'\n'+res[1][0].join('\n'))
                        for(let i = 1; i < res[1].length; i++) {
                            channel.send(res[1][i].join('\n'))
                        }
                    }
                }, rej => {
                    channel.send(rej)
                })
            })
        }
    }, rej => {
        recordLog("Request rejection")
        recordLog(rej, 'error')
    })
} catch(e) {
    recordLog("Request error")
    recordLog(e, 'error')
}