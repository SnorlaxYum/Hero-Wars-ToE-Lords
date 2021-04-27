const logger = {
    debug(msg) {
        console.debug(msg)
    },
    error(msg) {
        console.error(msg)
    },
    info(msg) {
        console.info(msg)
    },
    log(msg) {
        console.log('\x1b[37m\x1b[47m', msg)
    },
    warn(msg) {
        console.warn(msg)
    },
    dir(msg) {
        console.dir(msg)
    }
}

module.exports = { logger }