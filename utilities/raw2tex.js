function replaceStr(str, char, index) {
    return str.slice(0, index) + char + str.slice(index + 1, str.length)
}

function raw2tex(text) {
    text = text.replace(/\$\$/g, "\r$")
    while (text.includes("\r\r")) {
        text = text.replace(/\r\r/g, "\r")
    }
    text = `$${text}$`
    for (let i = 0; text.includes("$"); i++) {
        if (i % 2) { // 第奇数个 $
            text = text.replace(/\$/, "}")
        } else {
            for (let k = text.indexOf("$") + 1; k < text.length && !(text[k] == "$"); k++) {
                switch (text[k]) {
                    case "\r": text = replaceStr(text, "}\\\\\\text{", k); k += 8; break;
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
            text = text.replace(/\$/, "\\text{")
        }
    }
    text = text.replace(/ /g, "").replace(/\\text\{\}/g, "").trim()
    if (text) text = `\\text{ }\\begin{array}{}${text}\\end{array}\\text{ }`
    return text;
}
module.exports = raw2tex