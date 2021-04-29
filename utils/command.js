const commands = require("../commands.json")
const { prefix } = require("../config.json")
const { addLordVideo, deleteLordVideos, comboParser, dailyComboQuery, getVideoShortcut, weekJudge } = require("./common")
const { timeoutDeleteMessage, adminPermission } = require("./discord")
const { GuildMember, Message, MessageEmbed, TextChannel, StringResolvable, APIMessage, Collection } = require("./discord").Discord
const fs = require("fs")

/**
 * parse command string and get the job done.
 * @param {Object} msg message object
 */
function commandCenter(msg) {
    if(!msg.content.startsWith(prefix)) {
        return
    }
    let commandFull = msg.content.slice(prefix.length).trim(), args = /^lord-video-add/.exec(commandFull) ? commandFull.split("[+++]") : commandFull.split(/ +/),
    command = args.shift().toLowerCase(),
    currentMainFilePath = process.mainModule.filename.split("/"),
    commandFiles = fs.readdirSync([...currentMainFilePath.slice(0, currentMainFilePath.length-1), "commands"].join("/")).filter(file => file.endsWith(".js")),
    commands = new Collection()

    for(let file of commandFiles) {
        let commandInfo = require(`../commands/${file}`)
        commands.set(commandInfo.name, commandInfo)
        if(commandInfo.alias) {
            for(let alia of commandInfo.alias) {
                commands.set(alia, {isAlias: true, exec: commandInfo.exec})
            }
        }
    }

    if(!commands.has(command)) {
        return
    }

    // if(command === "help") {
    //     let helpCommands = Array.from(commands.values()).filter(com => !com.isAlias)
    //     let descriptionParser = (command, index) => `${index + 1}. \`${command.name}\`\n
    //     Syntax: ${command.syntax}
    //     Description: ${command.description}
    //     ${command.alias ? "\nAlias: `" + command.alias.join(", ") + "`" : ""}`
    //     if (args.length === 0) {
    //         let newMsg = new MessageEmbed()
    //             .setTitle("Commands Help")
    //             .setDescription(
    //                 `${helpCommands.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
    //             )
    //         timeoutDeleteMessage(msg, newMsg, false)
    //     } else {
    //         let results = helpCommands.filter(command => args.map(arg => (com => com.name.indexOf(arg) !== -1)).reduce((a, b) => typeof a === "function" ? (a(command) || b(command)) : (a || b(command)))),
    //             newMsg = new MessageEmbed()
    //                 .setTitle(`Commands Containing ${args.join(", ")}`)
    //                 .setDescription(
    //                     `${results.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
    //                 )
    //         timeoutDeleteMessage(msg, newMsg, false)
    //     }
    // } else {
        try {
            commands.get(command).exec(args, msg)
        } catch(e) {
            console.error(e.message)
            msg.reply("an error occurred.")
        }
    // }
}

module.exports = { commandCenter }