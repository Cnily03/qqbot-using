const osdk = require("oicq-sdk")
const oicq = require("oicq")
// const Bot = require("../index")
const listener = new osdk.Listener()
// const crypto = require("../utilities/crypto")

const replayEvent = (_event_, _msg_, _quote_ = false) => {
    try {
        if (_event_.group_id && _event_.group.mute_left) return // be muted
        return _event_.reply(_msg_, _quote_)
    } catch (e) {
        console.log(e)
        return e
    }
}

const raw2tex = require("../utilities/raw2tex")
const tex2svg = require("../utilities/tex2svg")
const svg2imgbuf = require("../utilities/svg2imgbuf")
const event_options = require("../config/math").options

listener.event("message", function (event) { // equation
    const SYNTAX_ERROR_MSG = "Syntax error. Please check your MathJax code.";

    var message = event.raw_message, message_backup = event.toString()

    function isEquationValid(text) {
        const dolloar_count = text.replace(/\\\$/g, "").split("$").length - 1
        if (dolloar_count < 2) return -1 // not equation
        if (!dolloar_count % 2) return 0 // syntax error
        return 1;
    }

    let _error_1, _error_2
    if ((_error_1 = isEquationValid(message)) > 0) { }
    else {
        if ((_error_2 = isEquationValid(message_backup)) > 0) message = message_backup
        else if (message.length > message_backup.length ? _error_1 : _error_2) return
        else return replayEvent(event, SYNTAX_ERROR_MSG)
    }

    const msgType = event.group_id ? "group" : (event.discuss_id ? "discuss" : "user")

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

    // 处理公式
    const equation = raw2tex(message);
    if (equation.split("{").length != equation.split("}").length || !equation) return replayEvent(event, SYNTAX_ERROR_MSG)
    // handle picture
    if (equation.trim()) {
        const svg = tex2svg(equation, "display", theme == "light" ? "black" : "white")
        if (svg === false) return replayEvent(event, SYNTAX_ERROR_MSG)
        svg2imgbuf(svg, bg, resize_percent).then(imgbuf => {
            const image = oicq.segment.image(imgbuf)
            replayEvent(event, image)
        }).catch(e => console.log(e))
    }

}, {
    include: {
        group: event_options.group
    }
}).event("message", function (event) { // command
    const message = event.toString().trim()
    if (/^\/tex config theme( (dark|light)( (user|group|discuss))?)?$/.test(message)) {
        // tex theme
        handleCfgCmd(message, event, "theme", "dark")

    } else if (/^\/tex config resize( [0-9\.]*( (user|group|discuss))?)?$/.test(message)) {
        // tex resize
        handleCfgCmd(message, event, "resize", 1, true)

    } else if (/^\/tex help$/.test(message)) {
        // tex help
        return replayEvent(event, [
            "/tex help",
            "/tex config theme [<theme> [target]]",
            "/tex config resize [<number> [target]]"
        ].join("\n"))
    } else if (/^\/tex/.test(message)) return replayEvent(event, 'Syntax error. Please try command "/tex help".')
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

function handleCfgCmd(message, event, cfg_name, default_val, isNumber = false) {
    const msgType = event.group_id ? "group" : (event.discuss_id ? "discuss" : "user")
    // query
    if (message == "/tex config " + cfg_name) {
        const cur_cfg_val = {
            "user": getUserCfg(event.sender.user_id, cfg_name) || default_val,
            "group": getGroupCfg(event.group_id, cfg_name) || default_val,
            "discuss": getDiscussCfg(event.discuss_id, cfg_name) || default_val
        }[msgType]
        replayEvent(event, `${{
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
        else return replayEvent(event, "Cannot set theme outside a group.")
    } else if (target == "discuss") {
        if (msgType == "discuss") setDiscussCfg(event.discuss_id, cfg_name, val)
        else return replayEvent(event, "Cannot set theme outside a discuss.")
    }
    return replayEvent(event, `Successfully set ${{
        "user": "your config of \"" + cfg_name + "\"",
        "group": "config of \"" + cfg_name + "\" in this group",
        "discuss": "config of \"" + cfg_name + "\" in this discuss"
    }[target]} to ${typeof val == "number" ? `number ${val}` : `value "${val}"`}.`)
}

module.exports = listener;