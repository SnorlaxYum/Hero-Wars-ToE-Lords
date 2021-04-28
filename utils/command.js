const commands = require("../commands.json")
const { MessageEmbed } = require("./discord").Discord

/**
 * help command, manual for the bot user
 * @param {String} msgCon message content
 * @param {(msg: MessageEmbed) => void} sendMessages function responsible for sending message
 */
function commandHelp(msgCon, sendMessages) {
    let params = msgCon.split(' ').slice(1)
    if (params.length === 0) {
        let newMsg = new MessageEmbed()
            .setTitle("Commands Help")
            .setDescription(
                `${commands.map((command, index) => `${index + 1}. \`${command.prefix}\`\n${command.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
            )
        sendMessages(newMsg)
    } else {
        let results = commands.filter(command => params.map(param => command.prefix.indexOf(param) >= 0).reduce((a, b) => a || b)),
            newMsg = new MessageEmbed()
                .setTitle(`Commands Containing ${params.join(", ")}`)
                .setDescription(
                    `${results.map((command, index) => `${index + 1}. \`${command.prefix}\`\n${command.description}`).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
        sendMessages(newMsg)
    }
}

/**
 * parse command string and get the job done.
 * @param {String} msgCon message content
 * @param {(msg: MessageEmbed) => void} sendMessages function responsible for sending message
 */
function commandCenter(msgCon, sendMessages) {
    if (msgCon.startsWith("!help")) {
        commandHelp(msgCon, sendMessages)
    }
}

module.exports = { commandCenter }