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
 * @param {Discord.Message} msg query message
 */
function commandDailyComboCheck(args, msg) {
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
                msg.reply(res)
            } else {
                msg.reply(res[0] + '\n' + res[1][0].join('\n'), false)
                for (let i = 1; i < res[1].length; i++) {
                    msg.send(res[1][i].join('\n'), i + 1 === res[1].length ? true : false)
                }
            }
        }, rej => {
            msg.reply(rej)
        })
    } else {
        msg.reply("daily combo support only 0 or 2 parameters.")
    }
}

/**
 * help command, manual for the bot user
 * @param {String} args command arguments
 * @param {Discord.Message} msg query message
 */
function commandHelp(args, msg) {
    let descriptionParser = (command, index) => `${index + 1}. \`${command.prefix}\`\n${command.description}${command.alias ? "\nAlias: `" + command.alias + "`" : ""}`
    if (args.length === 0) {
        let newMsg = new MessageEmbed()
            .setTitle("Commands Help")
            .setDescription(
                `${commands.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
            )
        msg.send(newMsg)
    } else {
        let results = commands.filter(command => args.map(param => command.prefix.indexOf(param) >= 0).reduce((a, b) => a || b)),
            newMsg = new MessageEmbed()
                .setTitle(`Commands Containing ${args.join(", ")}`)
                .setDescription(
                    `${results.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
        msg.send(newMsg)
    }
}

/**
 * check current lord time
 * @param {String} args command arguments
 * @param {Discord.Message} msg query message
 */
function commandTimeCheck(args, msg) {
    const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
    let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
    msg.reply(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
}

/**
 * add a lord video
 * @param {String} args command arguments
 * @param {Discord.Message} msg query message
 */
function commandVideoAdd(args, msg) {
    if (adminPermission(msg.member)) {
        args[0] = /\w+/.exec(args[0])[0]
        if (args[0] !== "All") {
            try {
                args[1] = comboParser(args[1])
                args[3] = comboParser(args[3])
            } catch (e) {
                return msg.reply(e.message)
            }
        }
        args[4] = parseInt(args[4])

        // video uri convert
        let videoFinaluri = getVideoShortcut(args[5])
        args[5] = videoFinaluri[0]
        args.push(videoFinaluri[1])

        if (args.length < 6) {
            msg.reply('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
        } else {
            addLordVideo(args, err => {
                if (err) {
                    console.error(err.message)
                    if (err.message.indexOf("UNIQUE constraint failed") !== -1) {
                        msg.reply("the video is already in the database.")
                    } else {
                        msg.reply("an internal error happened.")
                    }
                } else {
                    console.info(`A row has been inserted into video with uri ${args[5]}`)
                    msg.reply(`successfully added the video for ${args[1]} from ${args[2]}`)
                }
            })
        }
    } else {
        msg.reply("sorry, you have no permissions to complete this action.")
    }
}

/**
 * delete lord videos from the given uris
 * @param {String} args command arguments
 * @param {Discord.Message} msg query message
 */
function commandVideoDelete(args, msg) {
    if (adminPermission(msg.member)) {
        if (args.length === 0) {
            msg.reply('this API needs at least one uri to complete')
        } else {
            args = args.map(uri => {
                return getVideoShortcut(uri)[0]
            })
            deleteLordVideos(args, (err, res) => {
                if (err) {
                    msg.reply(err.message)
                } else {
                    if(res.changes === 0) {
                        console.error(`No video was deleted.`)
                        msg.reply(`no video was deleted.`)
                    } else if(res.changes === 1) {
                        console.info(`Successfully deleted the video whose uri is ${args.join(' or ')}`)
                        msg.reply(`successfully deleted the video whose uri is ${args.join(' or ')}`)
                    } else {
                        console.info(`Successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                        msg.reply(`successfully deleted ${res.changes} videos whose uri are ${args.join(' or ')}`)
                    }
                }
            })
        }
    } else {
        msg.reply("sorry, you have no permissions to complete this action.")
    }
}

/**
 * parse command string and get the job done.
 * @param {Object} msg message object
 */
function commandCenter(msg) {
    if(!msg.content.startsWith(prefix)) {
        return
    }
    let commandFull = msg.content.slice(prefix.length).trim(), args = /^lord-video-add/.exec(commandFull) ? commandFull.split("[+++]") : commandFull.split(/ +/),
    command = args.shift().toLowerCase()

    if (command === "ping") {
        replyQueryMessages("pong")
    } else if (command === "lord-video-add") {
        commandVideoAdd(args, msg)
    } else if (command === "lord-video-delete") {
        commandVideoDelete(args, msg)
    } else if (command === "lord-time") {
        commandTimeCheck(args, msg)
    } else if (command === "lord-daily-combo") {
        commandDailyComboCheck(args, msg)
    } else if (command === "lord-daily") {
        commandDailyComboCheck(args, msg)
    } else if (command === "help") {
        commandHelp(args, msg)
    }
}

module.exports = { commandCenter }