ace.define("ace/snippets/kuin",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippetText = "\n\
snippet func\n\
	func ${1:name}()\n\
		${2}\n\
	end func\n\
snippet class\n\
	class ${1:name}()\n\
		${2}\n\
	end class\n\
snippet enum\n\
	enum ${1:name}\n\
	end enum\n\
snippet if\n\
	if(${1:condition})\n\
		${2}\n\
	end if\n\
snippet elif\n\
	elif(${1:condition})\n\
		${2}\n\
snippet switch\n\
	switch(${1:val})\n\
		${2}\n\
	end switch\n\
snippet while\n\
	while(${1:condition})\n\
		${2}\n\
	end while\n\
snippet for\n\
	for ${1:i}(${2:0}, ${3:end})\n\
		${4}\n\
	end for\n\
snippet try\n\
	try\n\
		${1}\n\
	end try\n\
snippet block\n\
	block\n\
		${1}\n\
	end block\n\
";
exports.scope = "kuin";
});

(function() {
    ace.require(["ace/snippets/kuin"], function(m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
            