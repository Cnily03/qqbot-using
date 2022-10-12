const sharp = require("sharp")

const RESIZE = 3;

function svg2imgbuf(svg, bg = { r: 255, g: 255, b: 255 }, resize_percent = 1) {
    return new Promise((resolve, reject) => {
        try {
            const t = sharp(Buffer.from(svg))
            t.metadata().then(metadata => {
                // console.log(metadata);
                if (metadata.height <= 13) { reject('Syntax error'); return }
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

module.exports = svg2imgbuf