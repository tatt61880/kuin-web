'use strict';
!function(f) {
	let d = document;
	function h() {
		d.removeEventListener('DOMContentLoaded',h);
		removeEventListener('load',h);
		f(d);
	}
	'complete' === d.readyState || 'loading' !== d.readyState && !d.documentElement.doScroll
		? setTimeout(f)
		: (d.addEventListener('DOMContentLoaded',h), addEventListener('load',h));
}

(function(d) {
	let logTypeId = '';
	const executeButton = d.getElementById('execute_button');
	const elemIdSrc = 'src';
	const elemIdInput = 'input';
	const elemSrc = d.getElementById(elemIdSrc);
	const elemInput = d.getElementById(elemIdInput);
	const elemOutput = d.getElementById('output');
	const elemLog = d.getElementById('log');
	const paramNameSrc = 'src';
	const paramNameInput = 'input';
	let included = false;
	let editor;
	let isButtonEnable = false;
	let version = '';
	let elemAceTextLayer;

	removeLog();
	elemOutput.value = '';
	elemLog.addEventListener('click', selectLog);
	elemOutput.addEventListener('focus', function() { this.select(); });
	elemSrc.addEventListener('focus', function() {
		d.getElementById('buttonTweet').style.visibility = 'hidden'; 
	});

	executeButton.addEventListener('click', onClick);
	enableButton();

	function onClick() {
		if (!isButtonEnable) {
			return;
		}
		disableButton();
		let srcEncoded = encodeURIComponent(editor.getValue());
		let inputEncoded = encodeURIComponent(elemInput.value);
		updateTweetButton(srcEncoded, inputEncoded);

		document.getElementById('k_body').textContent = '';
		let platforms = document.getElementById('platform');
		let platform = platforms.options[platforms.selectedIndex].value;
		let target = null;
		let write = null;
		let extra = null;
		if (platform === 'run') {
			target = 'web';
			write = function(p, s, c) {
				if(p === './out.js') {
					c.S += fromUtf8(s);
				}
			};
			extra = ['-x', 'static'];
		} else if (platform === 'web') {
			target = 'web';
			write = function(p, s, c) {
				c.S += fromUtf8(s);
			};
			extra = ['-x', 'merge'];
		} else if (platform === 'cpp') {
			target = 'cpp';
			write = function(p, s, c) {
				const langName = 'Kuin Programming Language' + version;
				c.S += '#if 0 // ' + langName + '\n';
				c.S += editor.getValue() + '\n';
				c.S += '#endif\n';
				c.S += '// C++ code below is transpiled from Kuin code above by ' + langName + '\n';
				c.S += fromUtf8(s);
			};
			extra = ['-x', 'merge'];
		} else {
			window.alert('Unexpected platform.');
			return;
		}
		elemOutput.value = '';
		removeLog();
		let code = { S: '' };
		if (!included) {
			included = true;
			const scriptName = 'kuin_ja.js';
			addLog(scriptName + ' のロード中。');
			let script = document.createElement('script');
			script.src = 'js/' + scriptName + '?2021-07-17';
			script.onload = function() {
				if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
					addLog(scriptName + ' のロード完了。');
					let tmp = extra;
					extra = ['-v'];
					run(false);
					extra = tmp;

					// 処理を続ける前に現時点までのメッセージを画面に反映させるためにこうします。
					setTimeout(function () { run(true); }, 0);
				}
			};
			d.getElementsByTagName('head')[0].appendChild(script);
		} else {
			if (version != '') {
				addLog('Kuin Programming Language' + version);
			}
			setTimeout(function () { run(true); }, 0);
		}

		function run(enable) {
			kuin({
				cmdLine:
					['-i', 'main.kn', '-s', 'res/sys/', '-e', target].concat(extra),
				readFile:
					function(p) {
						let src = editor.getValue();
						if (p === './main.kn') {
							return toUtf8(src);
						}
						return null;
					},
				writeFile:
					function(p, s) {
						write(p, s, code);
					},
				print:
					function(s) {
						addLog(s);
					}
			});
			if (platform === 'run') {
				let inputStr = elemInput.value;
				let data = [];
				for (let i = 0; i < inputStr.length; i++) {
					data.push(inputStr.charCodeAt(i));
				}
				let idx = 0;
				let print =
					function(s) {
						elemOutput.value += s;
					};
				let inputLetter =
					function() {
						if (idx < data.length) {
							return data[idx++];
						} else {
							return 0xFFFF;
						}
					};
				eval(code.S + ' if (typeof out !== "undefined") { out({'
					+ 'print:' + print.toString() + ', '
					+ 'inputLetter:' + inputLetter.toString()
					+ '}); }');
			} else {
				elemOutput.value = code.S;
			}
			if (enable) {
				enableButton();
			}
		}

		function toUtf8(s) {
			let r = new Uint8Array(0);
			for (let i = 0; i < s.length; i++) {
				let data = s.charCodeAt(i), u;
				if ((data >> 7) == 0) {
					u = data;
					r = concat(r, Uint8Array.from([u & 0xff]));
				} else {
					u = (0x80 | (data & 0x3f)) << 8;
					data >>= 6;
					if ((data >> 5) == 0) {
						u |= 0xc0 | data;
						r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff]));
					} else {
						u = (u | 0x80 | (data & 0x3f)) << 8;
						data >>= 6;
						if ((data >> 4) == 0) {
							u |= 0xe0 | data;
							r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff]));
						} else {
							u = (u | 0x80 | (data & 0x3f)) << 8;
							data >>= 6;
							if ((data >> 3) == 0) {
								u |= 0xf0 | data;
								r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff, (u >> 24) & 0xff]));
							} else {
								return r;
							}
						}
					}
				}
			}
			return r;

			function concat(a, b) {
				let c = new Uint8Array(a.length + b.length);
				c.set(a);
				c.set(b, a.length);
				return c;
			}
		}

		function fromUtf8(s) {
			let r = '';
			let len;
			for (let i = 0; i < s.length; i++) {
				let c = s[i];
				if ((c & 0xc0) == 0x80)
					continue;
				if ((c & 0x80) == 0x00) {
					len = 0;
				} else if ((c & 0xe0) == 0xc0) {
					len = 1;
					c &= 0x1f;
				} else if ((c & 0xf0) == 0xe0) {
					len = 2;
					c &= 0x0f;
				} else if ((c & 0xf8) == 0xf0) {
					len = 3;
					c &= 0x07;
				} else if ((c & 0xfc) == 0xf8) {
					len = 4;
					c &= 0x03;
				} else if ((c & 0xfe) == 0xfc) {
					len = 5;
					c &= 0x01;
				}
				let u = c;
				for (let j = 0; j < len && i < s.length; j++, i++) {
					c = s[i];
					u = (u << 6) | (c & 0x3f);
				}
				r += String.fromCharCode(u);
			}
			return r;
		}
	}

	function removeLog() {
		while (elemLog.firstChild) {
			elemLog.removeChild(elemLog.firstChild);
		}
	}

	function addErrorHighlight(row, col) {
		let elemLines = elemAceTextLayer.getElementsByClassName('ace_line');
		let firstRow = parseInt(elemLines[0].style.top) / parseInt(elemLines[0].style.height);
		let lastRow = firstRow + elemLines.length - 1;
		if (firstRow <= row && row <= lastRow) {
			const targetLeft = editor.renderer.textToScreenCoordinates(row, col).pageX;
			const elems = elemLines[row - firstRow].children;
			for (const elem of elems) {
				const elemLeft = elem.getBoundingClientRect().x;
				if (elemLeft >= targetLeft - 1) {
					for (const className of elem.classList) {
						elem.classList.remove(className);
					}
					elem.classList.add('ace_error');
					break;
				}
			}
		}
	}

	function updateErrorHighlight() {
		for (const logList of elemLog.children) {
			const data = logList.getAttribute('data-pos');
			if (data != null) {
				const pos = JSON.parse(data);
				addErrorHighlight(pos.row, pos.col);
			}
		}
	}

	function addLog(str) {
		if (version == '') {
			let match;
			if (match = str.match(/^Kuin Programming Language (v\.\d{4}\.\d+\.\d+)\s*$/)) {
				version = ' ' + match[1];
			}
		}
		if (str.match(/^0x[\dA-F]{8}: /)) {
			logTypeId = str;
		} else if (str.match(/^\[.*\]$/)) {
			logTypeId += str;
		} else {
			let li = document.createElement('li');
			li.textContent = logTypeId + str;
			if (logTypeId.match(/^0x0003/)) {
				li.style.backgroundColor = '#f5f5f5';
			} else {
				li.style.backgroundColor = '#ffeff7';
				let match;
				if (match = logTypeId.match(/^^0x[\dA-F]{8}: \[\\main: (\d+), (\d+)\]/)) {
					let row = match[1] - 1;
					let col = match[2] - 1;
					li.setAttribute('data-pos', `{"row": ${row}, "col": ${col}}`);
					addErrorHighlight(row, col);
				}
			}
			elemLog.appendChild(li);
			logTypeId = '';
		}
	}

	function selectLog(e) {
		const data = e.target.getAttribute('data-pos');
		if (data !== null) {
			const pos = JSON.parse(data);
			editor.navigateTo(pos.row, pos.col);
			editor.scrollToLine(pos.row, true, true);
			editor.focus();
		}
	}

	function updateTweetButton(srcEncoded, inputEncoded) {
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
		let c = '?';
		let srcData = '';
		let inputData = '';
		if (srcEncoded !== null) {
			srcData = c + paramNameSrc + '=' + srcEncoded;
			c = '&';
		}
		if (inputEncoded !== null && inputEncoded !== "") {
			inputData = c + paramNameInput + '=' + inputEncoded;
			c = '&';
		}
		ele.setAttribute('data-url', href + srcData + inputData);
		ele.setAttribute('data-hashtags', 'KuinWeb');
		ele.appendChild(document.createTextNode('tweet'));
		b.appendChild(ele);

		twttr.widgets.load();
	}

	window.onload = function() {
		editor = ace.edit(elemIdSrc);
		elemAceTextLayer = elemSrc.getElementsByClassName('ace_text-layer')[0];
		const config = {
			childList: true,
		};
		const observer = new MutationObserver(updateErrorHighlight);
		observer.observe(elemAceTextLayer, config);
		editor.setOptions({
			theme: 'ace/theme/kuin',
			mode: 'ace/mode/kuin',
			useSoftTabs: false,
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true,
			copyWithEmptySelection: true,
			fontSize: '16px',
			minLines: 10,
			maxLines: 35,
		});

		{
			const paravalsStr = location.href.split('?')[1];
			if (paravalsStr == null) paravalsStr = '';
			for (const paravals of paravalsStr.split('&')) {
				let paraval = paravals.split('=');
				if (paraval.length == 2) {
					if (paraval[0] == paramNameSrc) {
						let src = decodeURIComponent(paraval[1]);
						editor.setValue(src);
						editor.navigateTo(0, 0);
					} else if (paraval[0] == paramNameInput) {
						const inputVaalue = decodeURIComponent(paraval[1]);
						elemInput.value = inputVaalue;
					}
				}
			}
			updateTweetButton(null, null);
		}
	}

	function enableButton() {
		isButtonEnable = true;
		executeButton.innerHTML = '処理開始<img src="./images/kuin.png?2021-08-06" width="28" height="28" />';
		executeButton.classList.remove('init');
		executeButton.classList.remove('disable');
		executeButton.classList.add('enable');
	}

	function disableButton() {
		isButtonEnable = false;
		executeButton.innerHTML = '処理中...';
		executeButton.classList.remove('enable');
		executeButton.classList.add('disable');
	}
})
