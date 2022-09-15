const crypto = require("crypto")

// AES加密解密
const DEFAULT_AES_ALGORITHM = "aes-128-cbc";

const base64 = {
    encode: function (str) {
        const code = Buffer.from(str, 'utf-8').toString('base64');
        return code;
    },
    decode: function (str) {
        const code = Buffer.from(str, 'base64').toString('utf-8');
        return code;
    }
}

const aes = {
    encode: function (str, aesKey, aesIv = aesKey,
        algorithm = DEFAULT_AES_ALGORITHM) {
        const key = Buffer.from(aesKey, "utf8");
        const iv = Buffer.from(aesIv, "utf8");
        var cipher = crypto.createCipheriv(algorithm, key, iv);
        var code = cipher.update(str, "utf8", "hex");
        code += cipher.final("hex");
        return code;
    },
    decode: function (str, aesKey, aesIv = aesKey,
        algorithm = DEFAULT_AES_ALGORITHM) {
        const key = Buffer.from(aesKey, "utf8");
        const iv = Buffer.from(aesIv, "utf8");
        var cipher = crypto.createDecipheriv(algorithm, key, iv);
        var code = cipher.update(str, "hex", "utf8");
        code += cipher.final("utf8");
        return code;
    }
}

const rsa = {
    encodeByPub: function (str, pubKey) {
        const buf = crypto.publicEncrypt(pubKey, Buffer.from(str, "utf8"));
        return buf.toString("hex");
    },
    encodeByPte: function (str, pteKey) {
        const buf = crypto.privateEncrypt(pteKey, Buffer.from(str, "utf-8"));
        return buf.toString("hex");
    },
    decodeByPte: function (str, pteKey) {
        const buf = crypto.privateDecrypt(pteKey, Buffer.from(str, "hex"));
        return buf.toString("utf8");
    },
    decodeByPub: function (str, pubKey) {
        const buf = crypto.publicDecrypt(pubKey, Buffer.from(str, "hex"));
        return buf.toString("utf8");
    }
}

function sha256(str) {
    var sha256 = crypto.createHash("sha256");
    var code = sha256.update(str).digest("hex");
    return code;
}

function sha128(str) {
    var sha128 = crypto.createHash("sha128");
    var code = sha128.update(str).digest("hex");
    return code;
}


function sha1(str) {
    var sha1 = crypto.createHash("sha1");
    var code = sha1.update(str).digest("hex");
    return code;
}

function md5(str) {
    var md5 = crypto.createHash("md5");
    var code = md5.update(str).digest("hex");
    return code;
}

module.exports = {
    base64, aes, rsa, sha1, sha128, sha256, md5
}