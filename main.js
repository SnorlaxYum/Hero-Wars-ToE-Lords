const { Discord, client, replyQueryMessagesWrapperImport, sendMessagesWrapperImport, adminPermissionImport } = require("./utils/discord")
const { logger } = require("./utils/log")
const {addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge} = require("./utils/common")
const {commandCenter} = require("./utils/command")

// ready
client.on("ready", () => {
    logger.info(`Logged in as ${client.user.tag}!`)
})

// query
client.on("message", msg => {
    function replyQueryMessages(content, delNotification=true, timeout = 60 * 1000) {
        replyQueryMessagesWrapperImport(content, delNotification, msg.channel, o => msg.reply(o), o => msg.delete(o), timeout)
    }
    function sendMessages(content, delNotification=true, timeout = 60 * 1000) {
        sendMessagesWrapperImport(content, delNotification, msg.channel, o => msg.delete(o), timeout)
    }
    function adminPermission() {
        return adminPermissionImport(msg.member.roles.cache.values(), msg.member.guild.id)
    }
    if (msg.content.startsWith("!lord-video-add")) {
        if (adminPermission()) {
            const videoArray = msg.content.split("[+++]").slice(1)
            videoArray[0] = /\w+/.exec(videoArray[0])[0]
            if(videoArray[0] !== "All") {
                try {
                    videoArray[1] = comboParser(videoArray[1])
                    videoArray[3] = comboParser(videoArray[3])
                } catch(e) {
                    return replyQueryMessages(e.message)
                }
            }
            videoArray[4] = parseInt(videoArray[4])
            
            // video uri convert
            let videoFinaluri = getVideoShortcut(videoArray[5])
            videoArray[5] = videoFinaluri[0]
            videoArray.push(videoFinaluri[1])

            if (videoArray.length < 6) {
                replyQueryMessages('need 6 parameters (lord text, combo text, player text, attackingCombo text, point integer, uri text)')
            } else {
                addLordVideo(videoArray, err => {
                    if (err) {
                        logger.error(err.message)
                        if(err.message.indexOf("UNIQUE constraint failed") !== -1) {
                            replyQueryMessages("the video is already in the database.")
                        } else {
                            replyQueryMessages("an internal error happened.")
                        }
                    } else {
                        logger.info(`A row has been inserted into video with uri ${videoArray[5]}`)
                        replyQueryMessages(`successfully added the video for ${videoArray[1]} from ${videoArray[2]}`)
                    }
                })
            }
        } else {
            replyQueryMessages("sorry, you have no permissions to complete this action.")
        }

    } else if (msg.content.startsWith("!lord-video-delete")) {
        if (adminPermission()) {
            let videoArray = msg.content.split(" ").slice(1)
            if (videoArray.length === 0) {
                replyQueryMessages('this API needs at least one uri to complete')
            } else {
                videoArray = videoArray.map(uri => {
                    return getVideoShortcut(uri)[0]
                })
                deleteLordVideos(videoArray, err => {
                    if (err) {
                        replyQueryMessages(err.message)
                    } else {
                        logger.info(`Successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
                        replyQueryMessages(`successfully deleted the videos whose uri is ${videoArray.join(' or ')}`)
                    }
                })
            }
        } else {
            replyQueryMessages("sorry, you have no permissions to complete this action.")
        }
    } else if (msg.content === "!lord-time") {
        const { week, weekday, time } = weekJudge(), padNum = num => String(num).padStart(2, "0")
        let timeTotalSec = parseInt(time / 1000), second = timeTotalSec % 60, min = parseInt(timeTotalSec / 60) % 60, hour = parseInt(timeTotalSec / 60 / 60)
        replyQueryMessages(`Week ${week} - Day ${weekday} - ${padNum(hour)}:${padNum(min)}:${padNum(second)}`)
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
                    replyQueryMessages(res)
                } else {
                    replyQueryMessages(res[0] + '\n' + res[1][0].join('\n'), false)
                    for (let i = 1; i < res[1].length; i++) {
                        sendMessages(res[1][i].join('\n'), i + 1 === res[1].length ? true : false)
                    }
                }
            }, rej => {
                replyQueryMessages(rej)
            })
        } else {
            replyQueryMessages("daily combo support only 0 or 2 parameters.")
        }
    }
    commandCenter(msg.content, msg => {sendMessages(msg)})
})
