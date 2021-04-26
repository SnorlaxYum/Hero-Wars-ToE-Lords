const adminRoles = require("./adminRoles.json")
const {Discord, client} = require("./discordLogin")
const sqlite3 = require('sqlite3').verbose()
let db

function recordActivity(message, severity='log') {
    // console[severity](`${new Date} - ${message}`)
    console[severity](message)
}

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
    recordActivity(`Logged in as ${client.user.tag}!`)
  db = new sqlite3.Database(process.env.DBPATH, (err) => {
    if (err) {
      recordActivity(err, 'error')
    }
    recordActivity('Connected to the main database.')
  })
  db.run('CREATE TABLE IF NOT EXISTS combo(week text, day integer, lord text, combo text UNIQUE);')
  db.run('CREATE TABLE IF NOT EXISTS video(lord text, combo text, player text, attackingCombo text, point integer, uri text UNIQUE);')
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
            let sql = `SELECT lord, combo FROM combo WHERE week=? AND day=?;`
            db.all(sql, [week, weekday], (err, rows) => {
                if (err) {
                    reject(`Error: ${err}`)
                }
                if(rows.length) {
                    let combos = [`**Week ${week}, Day ${weekday}:**`], promises = []
                    rows.forEach(row => {
                        combos.push(`${row.lord} Lord: ${row.combo}`)
                        promises.push(new Promise(res => {
                            db.all(`SELECT lord, combo, player, attackingCombo, point, uri FROM video WHERE combo=?;`, [row.combo], (err2, rows2) => {
                                if (err2) {
                                    res(`Error: ${err2}`)
                                }
                                res(rows2)
                            })
                        }))
                    })
                    promises.push(new Promise(res => {
                        db.all(`SELECT lord, combo, player, attackingCombo, point, uri FROM video WHERE lord=?;`, ["All"], (err2, rows2) => {
                            if (err2) {
                                res(`Error: ${err2}`)
                            }
                            res(rows2.filter(row => row.combo.indexOf(rows[0].combo) !== -1))
                        })
                    }))
                    Promise.all(promises).then(videos => {
                        videos = videos.filter(video => typeof video === "object").reduce((a, b) => a.concat(b))
                        if(videos.length > 0) {
                            combos.push('', 'Maxed versions:')
                            if(videos.length <= 5) {
                                videos.forEach(video => {
                                    if(video.lord === "All") {
                                        combos.push(`**${video.lord} Lords** video from ${video.player} (Attacking Team: **${video.attackingCombo}**): ${video.uri}`)
                                    } else {
                                        combos.push(`**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`)
                                    }
                                })
                            } else {
                                let videoGroups = []
                                // 5 is the maximum embed number allowed in a single message
                                for(let i = 0; i < videos.length; i += 5) {
                                    videoGroups.push(videos.slice(i, i+5)
                                                        .map(video => video.lord === "All" ?
                                                            `**${video.lord} Lords** video from ${video.player} (Attacking Team: **${video.attackingCombo}**): ${video.uri}`
                                                                :
                                                            `**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`
                                                            )
                                                    )
                                }
                                resolve([combos.join('\n'), videoGroups])
                            }
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
                    .then(msg1 => recordActivity(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordActivity(e, 'error'))
                msg.delete({timeout})
                    .then(msg1 => recordActivity(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordActivity(e, 'error'))
            }
        })
    }
    function sendMessages(content, timeout) {
        msg.channel.send(content).then(msg2 => {
            if(timeout > 0) {
                msg2.delete({timeout})
                    .then(msg1 => recordActivity(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordActivity(e, 'error'))
                msg.delete({timeout})
                    .then(msg1 => recordActivity(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordActivity(e, 'error'))
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
    function adminPermission() {
        const rolesList = Array.from(msg.member.roles.cache.values()).map(i => i.name), guildId = msg.member.guild.id
        return adminRoles.filter(admin => rolesList.indexOf(admin.name) !== -1).filter(admin => admin.guildId === guildId).length > 0
    }
    if (msg.content === "!ping") {
        msg.reply("pong");
    } else if (msg.content.startsWith("!lord-video-add")) {
        if(adminPermission()) {
            const videoArray = msg.content.split("[+++]").slice(1)
            videoArray[0] = /\w+/.exec(videoArray[0])[0]
            videoArray[4] = parseInt(videoArray[4])
            if(videoArray.length < 6) {
                replyQueryMessagesWrapper('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri)')
            } else {
                db.run(`INSERT INTO video(lord, combo, player, attackingCombo, point, uri) VALUES(?, ?, ?, ?, ?, ?)`, videoArray, function(err) {
                    if (err) {
                        recordActivity(err.message, 'error')
                        replyQueryMessagesWrapper("An internal error happened.")
                    } else {
                        // get the last insert id
                        recordActivity(`A row has been inserted into video with uri ${videoArray[5]}`)
                        replyQueryMessagesWrapper(`Successfully added the video for ${videoArray[1]} from ${videoArray[2]}`)
                    }
                    
                })
            }
        } else {
            replyQueryMessagesWrapper("Sorry, u have no permissions to complete this action.")
        }
        
    } else if (msg.content.startsWith("!lord-video-delete")) {
        if(adminPermission()) {
            const videoArray = msg.content.split(" ").slice(1)
            if(videoArray.length === 0) {
                replyQueryMessagesWrapper('need at least one uri to complete')
            } else {
                db.run(`DELETE FROM video WHERE ${videoArray.map(() => "uri=?").join(" OR ")};`, videoArray, function(err) {
                    if (err) {
                        replyQueryMessagesWrapper(err.message)
                    }
                    recordActivity(`Successfully deleted the videos whose uri are ${videoArray.join(' or ')}`)
                    replyQueryMessagesWrapper(`Successfully deleted the videos whose uri are ${videoArray.join(' or ')}`)
                })
            }
        } else {
            replyQueryMessagesWrapper("Sorry, u have no permissions to complete this action.")
        }
    } else if (msg.content === "!lord-time") {
        const {week, weekday, time} = weekJudge(), padNum = num => String(num).padStart(2, "0")
        let timeTotalSec = parseInt(time/1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        replyQueryMessagesWrapper(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
    } else if (msg.content.startsWith("!lord-daily-combo")) {
        const comboArray = msg.content.split(" ").slice(1)
        if(comboArray.length === 0 || comboArray.length === 2) {
            let week, weekday
            if(comboArray.length === 0) {
                let {week1, weekday1} = weekJudge()
                week = week1
                weekday = weekday1
            } else {
                let [week1, weekday1] = comboArray
                week = week1
                weekday = weekday1
            }
            
            dailyComboQuery(week, weekday).then(res => {
                if(typeof res === "string") {
                    replyQueryMessagesWrapper(res)
                } else {
                    replyQueryMessagesWrapper(res[0]+'\n'+res[1][0].join('\n'))
                    for(let i = 1; i < res[1].length; i++) {
                        msg.channel.send(res[1][i].join('\n'))
                    }
                }
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
            {command: `!lord-video-add[+++]<lord>[+++]<combo>[+++]<player>[+++]<attackingCombo>[+++]<point>[+++]<uri>`, description: `Add Lord Videos.`},
            {command: `!lord-video-delete <uri>`, description: `Delete Lord Video.`},
            {command: `!lord-video-delete <uri1> <uri2> ...`, description: `Delete Lord Videos.`},
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

module.exports = {weekJudge, dailyComboQuery, recordActivity}