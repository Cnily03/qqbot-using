const osdk = require("oicq-sdk")
const oicq = require("oicq")
// const Bot = require("../index")
const listener = new osdk.Listener()
// const crypto = require("../utilities/crypto")

const replyEvent = (_event_, _msg_, _quote_ = false) => {
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
        else return replyEvent(event, SYNTAX_ERROR_MSG)
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
    else if (msgType == "discuss") resize_percent = getDiscussCfg(event.discuss_id, "resize") || 1
    const resize_percent_user = getUserCfg(event.sender.user_id, "resize")
    resize_percent = resize_percent_user || resize_percent

    // 处理公式
    const equation = raw2tex(message);
    if (equation.split("{").length != equation.split("}").length || !equation) return replyEvent(event, SYNTAX_ERROR_MSG)
    // handle picture
    if (equation.trim()) {
        const svg = tex2svg(equation, "display", theme == "light" ? "black" : "white")
        if (svg === false) return replyEvent(event, SYNTAX_ERROR_MSG)
        svg2imgbuf(svg, bg, resize_percent).then(imgbuf => {
            const image = oicq.segment.image(imgbuf)
            replyEvent(event, image)
        }).catch(e => console.log(e))
    }

}, {
    include: {
        group: event_options.group
    }
}).event("message", function (event) { // command
    const message = event.toString().trim()
    if (/^\/tex config theme( (auto|dark|light)( (user|group|discuss))?)?$/.test(message)) {
        // tex theme
        handleCfgCmd(message, event, "theme", "light")

    } else if (/^\/tex config resize( (auto|[0-9\.]*)( (user|group|discuss))?)?$/.test(message)) {
        // tex resize
        handleCfgCmd(message, event, "resize", 1, true, 0.5, 10)

    } else if (/^\/tex help( .+)?$/.test(message)) {
        // tex help
        if (/^\/tex help$/.test(message)) {
            return replyEvent(event, [
                "/tex help [subcommand [...]]",
                "/tex config <name> [<value> [target]]"
            ].join("\n"))
        } else if (message[10] && message[10] != ' ') {
            const query_cfg = message.split("tex help ")[1].trim();
            switch (query_cfg) {
                case "config":
                    return replyEvent(event, [
                        "/tex config <name> [<value> [target]]",
                        " - name: theme | resize",
                        "",
                        "Try \"/tex help config <name>\"."
                    ].join("\n"))
                case "config theme":
                    return replyEvent(event, [
                        "/tex config theme [<theme> [target]]",
                        " - theme: auto | dark | light",
                        " - target: user | group | discuss"
                    ].join("\n"))
                case "config resize":
                    return replyEvent(event, [
                        "/tex config resize [<number> [target]]",
                        " - number: auto | range(0.5, 10)",
                        " - target: user | group | discuss"
                    ].join("\n"))
                default:
                    return replyEvent(event, `There is no command as "/tex ${query_cfg}".`)
            }
        }
    } else if (/^\/tex/.test(message)) return replyEvent(event, 'Syntax error. Please try command "/tex help".')
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

function handleCfgCmd(message, event, cfg_name, default_val, isNumber = false, min_number = 0, max_number = 1000000) {
    const msgType = event.group_id ? "group" : (event.discuss_id ? "discuss" : "user")
    // query
    if (message == "/tex config " + cfg_name) {
        var useDefault = false;
        function defaultVal() {
            useDefault = true
            return default_val
        }
        const cur_cfg_val = {
            "user": getUserCfg(event.sender.user_id, cfg_name) || defaultVal(),
            "group": getGroupCfg(event.group_id, cfg_name) || defaultVal(),
            "discuss": getDiscussCfg(event.discuss_id, cfg_name) || defaultVal()
        }[msgType]
        return replyEvent(event, `${{
            "user": "Your current config of \"" + cfg_name + "\"",
            "group": "Current config of \"" + cfg_name + "\" of this group",
            "discuss": "Current config of \"" + cfg_name + "\" of this discuss"
        }[msgType]} is ${isNumber ? cur_cfg_val : '"' + cur_cfg_val + '"'}` + (useDefault ? " (auto default)" : "") + `.`)
    }
    // set
    const _val = message.split(`/tex config ${cfg_name} `)[1].trim().split(" ")[0].trim() || default_val
    var setAuto = false;
    if (_val == "auto") setAuto = true;
    const val = setAuto ? undefined : (isNumber ? parseFloat(_val) : _val);

    if (!setAuto) {
        if (isNumber && val < min_number)
            return replyEvent(event, `The number ${val} is too low! The minimum value of "${cfg_name}" is ${min_number}.`)
        if (isNumber && val > max_number)
            return replyEvent(event, `The number ${val} is too high! The maximum value of "${cfg_name}" is ${max_number}.`)
    }

    const target = (message.split(`/tex config ${cfg_name} ${_val} `)[1] || "user").trim()
    if (target == "user") {
        setUserCfg(event.sender.user_id, cfg_name, val)
    } else if (target == "group") {
        if (msgType == "group") setGroupCfg(event.group_id, cfg_name, val)
        else return replyEvent(event, "Cannot set theme outside a group.")
    } else if (target == "discuss") {
        if (msgType == "discuss") setDiscussCfg(event.discuss_id, cfg_name, val)
        else return replyEvent(event, "Cannot set theme outside a discuss.")
    }
    return replyEvent(event, `Successfully set ${{
        "user": "your config of \"" + cfg_name + "\"",
        "group": "config of \"" + cfg_name + "\" in this group",
        "discuss": "config of \"" + cfg_name + "\" in this discuss"
    }[target]} to ` + (setAuto ? `"auto"` : `${typeof val == "number" ? `number ${val}` : `value "${val}"`}`) + `.`)
}

module.exports = listener;
