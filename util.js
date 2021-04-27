
/**
 * convert youtube video uri to shortcut
 * @param {String} uri the uri of the youtube video
 * @returns {String[]} converted shortcut
 */
function youtubeToShortcut(uri) {
    return /youtube.com\/watch\?v\=([A-Za-z0-9_\-]+)([\s\S]+)/.exec(uri) ? /youtube.com\/watch\?v\=([A-Za-z0-9_\-]+)([\s\S]+)/.exec(uri).slice(1) : /youtu.be\/([A-Za-z0-9_\-]+)([\s\S]+)/.exec(uri)[1].slice(1)
}

/**
 * convert shortcut to youtube video uri
 * @param {String} sc converted shortcut
 * @returns {String} the uri of the youtube video
 */
function shortcutToYoutube(sc, param='') {
    return `https://youtu.be/${/youtube:([A-Za-z0-9_\-]+)/.exec(sc)[1]}${param}`
}

module.exports = {youtubeToShortcut, shortcutToYoutube}