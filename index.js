const osdk = require("oicq-sdk");
const math_listener = require("./listeners/math")

const Bot = new osdk.Bot(3136377562)
Bot.loginByToken().catch(_ => {
    Bot.loginByPassword().catch(_ => {
        Bot.loginByQRCode().catch(e => { console.log(e) });
    })
})

Bot.use(math_listener);

module.exports = Bot;