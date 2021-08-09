ace.define("ace/mode/kuin_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var KuinHighlightRules = function() {
    var keywords = (
        "func|var|const|class|enum|" +
        "if|elif|else|switch|case|default|while|for|try|catch|finally|block|" +
        "do|break|skip|ret|assert|throw|" +
        "end|to|me|super|alias|include|excode"
    );

    var storageType = (
        "int|float|char|bool|bit8|bit16|bit32|bit64|list|stack|queue|dict"
    );

    var builtinConstants = (
        "true|false|null|inf|dbg|env"
    );

    var keywordMapper = this.createKeywordMapper({
        "keyword": keywords,
        "storage.type": storageType,
        "constant.language": builtinConstants
    }, "identifier");

    this.$rules = {
        start: [{
            include: "expr"
        }, {
            token: keywordMapper,
            regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/
        }],

        expr: [{
            include: ["block_comment", "line_comment", "string", "character"]
        }, {
            token: "constant.numeric",
            regex: /\b\d+\.\d+(?:e[+-]\d+)?\b/
        }, {
            token: "constant.numeric",
            regex: /\b(?:\d+|0x[\dA-F]+)(?:b(?:8|16|32|64))?\b/
        }, {
            token: "variable.global",
            regex: /(?:[a-zA-Z_][a-zA-Z0-9_]*)?[@][a-zA-Z0-9_]+\b/
        }, {
            token: "keyword.operator",
            regex: /:|::|#|##|!|~|\+|-|\/|\*|%|&|\||\^|=|<>|<|>|<=|>=|=&|<>&|=\$|<>\$|\$|\$>|\$</
        }, {
            token: "paren.lparen",
            regex: /[(]/
        }, {
            token: "paren.rparen",
            regex: /[)]/
        }, {
            token: "text",
            regex: /\s+/
        }],

        character: [{
            token: "string",
            regex: /'(?:\\(?:[\\|"|'|0|n|t]|u[0-9A-F]{4})|.)'/,
        }],

        string: [{
            token: "string",
            regex: /"/,
            push: [{
                include: "toStr"
            }, {
                token: "string",
                regex: /\\\\/,
            }, {
                token: "string",
                regex: /\\"/,
            }, {
                token: "string",
                regex: /"|$/,
                next: "pop"
            }, {
                defaultToken: "string"
            }]
        }],

        line_comment: [{
            token: "comment",
            regex: /;.*$/,
        }],

        block_comment: [{
            token: "comment",
            regex: /{/,
            push: [{
                include: ["block_comment", "line_comment", "string", "character"]
            }, {
                token: "comment",
                regex: /}/,
                next: "pop"
            }, {
                defaultToken: "comment"
            }]
        }],

        toStr: [{
            token: "string",
            regex: /\\{/,
            push: [{
                include: "expr"
            }, {
                token: keywordMapper,
                regex: /[a-zA-Z_][a-zA-Z0-9_]*\b/
            }, {
                token: "string",
                regex: /}/,
                next: "pop"
            }]
        }],
    };

    this.normalizeRules();
};

oop.inherits(KuinHighlightRules, TextHighlightRules);

exports.KuinHighlightRules = KuinHighlightRules;
});

ace.define("ace/mode/kuin",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/kuin_highlight_rules","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var KuinHighlightRules = require("./kuin_highlight_rules").KuinHighlightRules;
var Range = require("../range").Range;

var Mode = function() {
    this.HighlightRules = KuinHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = ";";

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;

        if (tokens.length && tokens[tokens.length - 1].type == "comment") {
            return indent;
        }
        if (state == "start") {
            if (isIndent(line)) {
                indent += tab;
            }
        }
        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return isOutdent(line + input);
    };

    this.autoOutdent = function(state, session, row) {
        var line = session.getLine(row);
        var indent = this.$getIndent(line).length;
        var linePrev = session.getLine(row - 1);
        var indentPrev = this.$getIndent(linePrev).length;
        if (indent < indentPrev + (isIndent(linePrev) ? 1 : 0)) {
            return;
        }
        session.outdentRows(new Range(row, 0, row + 1, 0));
    };

    function isIndent(line){
        return line.match(/^\s*(func|class|enum|if|elif|else|switch|case|default|while|for|try|catch|finally|block)\b/);
    }

    function isOutdent(line){
        return line.match(/^\s*(end|elif|else|case|default|catch|finally)\b/);
    }

    this.$id = "ace/mode/kuin";
    this.snippetFileId = "ace/snippets/kuin";
}).call(Mode.prototype);

exports.Mode = Mode;

});

(function() {
    ace.require(["ace/mode/kuin"], function(m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
