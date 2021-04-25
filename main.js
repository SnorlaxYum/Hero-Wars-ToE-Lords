const Discord = require("discord.js")
const client = new Discord.Client()
const sqlite3 = require('sqlite3').verbose()
let db

function weekJudge() {
    let pos = (new Date() - new Date('2021-04-12T13:00:00+0800'))
    let week = pos / (7* 24 * 60 * 60 * 1000) % 3
    let weekday = (new Date() - new Date('2021-04-12T13:00:00+0800')) % (7* 24 * 60 * 60 * 1000) / (24*60*60*1000)
    let time = (new Date() - new Date('2021-04-12T13:00:00+0800')) % (7* 24 * 60 * 60 * 1000) % (24*60*60*1000)
    return {week, weekday, time}
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  db = new sqlite3.Database('./main.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the main database.');
  });
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
            const {week, weekday, time} = weekJudge()
            let channel = client.channels.cache.find(ch => ch.name === 'toe-daily')
            if(!channel) return
            if(channel && time === 0) channel.send(`Week ${week<1 ? 'A' : week < 2 ? 'B': 'C'} Day ${parseInt(weekday)+1}`)
        }, 1000)
    }, rej => {
        console.log("Request rejection")
        console.error(rej)
    })
} catch(e) {
    console.log("Request error")
    console.dir(e)
}