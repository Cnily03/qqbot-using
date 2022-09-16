const osdk = require("oicq-sdk");
const math_listener = require("./listeners/math")
const CONFIG = require("./config/config")

if (/[0-9]+/.test(this._account_ = process.argv.reverse()[0]))
    CONFIG.account = parseInt(this._account_)

const Bot = new osdk.Bot(CONFIG.account)
Bot.loginByToken().catch(_ => {
    Bot.loginByPassword().catch(_ => {
        Bot.loginByQRCode().catch(e => { console.log(e) });
    })
})

Bot.use(math_listener);

module.exports = Bot;