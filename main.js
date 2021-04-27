const adminRoles = require("./adminRoles.json")
const { Discord, client } = require("./discordLogin")
const { recordLog } = require("./log")
const {addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge} = require("./util")

// ready
client.on("ready", () => {
    recordLog(`Logged in as ${client.user.tag}!`)
})

// query
client.on("message", msg => {
    function replyQueryMessages(content, timeout) {
        msg.reply(content).then(reply => {
            if (timeout > 0) {
                reply.delete({ timeout })
                    .then(msg1 => recordLog(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordLog(e, 'error'))
                msg.delete({ timeout })
                    .then(msg1 => recordLog(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordLog(e, 'error'))
            }
        })
    }
    function sendMessages(content, timeout) {
        msg.channel.send(content).then(msg2 => {
            if (timeout > 0) {
                msg2.delete({ timeout })
                    .then(msg1 => recordLog(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordLog(e, 'error'))
                msg.delete({ timeout })
                    .then(msg1 => recordLog(`Deleted message from ${msg1.author.username}.`))
                    .catch(e => recordLog(e, 'error'))
            }
        })
    }
    function judgeTimeout(timeout) {
        if (msg.channel.name.startsWith('bot-command')) {
            return -1
        }
        return timeout
    }
    function replyQueryMessagesWrapper(content, delNotification=true, timeout = 60 * 1000) {
        timeout = judgeTimeout(timeout)
        if (timeout >= 0 && delNotification) {
            if (typeof content === "string")
                content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
            else
                content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
        }
        replyQueryMessages(content, timeout)
    }
    function sendMessagesWrapper(content, delNotification=true, timeout = 60 * 1000) {
        timeout = judgeTimeout(timeout)
        if (timeout >= 0 && delNotification) {
            if (typeof content === "string")
                content += `\n\n(Note these messages will be deleted in ${timeout}ms)`
            else
                content.description += `\n\n(Note these messages will be deleted in ${timeout}ms)`
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
        if (adminPermission()) {
            const videoArray = msg.content.split("[+++]").slice(1)
            videoArray[0] = /\w+/.exec(videoArray[0])[0]
            if(videoArray[0] !== "All") {
                try {
                    videoArray[1] = comboParser(videoArray[1])
                    videoArray[3] = comboParser(videoArray[3])
                } catch(e) {
                    return replyQueryMessagesWrapper(e.message)
                }
            }
            videoArray[4] = parseInt(videoArray[4])
            
            // video uri convert
            let videoFinaluri = getVideoShortcut(videoArray[5])
            videoArray[5] = videoFinaluri[0]
            videoArray.push(videoFinaluri[1])

            if (videoArray.length < 6) {
                replyQueryMessagesWrapper('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
            } else {
                addLordVideo(videoArray, err => {
                    if (err) {
                        recordLog(err.message, 'error')
                        if(err.message.indexOf("UNIQUE constraint failed") !== -1) {
                            replyQueryMessagesWrapper("the video is already in the database.")
                        } else {
                            replyQueryMessagesWrapper("an internal error happened.")
                        }
                    } else {
                        recordLog(`A row has been inserted into video with uri ${videoArray[5]}`)
                        replyQueryMessagesWrapper(`successfully added the video for ${videoArray[1]} from ${videoArray[2]}`)
                    }
                })
            }
        } else {
            replyQueryMessagesWrapper("sorry, you have no permissions to complete this action.")
        }

    } else if (msg.content.startsWith("!lord-video-delete")) {
        if (adminPermission()) {
            let videoArray = msg.content.split(" ").slice(1)
            if (videoArray.length === 0) {
                replyQueryMessagesWrapper('this API needs at least one uri to complete')
            } else {
                videoArray = videoArray.map(uri => {
                    return getVideoShortcut(uri)[0]
                })
                deleteLordVideos(videoArray, err => {
                    if (err) {
                        replyQueryMessagesWrapper(err.message)
                    } else {
                        recordLog(`Successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
                        replyQueryMessagesWrapper(`successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
                    }
                })
            }
        } else {
            replyQueryMessagesWrapper("sorry, you have no permissions to complete this action.")
        }
    } else if (msg.content === "!lord-time") {
        const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
        let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        replyQueryMessagesWrapper(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
    } else if (msg.content.startsWith("!lord-daily-combo")) {
        const comboArray = msg.content.split(" ").slice(1)
        if (comboArray.length === 0 || comboArray.length === 2) {
            let week, weekday
            if (comboArray.length === 0) {
                let date = weekJudge()
                week = date.week
                weekday = date.weekday
            } else {
                let [week1, weekday1] = comboArray
                week = week1
                weekday = weekday1
            }

            dailyComboQuery(week, weekday).then(res => {
                if (typeof res === "string") {
                    replyQueryMessagesWrapper(res)
                } else {
                    replyQueryMessagesWrapper(res[0] + '\n' + res[1][0].join('\n'), false)
                    for (let i = 1; i < res[1].length; i++) {
                        sendMessagesWrapper(res[1][i].join('\n'), i + 1 === res[1].length ? true : false)
                    }
                }
            }, rej => {
                replyQueryMessagesWrapper(rej)
            })
        } else {
            replyQueryMessagesWrapper("daily combo support only 0 or 2 parameters.")
        }
    } else if (msg.content.startsWith("!help")) {
        let params = msg.content.split(' ').slice(1), things = [
            { command: `!lord-time`, description: `Current time in Lord Format` },
            { command: `!lord-daily-combo`, description: `Lord Combos now.` },
            { command: `!lord-daily-combo <Week> <WeekDay>`, description: `Lord Combos in a specific lord day.` },
            { command: `!lord-video-add[+++]<lord>[+++]<combo>[+++]<player>[+++]<attackingCombo>[+++]<point>[+++]<uri>`, description: `Add Lord Videos.` },
            { command: `!lord-video-delete <uri>`, description: `Delete Lord Video.` },
            { command: `!lord-video-delete <uri1> <uri2> ...`, description: `Delete Lord Videos.` },
        ]
        if (params.length === 0) {
            let newMsg = new Discord.MessageEmbed()
                .setTitle("Commands Help")
                .setDescription(
                    `${things.map((thing, index) => `${index + 1}. \`${thing.command}\`\n${thing.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
            sendMessagesWrapper(newMsg)
        } else {
            let results = things.filter(thing => params.map(param => thing.command.indexOf(param) >= 0).reduce((a, b) => a || b)),
                newMsg = new Discord.MessageEmbed()
                    .setTitle(`Commands Containing ${params.join(", ")}`)
                    .setDescription(
                        `${results.map((thing, index) => `${index + 1}. \`${thing.command}\`\n${thing.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
                    )
            sendMessagesWrapper(newMsg)
        }
    }
})
