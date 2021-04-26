function recordLog(message, severity = 'log') {
    // console[severity](`${new Date} - ${message}`)
    console[severity](message)
}

module.exports = { recordLog }