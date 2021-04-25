const Discord = require("discord.js")
const client = new Discord.Client()

function weekJudge() {
    let pos = (new Date() - new Date('2021-04-12T13:00:00+0800'))
    let week = pos / (7* 24 * 60 * 60 * 1000) % 3
    let weekday = (new Date() - new Date('2021-04-12T13:00:00+0800')) % (7* 24 * 60 * 60 * 1000) / (24*60*60*1000)
    return {week, weekday}
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
    if (msg.content === "ping") {
        msg.reply("pong");
    } else if (msg.content === "lords") {
        const {week, weekday} = weekJudge()
        msg.reply(`Week ${week<1 ? 'A' : week < 2 ? 'B': 'C'} Day ${parseInt(weekday)+1}`)
    }
})

try{
    client.login(process.env.TOKEN).then(res => {
        console.log("Request success")
        console.dir(res)
        setInterval(() => {
            var guild = client.guilds.fetch(`s`)
            if(guild && guild.channels.get('744191975913422979')){
                guild.channels.get('744191975913422979').send("Good Morning");
            }
        }, 1000)
    }, rej => {
        console.log("Request rejection")
        console.error(rej)
    })
} catch(e) {
    console.log("Request error")
    console.dir(e)
}