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
      console.error(err.message)
    }
    console.log('Connected to the main database.')
  })
//   db.run('CREATE TABLE video(lord text, combo text, player text, attackingCombo text, point integer, uri text)')
})

function dailyComboQuery(week, weekday) {
    if(weekday > 5) {
        return 'ToE already ended...... (Note both messages will be deleted in 1 min)'
    } else {
        let sql = `SELECT lord, combo FROM combo WHERE week='${week}' AND day=${weekday};`
        db.all(sql, [], (err, rows) => {
            if (err) {
              throw err;
            }
            if(rows.length) {
                let combos = [`**Week ${week}, Day ${weekday}:**`, ...rows.map(row => `${row.lord} Lord: ${row.combo}`), '(Note both messages will be deleted in 1 min)']
                return combos.join('\n')
            } else {
                return 'Not found, there are only 3 weeks (A, B, C) in a cycle and 5 days (1-5) in a week.\n(Note both messages will be deleted in 1 min)'
            }
        })
    }
}

client.on("message", msg => {
    function replyQueryMessages(content, timeout=60*1000) {
        msg.reply(content).then(reply => {
            reply.delete({timeout})
                .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                .catch(console.error)
            msg.delete({timeout})
                .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                .catch(console.error)
        })
    }
    if (msg.content === "!ping") {
        msg.reply("pong");
    } else if (msg.content === "!lord-time") {
        const {week, weekday} = weekJudge()
        replyQueryMessages(`Week ${week<1 ? 'A' : week < 2 ? 'B': 'C'} Day ${parseInt(weekday)+1}\n(Note both messages will be deleted in 1 min)`)
    } else if (msg.content.startsWith("!lord-daily-combo")) {
        const comboArray = msg.content.split(" ").slice(1)
        if(comboArray.length === 0) {
            const {week, weekday} = weekJudge()
            dailyComboQuery(week, weekday)
            try {
                replyQueryMessages(dailyComboQuery(week, weekday))
            } catch {
                console.error()
            }
        } else if(comboArray.length === 2) {
            const [week, weekday] = comboArray
            try {
                replyQueryMessages(dailyComboQuery(week, weekday))
            } catch {
                console.error()
            }
        } else {
            replyQueryMessages("Daily combo support only 0 or 2 parameters.")
        }
    }
})

try{
    client.login(process.env.TOKEN).then(res => {
        console.log("Request success")
        setInterval(() => {
            const {week, weekday, time} = weekJudge()
            let channel = client.channels.cache.find(ch => ch.name === 'toe-daily')
            if(!channel) return
            if(channel && time === 0) {
                try {
                    channel.send(dailyComboQuery(week, weekday))
                } catch {
                    console.error()
                }
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