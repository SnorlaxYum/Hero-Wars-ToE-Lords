const Discord = require("discord.js")
const client = new Discord.Client()
const sqlite3 = require('sqlite3').verbose()
let db

// judge the position of the day in a ToE cycle
function weekJudge() {
    let pos = (new Date() - new Date('2021-04-12T13:00:00+0800'))
    let week = pos / (7 * 24 * 60 * 60 * 1000) % 3
    week = week < 1 ? 'A' : week < 2 ? 'B': 'C'
    let weekday = parseInt(pos % (7 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)) + 1
    let time = pos % (7 * 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000)
    return {week, weekday, time}
}

// ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  db = new sqlite3.Database('./main.db', (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to the main database.')
  })
  db.run('CREATE TABLE IF NOT EXISTS video(lord text, combo text, player text, attackingCombo text, point integer, uri text)')
})

/**
 * Query the daily lord combos
 * @param {String} week week
 * @param {Number} weekday day in a week, starting from 1
 */
function dailyComboQuery(week, weekday) {
    return new Promise((resolve, reject) => {
        if(weekday > 5) {
            resolve('ToE already ended......')
        } else {
            let sql = `SELECT lord, combo FROM combo WHERE week='${week}' AND day=${weekday};`
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(`Error: ${err}`)
                }
                if(rows.length) {
                    let combos = [`**Week ${week}, Day ${weekday}:**`], promises = []
                    rows.forEach(row => {
                        combos.push(`${row.lord} Lord: ${row.combo}`)
                        promises.push(new Promise(res => {
                            db.all(`SELECT lord, combo, player, attackingCombo, point, uri FROM video WHERE combo='${row.combo}';`, [], (err2, rows2) => {
                                if (err2) {
                                    res(`Error: ${err2}`)
                                }
                                res(rows2)
                            })
                        }))
                    })
                    Promise.all(promises).then(videos => {
                        videos = videos.filter(video => typeof video === "object").reduce((a, b) => a.concat(b))
                        if(videos.length > 0) {
                            combos.push('', 'Maxed versions:')
                            videos.forEach(video => {
                                combos.push(`**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`)
                            })
                        }
                        resolve(combos.join('\n'))
                    })
                } else {
                    resolve('Not found, there are only 3 weeks (A, B, C) in a cycle and 5 days (1-5) in a week.')
                }
            })
        }
    })
}

// query
client.on("message", msg => {
    function replyQueryMessages(content, timeout) {
        msg.reply(content).then(reply => {
            if(timeout > 0) {
                reply.delete({timeout})
                    .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                    .catch(console.error)
                msg.delete({timeout})
                    .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                    .catch(console.error)
            }
        })
    }
    function sendMessages(content, timeout) {
        msg.channel.send(content).then(msg2 => {
            if(timeout > 0) {
                msg2.delete({timeout})
                    .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                    .catch(console.error)
                msg.delete({timeout})
                    .then(msg1 => console.log(`Deleted message from ${msg1.author.username}.`))
                    .catch(console.error)
            }
        })
    }
    function judgeTimeout(timeout) {
        if(msg.channel.name.startsWith('bot-command')) {
            return -1
        }
        return timeout
    }
    function replyQueryMessagesWrapper(content, timeout=60*1000) {
        timeout = judgeTimeout(timeout)
        if(timeout >= 0) {
            if(typeof content === "string")
                content += `\n\n(Note both messages will be deleted in ${timeout}ms)`
            else
                content.description += `\n\n(Note both messages will be deleted in ${timeout}ms)`
        }
        replyQueryMessages(content, timeout)
    }
    function sendMessagesWrapper(content, timeout=60*1000) {
        timeout = judgeTimeout(timeout)
        if(timeout >= 0) {
            if(typeof content === "string")
                content += `\n\n(Note both messages will be deleted in ${timeout}ms)`
            else
                content.description += `\n\n(Note both messages will be deleted in ${timeout}ms)`
        }
        sendMessages(content, timeout)
    }
    if (msg.content === "!ping") {
        msg.reply("pong");
    } else if (msg.content.startsWith("!lord-video-add")) {
        const videoArray = msg.content.split("[+++]").slice(1)
        videoArray[4] = parseInt(videoArray[4])
        if(videoArray.length < 6) {
            replyQueryMessagesWrapper('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri)')
        } else {
            db.run(`INSERT INTO video(lord, combo, player, attackingCombo, point, uri) VALUES(?, ?, ?, ?, ?, ?)`, videoArray, function(err) {
                if (err) {
                return console.log(err.message);
                }
                // get the last insert id
                console.log(`A row has been inserted with rowid ${this.lastID}`)
                replyQueryMessagesWrapper(`Successfully added the video for ${videoArray[1]} from ${videoArray[2]}`)
            })
        }
    } else if (msg.content === "!lord-time") {
        const {week, weekday, time} = weekJudge(), padNum = num => String(num).padStart(2, "0")
        let timeTotalSec = parseInt(time/1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        replyQueryMessagesWrapper(`Week ${week} Day ${weekday} ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
    } else if (msg.content.startsWith("!lord-daily-combo")) {
        const comboArray = msg.content.split(" ").slice(1)
        if(comboArray.length === 0) {
            const {week, weekday} = weekJudge()
            dailyComboQuery(week, weekday).then(res => {
                replyQueryMessagesWrapper(res)
            }, rej => {
                replyQueryMessagesWrapper(rej)
            })
        } else if(comboArray.length === 2) {
            const [week, weekday] = comboArray
            dailyComboQuery(week, weekday).then(res => {
                replyQueryMessagesWrapper(res)
            }, rej => {
                replyQueryMessagesWrapper(rej)
            })
        } else {
            replyQueryMessagesWrapper("Daily combo support only 0 or 2 parameters.")
        }
    } else if(msg.content.startsWith("!help")) {
        let params = msg.content.split(' ').slice(1), things = [
            {command: `!lord-time`, description: `Current time in Lord Format`},
            {command: `!lord-daily-combo`, description: `Lord Combos now.`},
            {command: `!lord-daily-combo <Week> <WeekDay>`, description: `Lord Combos in a specific lord day.`},
            {command: `!lord-video-add <lord> <combo> <player> <attackingCombo> <point> <uri>`, description: `Add Lord Videos.`},
        ]
        if(params.length === 0) {
            let newMsg = new Discord.MessageEmbed()
                            .setTitle("Commands Help")
                            .setDescription(
                                `${things.map((thing, index) => `${index+1}. \`${thing.command}\`\n${thing.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
                            )
            sendMessagesWrapper(newMsg)
        } else {
            let results = things.filter(thing => params.map(param => thing.command.indexOf(param) >= 0).reduce((a, b) => a || b)),
                newMsg = new Discord.MessageEmbed()
                            .setTitle(`Commands Containing ${params.join(", ")}`)
                            .setDescription(
                                `${results.map((thing, index) => `${index+1}. \`${thing.command}\`\n${thing.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
                            )
            sendMessagesWrapper(newMsg)
        }
    }
})

// about sending things at ToE start
try{
    client.login(process.env.TOKEN).then(res => {
        console.log("Request success")
        setInterval(() => {
            const {week, weekday, time} = weekJudge()
            let channels = [...client.channels.cache.values()].filter(ch => ch.name === 'toe-daily')
            if(!channels) return
            if(channels && time === 0) {
                channels.forEach(channel => {
                    dailyComboQuery(week, weekday).then(res => {
                        channel.send(res)
                    }, rej => {
                        channel.send(rej)
                    })
                })
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