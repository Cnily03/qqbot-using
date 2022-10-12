function replaceStr(str, char, index) {
    return str.slice(0, index) + char + str.slice(index + 1, str.length)
}

function raw2tex(text) {
    text = " " + text;
    text = text.replace(/\r/g, "\n").replace(/([^\\])\$\$/g, "$1\n$\n").trim()
    while (text.includes("\n\n")) {
        text = text.replace(/\n\n/g, "\n")
    }
    text = ` $${text} $`
    for (let i = 0; text.replace(/\\\$/g, "").includes("$"); i++) {
        if (i % 2) { // 第奇数个 $ - 闭合 text, 开始 equation
            text = text.replace(/([^\\])\$/, "$1}")
        } else { // 第偶数个 $ - 闭合 equation, 开始 text
            function isloop(text, k) {
                if (k >= text.length) return false
                if (text[k] == "$") return text[k - 1] == "\\" ? true : false
                return true
            }
            for (let k = text.replace(/\\\$/g, "--").indexOf("$") + 1; isloop(text, k); k++) {
                if (text[k] == "\\" && text[k + 1] == "$") continue
                if (text[k - 1] == "\\" && text[k] == "$") continue
                switch (text[k]) {
                    case "\n": text = replaceStr(text, "}\\\\\\text{", k); k += 8; break;
                    case "\\": text = replaceStr(text, "\\\\", k); k++; break;
                    case "{": text = replaceStr(text, "\\{", k); k++; break;
                    case "}": text = replaceStr(text, "\\}", k); k++; break;
                    case "#": text = replaceStr(text, "\\#", k); k++; break;
                    case "%": text = replaceStr(text, "\\%", k); k++; break;
                    case "&": text = replaceStr(text, "\\&", k); k++; break;
                    case "^": text = replaceStr(text, "\\^{ }", k); k += 4; break;
                    case "_": text = replaceStr(text, "\\_{ }", k); k += 4; break;
                    case "~": text = replaceStr(text, "\\~{ }", k); k += 4; break;
                    default: break;
                }
            }
            text = text.replace(/([^\\])\$/, "$1\\text{")
        }
    }
    text = text[text.length - 2] == " " ? text.slice(0, text.length - 2) + "}" : text
    text = text.replace(/\\text\{\}/g, "").replace(/\\$/g, "$").trim()
    if (text.replace(/ /g, "")) text = `\\text{ }\\begin{array}{}${text}\\end{array}\\text{ }`
    return text
}

module.exports = raw2tex