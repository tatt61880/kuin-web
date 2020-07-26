"use strict";!function(f){let d=document;function h(){d.removeEventListener("DOMContentLoaded",h);removeEventListener("load",h);f(d)}"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll?setTimeout(f):(d.addEventListener("DOMContentLoaded",h),addEventListener("load",h))}(function(d){
	let logTypeId = "";
	let compile = d.getElementById("compile"), log = d.getElementById("log"), output = d.getElementById("output"), included = false;
	compile.addEventListener("click", function(){
		let src = encodeURIComponent(editor.getValue());
		updateTweetButton(src);

		let platforms = document.getElementById("platform"), target = null, write = null, extra = null;
		let platform = platforms.options[platforms.selectedIndex].value;
		if(platform === "run"){
			target = "web";
			write = function(p, s, c){ if(p === "./out.js") c.S += fromUtf8(s); };
			extra = ["-x", "static"];
		}else if(platform === "web"){
			target = "web";
			write = function(p, s, c){ c.S += fromUtf8(s); };
			extra = ["-x", "merge"];
		}else if(platform === "cpp"){
			target = "cpp";
			write = function(p, s, c){ c.S += fromUtf8(s); };
			extra = ["-x", "merge"];
		}else{
			window.alert("Unexpected platform.");
			return;
		}
		output.value = "";
		removeLog();
		let code = { S: "" };
		if (!included){
			included = true;
			addLog("スクリプトをロード中。");
			var script = document.createElement("script");
			script.src = "js/kuin.js";
			script.onload = function(){
				if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete"){
					addLog("スクリプトがロード完了。");
					run();
				}
			};
			d.getElementsByTagName('head')[0].appendChild(script);
		}
		else
			run();

		function run()
		{
			kuin({
				cmdLine: ["-i", "main.kn", "-s", "res/sys/", "-e", target].concat(extra),
				readFile: function(p){
					var src = editor.getValue();
					if(p === "./main.kn") return toUtf8(src);
					return null;
				},
				writeFile: function(p, s){ write(p, s, code); },
				print: function(s){ addLog(s); }
			});
			if(platform === "run")
				eval(code.S + "out({print:function(s){output.value+=s}});");
			else
				output.value = code.S;
		}

		function toUtf8(s)
		{
			let r = new Uint8Array(0);
			for(let i = 0; i < s.length; i++){
				let data = s.charCodeAt(i), u;
				if ((data >> 7) == 0)
				{
					u = data;
					r = concat(r, Uint8Array.from([u & 0xff]));
				}
				else
				{
					u = (0x80 | (data & 0x3f)) << 8;
					data >>= 6;
					if ((data >> 5) == 0)
					{
						u |= 0xc0 | data;
						r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff]));
					}
					else
					{
						u = (u | 0x80 | (data & 0x3f)) << 8;
						data >>= 6;
						if ((data >> 4) == 0)
						{
							u |= 0xe0 | data;
							r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff]));
						}
						else
						{
							u = (u | 0x80 | (data & 0x3f)) << 8;
							data >>= 6;
							if ((data >> 3) == 0)
							{
								u |= 0xf0 | data;
								r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff, (u >> 24) & 0xff]));
							}
							else
								return r;
						}
					}
				}
			}
			return r;
		}
		
		function fromUtf8(s)
		{
			let r = "", len;
			for(let i = 0; i < s.length; i++)
			{
				let c = s[i];
				if ((c & 0xc0) == 0x80)
					continue;
				if ((c & 0x80) == 0x00)
					len = 0;
				else if ((c & 0xe0) == 0xc0)
				{
					len = 1;
					c &= 0x1f;
				}
				else if ((c & 0xf0) == 0xe0)
				{
					len = 2;
					c &= 0x0f;
				}
				else if ((c & 0xf8) == 0xf0)
				{
					len = 3;
					c &= 0x07;
				}
				else if ((c & 0xfc) == 0xf8)
				{
					len = 4;
					c &= 0x03;
				}
				else if ((c & 0xfe) == 0xfc)
				{
					len = 5;
					c &= 0x01;
				}
				let u = c;
				for (let j = 0; j < len && i < s.length; j++, i++)
				{
					c = s[i];
					u = (u << 6) | (c & 0x3f);
				}
				r += String.fromCharCode(u);
			}
			return r;
		}
		
		function concat(a, b)
		{
			var c = new Uint8Array(a.length + b.length);
			c.set(a);
			c.set(b, a.length);
			return c;
		}
	});
	removeLog();
	output.value = "";
	log.addEventListener("click", selectLog );
	output.addEventListener("focus", function(){ this.select(); } );
	d.getElementById("src").addEventListener("focus", function(){ d.getElementById('buttonTweet').style.visibility = 'hidden'; } );
	
	function removeLog()
	{
		while(log.firstChild){
			log.removeChild(log.firstChild);
		}
	}
	
	function addLog(str)
	{
		if (str.match(/^0x[\dA-F]{8}: /)) {
			logTypeId = str;
		} else if (str.match(/^\[.*\]$/)) {
			logTypeId += str;
		} else {
			let li = document.createElement("li");
			li.textContent = logTypeId + str;
			log.appendChild(li);
			logTypeId = "";
		}
	}

	function selectLog(e)
	{
		let match;
		if (match = e.target.textContent.match(/^0x[\dA-F]{8}: \[\\main: (\d+), (\d+)\]/)) {
			let row = match[1];
			let column = match[2];
			editor.navigateTo(row - 1, column - 1);
			editor.scrollToLine(row, true, true);
		}
	}
})

function updateTweetButton(src)
{
	let b = document.getElementById('buttonTweet');
	while (b.firstChild != null) b.removeChild(b.firstChild);
	let ele = document.createElement('a');
	ele.setAttribute('href', 'https://twitter.com/share');
	ele.setAttribute('class', 'twitter-share-button');
	ele.setAttribute('data-text', 'KuinWeb');
	let href = location.href;
	let questionPos = href.search('\\?');
	if (questionPos != -1) {
		href = href.substr(0, questionPos);
	}
	ele.setAttribute('data-url', href + (src === null ? '' : ('?src=' + src)));
	ele.setAttribute('data-hashtags', 'KuinWeb');
	ele.appendChild(document.createTextNode('tweet'));
	b.appendChild(ele);

	twttr.widgets.load();
}