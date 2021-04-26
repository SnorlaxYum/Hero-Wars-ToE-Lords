const {client} = require("./discordLogin")
const {weekJudge, dailyComboQuery, recordActivity} = require("./main")

// ready
client.on("ready", () => {
    recordActivity(`Logged in as ${client.user.tag}!`)
})

try{
    client.login(process.env.TOKEN).then(res => {
        recordActivity("Login Request success")
        const {week, weekday, time} = weekJudge()
        let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'toe-daily')
        if(!channels) return
        if(channels) {
            channels.forEach(channel => {
                // dailyComboQuery(week, weekday).then(res => {
                //     if(typeof res === "string") {
                //         channel.send(res)
                //     } else {
                //         channel.send(res[0]+'\n'+res[1][0].join('\n'))
                //         for(let i = 1; i < res[1].length; i++) {
                //             channel.send(res[1][i].join('\n'))
                //         }
                //     }
                // }, rej => {
                //     channel.send(rej)
                // })
                channel.send(`test isolation, ${week}, ${weekday}`).then(msg => msg.delete())
            })
        }
    }, rej => {
        recordActivity("Request rejection")
        recordActivity(rej, 'error')
    })
} catch(e) {
    recordActivity("Request error")
    recordActivity(e, 'error')
}