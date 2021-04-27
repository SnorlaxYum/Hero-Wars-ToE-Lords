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
 * @returns {String} the uri of the youtube video
 */
function shortcutToYoutube(sc, param='') {
    return `https://youtu.be/${/youtube:([\s\S]+)/.exec(sc)[1]}${param?param:''}`
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
}

module.exports = {comboParser, youtubeToShortcut, shortcutToYoutube, getVideourl, getVideoShortcut, weekJudge}