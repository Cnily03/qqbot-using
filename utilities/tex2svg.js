var { mathjax } = require('mathjax-full/js/mathjax');
var { TeX } = require('mathjax-full/js/input/tex');
var { FindTeX } = require("mathjax-full/js/input/tex/FindTeX")
var { SVG } = require('mathjax-full/js/output/svg');
var { LiteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor');
var { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html');
var { AllPackages } = require('mathjax-full/js/input/tex/AllPackages');

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
    const svg = adaptor
        .innerHTML(html.convert(equation, { display: !inline }))
        .replace(
            /(?<=<svg.+?>)/,
            `<style>*{fill: ${color};}</style>`
        );
    return svg.includes('merror') ? svg.replace(/<rect.+?><\/rect>/, '') : svg;
}

module.exports = tex2svg;