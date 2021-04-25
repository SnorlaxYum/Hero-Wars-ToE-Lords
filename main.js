const Discord = require("discord.js")
const client = new Discord.Client({restRequestTimeout:150000})

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
})

try{
    client.login(process.env.TOKEN).then(res => {
        console.log("Request success")
        console.dir(res)
    }, rej => {
        console.log("Request rejection")
        console.error(rej)
    })
} catch(e) {
    console.log("Request error")
    console.dir(e)
}