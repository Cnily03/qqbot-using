const osdk = require("oicq-sdk")
const oicq = require("oicq")
// const Bot = require("../index")
const listener = new osdk.Listener()
// const crypto = require("../utilities/crypto")
const sharp = require("sharp")

const tex2svg = require("../utilities/tex2svg")
const event_options = require("../config/options/math")

const RESIZE = 3;

function svg2imgbuf(svg, bg = { r: 255, g: 255, b: 255 }, resize_percent = 1) {
    return new Promise((resolve, reject) => {
        try {
            const t = sharp(Buffer.from(svg))
            t.metadata().then(metadata => {
                // console.log(metadata);
                t.resize({
                    width: parseInt(metadata.width * RESIZE * resize_percent),
                    height: parseInt(metadata.height * RESIZE * resize_percent),
                }).flatten({
                    background: bg
                }).png().toBuffer().then(resolve)
            })
        } catch (e) { reject(e) }
    })
}

function replaceStr(str, char, index) {
    return str.slice(0, index) + char + str.slice(index + 1, str.length)
}

listener.event("message", function (event) {
    var message = event.toString()
    const msgType = event.group_id ? "group" : (event.discuss_id ? "discuss" : "user")
    const dollar_count = message.split("$$").length
    if (dollar_count < 2) return;

    // 处理公式
    message = "$$" + message + "$$"
    for (let i = 0; message.includes("$$"); i++) {
        if (i % 2) {
            message = message.replace(/\$\$/, "}")
        } else { // 第奇数个 $$
            for (let k = message.indexOf("$$") + 1; k < message.length && !(message[k] == "$" && message[k + 1] == "$"); k++) {
                switch (message[k]) {
                    case "\\": message = replaceStr(message, "\\\\", k); k++; break;
                    case "{": message = replaceStr(message, "\\{", k); k++; break;
                    case "}": message = replaceStr(message, "\\}", k); k++; break;
                    case "#": message = replaceStr(message, "\\#", k); k++; break;
                    case "%": message = replaceStr(message, "\\%", k); k++; break;
                    case "&": message = replaceStr(message, "\\&", k); k++; break;
                    case "^": message = replaceStr(message, "\\^{ }", k); k += 4; break;
                    case "_": message = replaceStr(message, "\\_{ }", k); k += 4; break;
                    case "~": message = replaceStr(message, "\\~{ }", k); k += 4; break;
                    default: break;
                }
            }
            message = message.replace(/\$\$/, "\\text{")
        }
    }
    message = message.replace(/\\text\{\}/g, "")
    if (message) message = `\\text{ }${message}\\text{ }`

    // set theme
    var theme = "light"
    if (msgType == "group") theme = getGroupCfg(event.group_id, "theme") || "light"
    else if (msgType == "discuss") theme = getDiscussCfg(event.discuss_id, "theme") || "light"
    const theme_user = getUserCfg(event.sender.user_id, "theme")
    theme = theme_user || theme
    const bg = theme == "light" ? { r: 255, g: 255, b: 255 } : { r: 40, g: 44, b: 52 }

    // set resize
    var resize_percent = 1
    if (msgType == "group") resize_percent = getGroupCfg(event.group_id, "resize") || 1
    else if (msgType == "user") resize_percent = getDiscussCfg(event.discuss_id, "resize") || 1
    const resize_percent_user = getUserCfg(event.sender.user_id, "resize")
    resize_percent = resize_percent_user || resize_percent

    // handle picture
    if (message.trim()) {
        const svg = tex2svg(message, "display", theme == "light" ? "black" : "white")
        svg2imgbuf(svg, bg, resize_percent).then(imgbuf => {
            const image = oicq.segment.image(imgbuf)
            event.reply(image)
        }).catch(e => console.log(e))
    }

}, {
    include: {
        group: event_options.group
    }
}).event("message", function (event) {
    const message = event.toString().trim()
    if (/^\/tex config theme( (dark|light)( (user|group|discuss))?)?$/.test(message)) {
        // tex theme
        cfgCommand(message, event, "theme", "dark")

    } else if (/^\/tex config resize( [0-9\.]*( (user|group|discuss))?)?$/.test(message)) {
        // tex resize
        cfgCommand(message, event, "resize", 1, true)

    } else if (/^\/tex help$/.test(message)) {
        // tex help
        return event.reply([
            "/tex help",
            "/tex config theme [<theme> [target]]",
            "/tex config resize [<number> [target]]"
        ].join("\n"))
    } else if (/^\/tex/.test(message)) return event.reply('Syntax error, please try command "/tex help".')
}, {
    include: {
        group: event_options.group
    }
})

