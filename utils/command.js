const commands = require("../commands.json")
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
 * @param {String} msgCon message content
 * @param {(msg: StringResolvable|APIMessage) => void} sendMessage function responsible for sending the message
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandDailyComboCheck(msgCon, sendMessage, replyMessage) {
    const comboArray = msgCon.split(" ").slice(1)
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
 * @param {String} msgCon message content
 * @param {(msg: MessageEmbed) => void} sendMessage function responsible for sending the message
 */
function commandHelp(msgCon, sendMessage) {
    let params = msgCon.split(' ').slice(1)
    let descriptionParser = (command, index) => `${index + 1}. \`${command.prefix}\`\n${command.description}${command.alias ? "\nAlias: `" + command.alias + "`" : ""}`
    if (params.length === 0) {
        let newMsg = new MessageEmbed()
            .setTitle("Commands Help")
            .setDescription(
                `${commands.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
            )
        sendMessage(newMsg)
    } else {
        let results = commands.filter(command => params.map(param => command.prefix.indexOf(param) >= 0).reduce((a, b) => a || b)),
            newMsg = new MessageEmbed()
                .setTitle(`Commands Containing ${params.join(", ")}`)
                .setDescription(
                    `${results.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
        sendMessage(newMsg)
    }
}

/**
 * check current lord time
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandTimeCheck(replyMessage) {
    const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
    let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
    replyMessage(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
}

/**
 * add a lord video
 * @param {String} msgCon message content
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandVideoAdd(msgCon, guildMember, replyMessage) {
    if (adminPermission(guildMember)) {
        const videoArray = msgCon.split("[+++]").slice(1)
        videoArray[0] = /\w+/.exec(videoArray[0])[0]
        if (videoArray[0] !== "All") {
            try {
                videoArray[1] = comboParser(videoArray[1])
                videoArray[3] = comboParser(videoArray[3])
            } catch (e) {
                return replyMessage(e.message)
            }
        }
        videoArray[4] = parseInt(videoArray[4])

        // video uri convert
        let videoFinaluri = getVideoShortcut(videoArray[5])
        videoArray[5] = videoFinaluri[0]
        videoArray.push(videoFinaluri[1])

        if (videoArray.length < 6) {
            replyMessage('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
        } else {
            addLordVideo(videoArray, err => {
                if (err) {
                    console.error(err.message)
                    if (err.message.indexOf("UNIQUE constraint failed") !== -1) {
                        replyMessage("the video is already in the database.")
                    } else {
                        replyMessage("an internal error happened.")
                    }
                } else {
                    console.info(`A row has been inserted into video with uri ${videoArray[5]}`)
                    replyMessage(`successfully added the video for ${videoArray[1]} from ${videoArray[2]}`)
                }
            })
        }
    } else {
        replyMessage("sorry, you have no permissions to complete this action.")
    }
}

/**
 * delete lord videos from the given uris
 * @param {String} msgCon message content
 * @param {GuildMember} guildMember guild member info object
 * @param {(msg: StringResolvable|APIMessage) => void} replyMessage function responsible for replying the message
 */
function commandVideoDelete(msgCon, guildMember, replyMessage) {
    if (adminPermission(guildMember)) {
        let videoArray = msgCon.split(" ").slice(1)
        if (videoArray.length === 0) {
            replyMessage('this API needs at least one uri to complete')
        } else {
            videoArray = videoArray.map(uri => {
                return getVideoShortcut(uri)[0]
            })
            deleteLordVideos(videoArray, err => {
                if (err) {
                    replyMessage(err.message)
                } else {
                    console.info(`Successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
                    replyMessage(`successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
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
    function replyQueryMessages(content, delNotification = true, timeout = 60 * 1000) {
        replyQueryMessagesWrapperImport(content, delNotification, msgChannel, o => replyMessage(o), o => deleteMessage(o), timeout)
    }
    function sendMessages(content, delNotification = true, timeout = 60 * 1000) {
        sendMessagesWrapperImport(content, delNotification, msgChannel, o => deleteMessage(o), timeout)
    }
    if (msgCon === "!ping") {
        replyQueryMessages("pong")
    } else if (msgCon.startsWith("!lord-video-add")) {
        commandVideoAdd(msgCon, guildMember, replyQueryMessages)
    } else if (msgCon.startsWith("!lord-video-delete")) {
        commandVideoDelete(msgCon, guildMember, replyQueryMessages)
    } else if (msgCon === "!lord-time") {
        commandTimeCheck(replyQueryMessages)
    } else if (msgCon.startsWith("!lord-daily-combo")) {
        commandDailyComboCheck(msgCon, sendMessages, replyQueryMessages)
    } else if (msgCon.startsWith("!lord-daily")) {
        commandDailyComboCheck(msgCon, sendMessages, replyQueryMessages)
    } else if (msgCon.startsWith("!help")) {
        commandHelp(msgCon, sendMessages)
    }
}

module.exports = { commandCenter }