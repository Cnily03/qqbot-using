var { mathjax } = require('mathjax-full/js/mathjax')
var { TeX } = require('mathjax-full/js/input/tex')
var { FindTeX } = require("mathjax-full/js/input/tex/FindTeX")
var { SVG } = require('mathjax-full/js/output/svg')
var { LiteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor')
var { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html')
var { AllPackages } = require('mathjax-full/js/input/tex/AllPackages')

const CN_FONT_FAMILY = require("../config/math").cn_font_family

// MathJax bootstrap
const adaptor = new LiteAdaptor();
RegisterHTMLHandler(adaptor);

const html = mathjax.document('', {
    InputJax: new TeX({
        packages: AllPackages,
        // FindTex: new FindTeX({
        inlineMath: [              // start/end delimiter pairs for in-line math
            ['$', '$'],
            ['\\(', '\\)']
        ],
        displayMath: [             // start/end delimiter pairs for display math
            ['$$', '$$'],
            ['\\[', '\\]']
        ],
        processEscapes: true,      // use \$ to produce a literal dollar sign
        processEnvironments: true, // process \begin{xxx}...\end{xxx} outside math mode
        processRefs: true          // process \ref{...} outside of math mode
        // })
    }),
    OutputJax: new SVG({
        fontCache: 'none'
    }),
})

function tex2svg(equation, type = "display", color = "black") {
    const inline = type.trim() == "inline";
    // console.log(adaptor.innerHTML(html.convert(equation, { display: !inline })))
    const raw_svg = adaptor
        .innerHTML(html.convert(equation, { display: !inline }))
    if (/>\\text\{ \}\\begin\{array\}\{\}\\begin\{align\}/.test(raw_svg)) return false
    const svg = raw_svg.replace(/font\-family\=\"serif\">/g, `font-family="${CN_FONT_FAMILY}">`)
        .replace(
            /(?<=<svg.+?>)/,
            `<style>*{fill: ${color};}</style>`
        );
    return svg.includes('merror') ? svg.replace(/<rect.+?><\/rect>/, '') : svg
}

module.exports = tex2svg