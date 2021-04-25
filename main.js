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

function replyQueryMessages(msg, content, timeout) {
    if(msg.reply){
        msg.reply(content).then(reply => {
            reply.delete({timeout})
                .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                .catch(console.error)
            msg.delete({timeout})
                .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                .catch(console.error)
        })
    }
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  db = new sqlite3.Database('./main.db', (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to the main database.')
  })
//   db.run('CREATE TABLE video(lord text, combo text, player text, attackingCombo text, point integer, uri text)')
})

client.on("message", msg => {
    if (msg.content === "!ping") {
        msg.reply("pong");
    } else if (msg.content === "!lord-time") {
        const {week, weekday} = weekJudge()
        msg.reply(`Week ${week<1 ? 'A' : week < 2 ? 'B': 'C'} Day ${parseInt(weekday)+1}`)
    } else if (msg.content.startsWith("!lord-daily-combo")) {
        const comboArray = msg.content.split(" ").slice(1)
        if(comboArray.length === 0) {
            const {week, weekday} = weekJudge()
            if(weekday >=5) {
                msg.reply('ToE already ended...... (Note both messages will be deleted in 1 min)').then(reply => {
                    reply.delete({timeout})
                        .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                        .catch(console.error)
                    msg.delete({timeout})
                        .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                        .catch(console.error)
                })
            } else {
                let sql = `SELECT lord, combo FROM combo WHERE week=${week}, day=${weekday};`
                db.all(sql, [], (err, rows) => {
                    if (err) {
                      throw err;
                    }
                    let combos = [`**Week ${week}, Day ${weekday}:**`, ...rows.map(row => `${row.lord} Lord: ${row.combo}`), '(Note both messages will be deleted in 1 min)']
                    replyQueryMessages(msg, combos.join('\n'), 60*1000)
                })
            }
        }
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