const {Database, RunResult} = require('sqlite3').verbose()

let db = new Database(process.env.DBPATH, (err) => {
    if (err) {
        console.error(err)
    }
    db.run('CREATE TABLE IF NOT EXISTS combo(week text, day integer, lord text, combo text UNIQUE);')
    db.run('CREATE TABLE IF NOT EXISTS video(lord text, combo text, player text, attackingCombo text, point integer, uri text UNIQUE, uriParam text);')
    console.info('Connected to the main database.')
})

/**
 * add lord video
 * @param {Array<String>} videoArray video info - [lord, combo, player, attackingCombo, point, uri, uriParam]
 * @param {Function} callback handles the result
 */
function addLordVideo(videoArray, callback) {
    db.run(`INSERT INTO video(lord, combo, player, attackingCombo, point, uri, uriParam) VALUES(?, ?, ?, ?, ?, ?, ?)`, videoArray, function (err) {
        callback(err)
    })
}

/**
 * delete lord videos
 * @param {Array<String>} uriArray an array of uris belonging to videos about to be deleted
 * @param {(err: Error, res: RunResult) => void} callback handles the result
 */
function deleteLordVideos(uriArray, callback) {
    db.run(`DELETE FROM video WHERE ${uriArray.map(() => "uri=?").join(" OR ")};`, uriArray, function (err) {
        callback(err, this)
    })
}

/**
 * judge the position of the day in a ToE cycle
 * @returns {Object}
 */
function weekJudge() {
    let pos = (new Date() - new Date('2021-04-12T13:00:00+0800'))
    let week = pos / (7 * 24 * 60 * 60 * 1000) % 3
    week = week < 1 ? 'A' : week < 2 ? 'B' : 'C'
    let weekday = parseInt(pos % (7 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)) + 1
    let time = pos % (7 * 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000)
    return { week, weekday, time }
}

/**
 * parse a string to a set of titans
 * @param {String} combo the combo to be parsed to a complete team
 * @returns {String} complete team
 */
function comboParser(combo) {
    const titans = [
        {name: "Sylva", type: "Earth"},
        {name: "Ignis", type: "Fire"},
        {name: "Hyperion", type: "Water", role: "Super"},
        {name: "Eden", type: "Earth", role: "Super"},
        {name: "Araji", type: "Fire", role: "Super"},
        {name: "Malri", type: "Water"},
        {name: "Avalon", type: "Earth"},
        {name: "Vulcan", type: "Fire"},
        {name: "Nova", type: "Water"},
        {name: "Angus", type: "Earth"},
        {name: "Moluch", type: "Fire"},
        {name: "Sigurd", type: "Water"}
    ]
    combo = combo.replace(/ /g, '')
    let result = []
    if(combo.indexOf("+") !== -1 || combo.indexOf(",") !== -1) {
        if(combo.indexOf(",") !== -1) {
            combo = combo.toLowerCase().split(",")
        } else {
            combo = combo.toLowerCase().split("+")
        }

        let filters = []

        for(let titan of combo) {
            if(/^[34]/.exec(titan)) {
                if(titan.slice(1) === "super" || titan.slice(1).startsWith("s")) {
                    filters.push(titan1 => titan1.role === "Super")
                } else {
                    filters.push(titan1 => titan1.type.toLowerCase().startsWith(titan.slice(1)))
                }
            } else {
                filters.push(titan1 => titan1.name.toLowerCase().startsWith(titan))
            }
        }
        
        result.push(...titans.filter(titan1 => filters.reduce((a, b) => typeof a === "function" ? a(titan1) || b(titan1) : a || b(titan1))))
    } else {
        if(/^[4]/.exec(combo)) {
            result.push(...titans.filter(titan1 => titan1.type.toLowerCase().startsWith(combo.slice(1,2)) || titan1.name.toLowerCase().startsWith(combo.slice(2))))
        } else {
            throw new Error("for exetremely simple abbreviation, only combos like 4FE (4 Fire + Eden) are supported.")
        }
    }

    if(result.length === 5) {
        return result.map(titan2 => titan2.name).join(", ")
    } else {
        throw new Error(`the combo abbreviation is not a right one. (supported abbreviation examples: 3 sup+nov+sig; 4 fir+sig; 4FE; 4FSi; 4FSy).`)
    }
}

