const commands = require("../commands.json")
const { prefix } = require("../config.json")
const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("./common")
const { replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermissionImport } = require("./discord")
const { GuildMember, Message, MessageEmbed, TextChannel, StringResolvable, APIMessage } = require("./discord").Discord

/**
 * check if the member has admin permission
 * @param {GuildMember} guildMember guild member info object
 * @returns {Boolean} whether he has the admin permission
 */
function adminPermission(guildMember) {
    return adminPermissionImport(guildMember.roles.cache.values(), guildMember.guild.id)
}

/**
 * check the daily lord combo according to the given date
 * @param {String} args command arguments
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: StringResolvable|APIMessage) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandDailyComboCheck(args, guildMember, sendMessage, replyMessage) {
    if (args.length === 0 || args.length === 2) {
        let week, weekday
        if (args.length === 0) {
            let date = weekJudge()
            week = date.week
            weekday = date.weekday
        } else {
            let [week1, weekday1] = args
            week = week1
            weekday = weekday1
        }

        dailyComboQuery(week, weekday).then(res => {
            if (typeof res === "string") {
                replyMessage(res)
            } else {
                replyMessage(res[0] + '\n' + res[1][0].join('\n'), false)
                for (let i = 1; i < res[1].length; i++) {
                    sendMessage(res[1][i].join('\n'), i + 1 === res[1].length ? true : false)
                }
            }
        }, rej => {
            replyMessage(rej)
        })
    } else {
        replyMessage("daily combo support only 0 or 2 parameters.")
    }
}

/**
 * help command, manual for the bot user
 * @param {String} args command arguments
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: MessageEmbed) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandHelp(args, guildMember, sendMessage, replyMessage) {
    let descriptionParser = (command, index) => `${index + 1}. \`${command.prefix}\`\n${command.description}${command.alias ? "\nAlias: `" + command.alias + "`" : ""}`
    if (args.length === 0) {
        let newMsg = new MessageEmbed()
            .setTitle("Commands Help")
            .setDescription(
                `${commands.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
            )
        sendMessage(newMsg)
    } else {
        let results = commands.filter(command => args.map(param => command.prefix.indexOf(param) >= 0).reduce((a, b) => a || b)),
            newMsg = new MessageEmbed()
                .setTitle(`Commands Containing ${args.join(", ")}`)
                .setDescription(
                    `${results.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
        sendMessage(newMsg)
    }
}

/**
 * check current lord time
 * @param {String} args command arguments
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: MessageEmbed) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandTimeCheck(args, guildMember, sendMessage, replyMessage) {
    const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
    let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
    replyMessage(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
}

/**
 * add a lord video
 * @param {String} args command arguments
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: MessageEmbed) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandVideoAdd(args, guildMember, sendMessage, replyMessage) {
    if (adminPermission(guildMember)) {
        args[0] = /\w+/.exec(args[0])[0]
        if (args[0] !== "All") {
            try {
                args[1] = comboParser(args[1])
                args[3] = comboParser(args[3])
            } catch (e) {
                return replyMessage(e.message)
            }
        }
        args[4] = parseInt(args[4])

        // video uri convert
        let videoFinaluri = getVideoShortcut(args[5])
        args[5] = videoFinaluri[0]
        args.push(videoFinaluri[1])

        if (args.length < 6) {
            replyMessage('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
        } else {
            addLordVideo(args, err => {
                if (err) {
                    console.error(err.message)
                    if (err.message.indexOf("UNIQUE constraint failed") !== -1) {
                        replyMessage("the video is already in the database.")
                    } else {
                        replyMessage("an internal error happened.")
                    }
                } else {
                    console.info(`A row has been inserted into video with uri ${args[5]}`)
                    replyMessage(`successfully added the video for ${args[1]} from ${args[2]}`)
                }
            })
        }
    } else {
        replyMessage("sorry, you have no permissions to complete this action.")
    }
}

/**
 * delete lord videos from the given uris
 * @param {String} args command arguments
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: MessageEmbed) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandVideoDelete(args, guildMember, sendMessage, replyMessage) {
    if (adminPermission(guildMember)) {
        if (args.length === 0) {
            replyMessage('this API needs at least one uri to complete')
        } else {
            args = args.map(uri => {
                return getVideoShortcut(uri)[0]
            })
            deleteLordVideos(args, (err, res) => {
                if (err) {
                    replyMessage(err.message)
                } else {
                    if(res.changes === 0) {
                        console.error(`No video was deleted.`)
                        replyMessage(`no video was deleted.`)
                    } else if(res.changes === 1) {
                        console.info(`Successfully deleted the video whose uri is ${args.join(' or ')}`)
                        replyMessage(`successfully deleted the video whose uri is ${args.join(' or ')}`)
                    } else {
                        console.info(`Successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                        replyMessage(`successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                    }
                }
            })
        }
    } else {
        replyMessage("sorry, you have no permissions to complete this action.")
    }
}

/**
 * parse command string and get the job done.
 * @param {String} msgCon message content
 * @param {TextChannel} msgChannel message content
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: StringResolvable|APIMessage) => Promise<(Message|Array<Message>)>} replyMessage function responsible for replying the message
 * @param {(option: Object) => Promise<Message>} deleteMessage function responsible for deleting the message
 */
function commandCenter(msgCon, msgChannel, guildMember, replyMessage, deleteMessage) {
    if(!msgCon.startsWith(prefix)) {
        return
    }
    let commandFull = msgCon.slice(prefix.length).trim(), args = /^lord-video-add/.exec(commandFull) ? commandFull.split("[+++]") : commandFull.split(/ +/),
    command = args.shift().toLowerCase()

    function replyQueryMessages(content, delNotification = true, timeout = 60 * 1000) {
        replyQueryMessagesWrapperImport(content, delNotification, msgChannel, o => replyMessage(o), o => deleteMessage(o), timeout)
    }
    function sendMessages(content, delNotification = true, timeout = 60 * 1000) {
        sendMessagesWrapperImport(content, delNotification, msgChannel, o => deleteMessage(o), timeout)
    }

    if (command === "ping") {
        replyQueryMessages("pong")
    } else if (command === "lord-video-add") {
        commandVideoAdd(args, guildMember, sendMessages, replyQueryMessages)
    } else if (command === "lord-video-delete") {
        commandVideoDelete(args, guildMember, sendMessages, replyQueryMessages)
    } else if (command === "lord-time") {
        commandTimeCheck(args, guildMember, sendMessages, replyQueryMessages)
    } else if (command === "lord-daily-combo") {
        commandDailyComboCheck(args, guildMember, sendMessages, replyQueryMessages)
    } else if (command === "lord-daily") {
        commandDailyComboCheck(args, guildMember, sendMessages, replyQueryMessages)
    } else if (command === "help") {
        commandHelp(args, guildMember, sendMessages, replyQueryMessages)
    }
}

module.exports = { commandCenter }