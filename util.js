
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

module.exports = {youtubeToShortcut, shortcutToYoutube, getVideourl, getVideoShortcut}