/**
 * Get the daily lord combos according to the given lord week and weekday
 * @param {String} week week
 * @param {Number} weekday day in a week, starting from 1
 */
function dailyComboQuery(week, weekday) {
    return new Promise((resolve, reject) => {
        if (weekday > 5) {
            resolve('ToE already ended......')
        } else {
            db.all(`SELECT lord, combo FROM combo WHERE week=? AND day=?;`, [week, weekday], (err, rows) => {
                if (err) {
                    reject(`Error: ${err}`)
                }
                if (rows.length) {
                    let combos = [`**Week ${week}, Day ${weekday}:**`]
                    combos.push(...rows.map(row => `${row.lord} Lord: ${row.combo}`))
                    new Promise(res => {
                        db.all(`SELECT lord, combo, player, attackingCombo, point, uri, uriParam FROM video WHERE ${[...rows.map(() => "combo=?"), "lord=?"].join(" OR ")} ORDER BY lord DESC;`, [...rows.map(row => row.combo), "All"], (err2, rows2) => {
                            if (err2) {
                                res(`Error: ${err2}`)
                            }
                            res(rows2.filter(row => rows.map(ro => ro.lord).indexOf(row.lord) !== -1 || (row.lord === "All" && row.combo.indexOf(rows[0].combo) !== -1)))
                        })
                    }).then(videos => {
                        if(typeof videos !== "object") {
                            resolve(videos)
                        } else if(videos.length > 0) {
                            videos = videos.map(video => {
                                let {uri, uriParam} = video
                                return {
                                    ...video,
                                    uri: getVideourl(uri, uriParam)
                                }
                            })
                            combos.push('', 'Maxed versions:')
                            if (videos.length <= 5) {
                                videos.forEach(video => {
                                    if (video.lord === "All") {
                                        combos.push(`**${video.lord} Lords** video from ${video.player} (Attacking Team: **${video.attackingCombo}**): ${video.uri}`)
                                    } else {
                                        combos.push(`**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`)
                                    }
                                })
                            } else {
                                let videoGroups = []
                                // 5 is the maximum embed number allowed in a single message
                                for (let i = 0; i < videos.length; i += 5) {
                                    videoGroups.push(videos.slice(i, i + 5)
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
                    resolve('not found, there are only 3 weeks (A, B, C) in a cycle and 5 days (1-5) in a week.')
                }
            })
        }
    })
}

/**
 * Get the lord videos the given lord combo
 * @param {String} combo the given lord combo
 */
function lordVideoWithGivenCombo(combo) {
    return new Promise((resolve, reject) => {
        let comboFinal
        try {
            comboFinal = comboParser(combo)
        } catch(e) {
            throw e
        }
        db.get(`SELECT lord, combo, week, day FROM combo WHERE combo=?;`, [comboFinal], (err, row) => {
            if (err) {
                reject(`Error: ${err}`)
            }
            if (row) {
                let lines = [`**${row.lord} Lord (${row.combo}) on Week ${row.week}, Day ${row.day}:**`]
                new Promise(res => {
                    db.all(`SELECT lord, combo, player, attackingCombo, point, uri, uriParam FROM video WHERE instr(combo, ?) ORDER BY lord DESC;`, [row.combo], (err2, rows2) => {
                        if (err2) {
                            res(`Error: ${err2}`)
                        }
                        res(rows2)
                    })
                }).then(videos => {
                    if(typeof videos !== "object") {
                        resolve(videos)
                    } else if(videos.length > 0) {
                        videos = videos.map(video => {
                            let {uri, uriParam} = video
                            return {
                                ...video,
                                uri: getVideourl(uri, uriParam)
                            }
                        })
                        if (videos.length <= 5) {
                            videos.forEach(video => {
                                if (video.lord === "All") {
                                    lines.push(`**${video.lord} Lords** video from ${video.player} (Attacking Team: **${video.attackingCombo}**): ${video.uri}`)
                                } else {
                                    lines.push(`**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`)
                                }
                            })
                        } else {
                            let videoGroups = []
                            // 5 is the maximum embed number allowed in a single message
                            for (let i = 0; i < videos.length; i += 5) {
                                videoGroups.push(videos.slice(i, i + 5)
                                    .map(video => video.lord === "All" ?
                                        `**${video.lord} Lords** video from ${video.player} (Attacking Team: **${video.attackingCombo}**): ${video.uri}`
                                        :
                                        `**${video.lord} Lord (${video.combo})** video from ${video.player} (Attacking Team: **${video.attackingCombo}, ${video.point} points**): ${video.uri}`
                                    )
                                )
                            }
                            resolve([lines.join('\n'), videoGroups])
                        }
                    }
                    resolve(lines.length === 1 ? [...lines, "no videos found"].joins("\n") : lines.join('\n'))
                })
            } else {
                resolve('no lord with the given combo was found.')
            }
        })
    })
}

/**
 * convert youtube video uri to shortcut
 * @param {String} uri the uri of the youtube video
 * @returns {String[]} converted shortcut
 */
function youtubeToShortcut(uri) {
    return /youtube.com\/watch\?v\=([A-Za-z0-9_\-]+)([\s\S]+)/.exec(uri) ? /youtube.com\/watch\?v\=([A-Za-z0-9_\-]+)([\s\S]+)/.exec(uri).slice(1) : /youtu.be\/([A-Za-z0-9\_\-]+)([\s\S]+)/.exec(uri) ? /youtu.be\/([A-Za-z0-9\_\-]+)([\s\S]+)/.exec(uri).slice(1) : /youtube:([A-Za-z0-9\_\-]+)([\s\S]+)/.exec(uri).slice(1)
}

/**
 * convert shortcut to youtube video uri
 * @param {String} sc converted shortcut
 * @param {String} param param of the video
 * @returns {String} the uri of the youtube video
 */
function shortcutToYoutube(sc, param='') {
    return `https://youtu.be/${/youtube:([\s\S]+)/.exec(sc)[1]}${param?param:''}`
}

/**
 * convert google drive video uri to shortcut
 * @param {String} uri the uri of the google drive video
 * @returns {String[]} converted shortcut
 */
function gdrivevideoToShortcut(uri) {
    return /drive.google.com\/file\/d\/([0-9A-Za-z_\-]+)\/([\s\S]+)/.exec(uri) ? /drive.google.com\/file\/d\/([0-9A-Za-z_\-]+)\/([\s\S]+)/.exec(uri).slice(1) : /drive.google.com\/file\/d\/([0-9A-Za-z_\-]+)/.exec(uri) ? [/drive.google.com\/file\/d\/([0-9A-Za-z_\-]+)/.exec(uri)[1], 'view?usp=sharing'] : [/gdrive:([0-9A-Za-z_\-]+)/.exec(uri)[1], 'view?usp=sharing']
}

/**
 * convert shortcut to google drive video uri
 * @param {String} sc converted shortcut
 * @param {String} param param of the video
 * @returns {String} the uri of the google drive video
 */
function shortcutTogdrivevideo(sc, param) {
    return `https://drive.google.com/file/d/${/gdrive:([0-9A-Za-z_\-]+)/.exec(sc)[1]}/${param?param:''}`
}

/**
 * convert video uri to shortcut uri
 * @param {String} uri Video uri
 * @returns {String[]} array with uri and params
 */
function getVideoShortcut(uri) {
    if(/youtube/.exec(uri) || /youtu\.be/.exec(uri)) {
        let result = youtubeToShortcut(uri)
        if(result[1].length === 1) {
            return [`youtube:${result[0]}${result[1]}`, '']
        } else {
            return [`youtube:${result[0]}`, result[1]]
        }
    }
    if(/drive.google.com\/file\/d\//.exec(uri) || /gdrive:/.exec(uri)) {
        let result = gdrivevideoToShortcut(uri)
        return [`gdrive:${result[0]}`, result[1]]
    }
    // haven't supported yet
    return [uri, '']
}

/**
 * get full video uri
 * @param {String} uri Video shortcut uri
 * @param {String} uriParam Video uri param
 */
function getVideourl(uri, uriParam) {
    if(/^http/.exec(uri)) {
        return uri
    }
    if(/youtube\:([\s\S]+)/.exec(uri)) {
        return shortcutToYoutube(uri, uriParam)
    }
    if(/gdrive\:([\s\S]+)/.exec(uri)) {
        return shortcutTogdrivevideo(uri, uriParam)
    }
}

module.exports = {addLordVideo, comboParser, dailyComboQuery, deleteLordVideos, gdrivevideoToShortcut, lordVideoWithGivenCombo, youtubeToShortcut, shortcutToYoutube, shortcutTogdrivevideo, getVideourl, getVideoShortcut, weekJudge}