const CONFIG = {
    user: {},
    group: {},
    discuss: {}
}

function getGroupCfg(group_id, settings) {
    group_id = String(group_id)
    return (CONFIG.group[group_id] || {})[settings]
}

function setGroupCfg(group_id, settings, value) {
    group_id = String(group_id)
    if (!CONFIG.group[group_id]) CONFIG.group[group_id] = {}
    CONFIG.group[group_id][settings] = value;
    return value;
}
function getDiscussCfg(discuss_id, settings) {
    discuss_id = String(discuss_id)
    return (CONFIG.discuss[discuss_id] || {})[settings]
}

function setDiscussCfg(discuss_id, settings, value) {
    discuss_id = String(discuss_id)
    if (!CONFIG.discuss[discuss_id]) CONFIG.discuss[discuss_id] = {}
    CONFIG.discuss[discuss_id][settings] = value;
    return value;
}
function getUserCfg(user_id, settings) {
    user_id = String(user_id)
    return (CONFIG.user[user_id] || {})[settings]
}

function setUserCfg(user_id, settings, value) {
    user_id = String(user_id)
    if (!CONFIG.user[user_id]) CONFIG.user[user_id] = {}
    CONFIG.user[user_id][settings] = value;
    return value;
}

function cfgCommand(message, event, cfg_name, default_val, isNumber = false) {
    const msgType = event.group_id ? "group" : (event.discuss_id ? "discuss" : "user")
    // query
    if (message == "/tex config " + cfg_name) {
        const cur_cfg_val = {
            "user": getUserCfg(event.sender.user_id, cfg_name) || default_val,
            "group": getGroupCfg(event.group_id, cfg_name) || default_val,
            "discuss": getDiscussCfg(event.discuss_id, cfg_name) || default_val
        }[msgType]
        event.reply(`${{
            "user": "Your current config of \"" + cfg_name + "\"",
            "group": "Current config of \"" + cfg_name + "\" of this group",
            "discuss": "Current config of \"" + cfg_name + "\" of this discuss"
        }[msgType]} is ${cur_cfg_val}`)
    }
    // set
    let _val = message.split(`/tex config ${cfg_name} `)[1].trim().split(" ")[0].trim() || default_val
    const val = isNumber ? parseFloat(_val) : _val;
    const target = (message.split(`/tex config ${cfg_name} ${val} `)[1] || "user").trim()
    if (target == "user") {
        setUserCfg(event.sender.user_id, cfg_name, val)
    } else if (target == "group") {
        if (msgType == "group") setGroupCfg(event.group_id, cfg_name, val)
        else return event.reply("Cannot set theme outside a group.")
    } else if (target == "discuss") {
        if (msgType == "discuss") setDiscussCfg(event.discuss_id, cfg_name, val)
        else return event.reply("Cannot set theme outside a discuss.")
    }
    return event.reply(`Successfully set ${{
        "user": "your config of \"" + cfg_name + "\"",
        "group": "config of \"" + cfg_name + "\" in this group",
        "discuss": "config of \"" + cfg_name + "\" in this discuss"
    }[target]} to ${typeof val == "number" ? `number ${val}` : `value "${val}"`}.`)
}

module.exports = listener;