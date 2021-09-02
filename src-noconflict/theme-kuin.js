ace.define("ace/theme/kuin",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-kuin";
exports.cssText = ".ace-kuin .ace_gutter {\
	background: #FFEAEA;\
	color: #FF9393\
}\
.ace-kuin .ace_print-margin {\
	width: 1px;\
	background: #FFCCCC;\
}\
.ace-kuin {\
	background-color: #FFF5F5;\
	color: #808080;\
}\
.ace-kuin .ace_cursor {\
	color: #000000;\
}\
.ace-kuin .ace_marker-layer .ace_selection {\
	background: rgba(128, 128, 128, 0.20);\
}\
.ace-kuin.ace_multiselect .ace_selection.ace_start {\
	box-shadow: 0 0 3px 0px #141414;\
}\
.ace-kuin .ace_marker-layer .ace_bracket {\
	margin: -1px 0 0 -1px;\
	border: 1px solid rgba(255, 128, 0, 0.25);\
}\
.ace-kuin .ace_marker-layer .ace_active-line {\
	background: rgba(0, 0, 0, 0.031);\
}\
.ace-kuin .ace_marker-layer .ace_selected-word {\
	border: 1px solid rgba(0, 0, 0, 0.20);\
}\
.ace-kuin .ace_keyword,\
.ace-kuin .ace_constant {\
	color: #1400F6;\
}\
.ace-kuin .ace_storage {\
	color: #1400F6;\
}\
.ace-kuin .ace_constant.ace_numeric {\
	color: #EA0062;\
}\
.ace-kuin .ace_string {\
	color: #EA0062;\
}\
.ace-kuin .ace_comment {\
	color: #1EB000;\
}\
.ace-kuin .ace_keyword.ace_operator {\
	color: #333333;\
}\
.ace-kuin .ace_identifier {\
	color: #009BEA;\
}\
.ace-kuin .ace_error {\
	color: #FFFFFF;\
	background-color: #FF0000;\
}\
.ace-kuin .ace_variable.ace_global {\
	color: #CC00F6;\
}\
.ace-kuin .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});

(function() {
    ace.require(["ace/theme/kuin"], function(m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
