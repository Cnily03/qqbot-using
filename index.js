const osdk = require("oicq-sdk");
const math_listener = require("./listeners/math")
const CONFIG = require("./config/config")

if (/ test [0-9]+/.test(process.argv.join(" ")))
    CONFIG.account = parseInt(process.argv.join(" ").match(/ test [0-9]+/)[0].split(" test ")[1])

const Bot = new osdk.Bot(CONFIG.account)
Bot.loginByToken().catch(_ => {
    Bot.loginByPassword().catch(_ => {
        Bot.loginByQRCode().catch(e => { console.log(e) });
    })
})

Bot.use(math_listener);

module.exports = Bot;
