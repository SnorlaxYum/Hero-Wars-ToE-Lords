const { prefix } = require("../config.json")
const { timeoutDeleteMessage } = require("./discord")
const { MessageEmbed, Collection } = require("./discord").Discord
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

    if(command === "help") {
        let helpCommands = Array.from(commands.values()).filter(com => !com.isAlias)
        let descriptionParser = (command, index) => `${index + 1}. \`${prefix}${command.name}\`\n
        Syntax: \`${prefix}${command.syntax}\`
        Description: ${command.description}${command.alias ? "\nAlias: `" + command.alias.map(al => prefix+al).join(", ") + "`" : ""}`
        if (args.length === 0) {
            let newMsg = new MessageEmbed()
                .setTitle("Commands Help")
                .setDescription(
                    `${helpCommands.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
                )
            timeoutDeleteMessage(msg, newMsg, false)
        } else if (args.length === 1) {
            let command = helpCommands.findIndex(command => command.name === args[0] || (command.alias ? command.alias.indexOf(args[0]) !== -1 : false))
            if(command === -1) {
                timeoutDeleteMessage(msg, "no command found")
            } else {
                command = {...helpCommands[command]}
                command.name = `${prefix}${command.name}`
                let fields = [
                    { name: "Description", value: `${command.description}`},
                    { name: "Syntax", value: `\`${prefix}${command.syntax}\``},
                ]
                if(command.alias) {
                    fields.push({
                        name: "Alias", 
                        value: command.alias.map(al => `\`${prefix+al}\``).join(", ")
                    })
                }
                let newMsg = new MessageEmbed()
                .setTitle(`Command ${command.name}`)
                .addFields(...fields)
                timeoutDeleteMessage(msg, newMsg, false)
            }
        } else {
            let filterFuns = args.map(arg => com => (com.name.indexOf(arg) !== -1 || (com.alias ? com.alias.findIndex(co => co.indexOf(arg)+1) !== -1 : false)))
                results = helpCommands.filter(command => filterFuns.reduce((a, b) => typeof a === "function" ? (a(command) || b(command)) : (a || b(command)))),
                newMsg = new MessageEmbed()
                    .setTitle(`Commands Containing ${args.join(", ")}`)
                    .setDescription(
                        `${results.map(descriptionParser).join('\n-----------------------------------------------------------------------------------------------\n')}`
                    )
            timeoutDeleteMessage(msg, newMsg, false)
        }
    } else if(!commands.has(command)) {
        return
    } else {
        try {
            commands.get(command).exec(args, msg)
        } catch(e) {
            console.error(e.message)
            msg.reply("an error occurred.")
        }
    }
}

module.exports = { commandCenter }