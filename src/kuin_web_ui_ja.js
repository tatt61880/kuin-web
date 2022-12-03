(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', onload);
  return;

  function onload() {
    const paramNameSrc = 'src';
    const paramNameInput = 'input';
    const app = window.app;
    app.elems.init();
    let logTypeId = '';
    let elemAceTextLayer;
    let included = false;
    let editor;
    let isButtonEnable = false;
    let versionOfKuin = '';
    let errorPosNum = 0; // 「位置情報付きのエラー」の数

    removeLog();
    app.elems.output.value = '';
    app.elems.output.addEventListener('focus', function() {
      app.elems.output.select();
    });
    app.elems.src.addEventListener('focus', function() {
      app.elems.button.tweet.style.setProperty('visibility', 'hidden');
    });
    app.elems.log.addEventListener('click', selectLog);

    app.elems.button.execute.addEventListener('click', onClick);
    enableButton();

    function onClick() {
      if (!isButtonEnable) {
        return;
      }
      disableButton();
      errorPosNum = 0;
      const srcEncoded = encodeURIComponent(editor.getValue());
      const inputEncoded = encodeURIComponent(app.elems.input.value);
      updateTweetButton(srcEncoded, inputEncoded);

      app.elems.kBody.textContent = '';
      const platform = app.elems.platform.options[app.elems.platform.selectedIndex].value;
      let target = null;
      let write = null;
      let extra = null;
      if (platform === 'run') {
        target = 'web';
        write = function(p, s, c) {
          if (p === './out.js') {
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
          const langName = `Kuin Programming Language ${versionOfKuin}`;
          c.S += `#if 0 // ${langName}\n`;
          c.S += `${editor.getValue()}\n`;
          c.S += '#endif\n\n';
          c.S += '// C++ code below is\n';
          c.S += '//   transpiled from Kuin code above\n';
          c.S += `//   by ${langName}\n`;
          c.S += fromUtf8(s);
        };
        extra = ['-x', 'merge'];
      } else {
        window.alert('Unexpected platform.');
        return;
      }
      app.elems.output.value = '';
      removeLog();
      const code = {S: ''};
      if (!included) {
        included = true;
        const scriptName = 'kuin_ja.js';
        addLog(scriptName + ' のロード中。');
        const script = document.createElement('script');
        script.src = 'lib/' + scriptName + '?2021-09-17';
        script.onload = function() {
          if (!this.readyState ||
              this.readyState === 'loaded' ||
              this.readyState === 'complete') {
            addLog(scriptName + ' のロード完了。');
            const tmp = extra;
            extra = ['-v'];
            run(false);
            extra = tmp;

            // 処理を続ける前に現時点までのメッセージを画面に反映させるためにこうします。
            setTimeout(function() {
              run(true);
            }, 0);
          }
        };
        document.getElementsByTagName('head')[0].appendChild(script);
      } else {
        if (versionOfKuin !== '') {
          addLog('Kuin Programming Language ' + versionOfKuin);
        }
        setTimeout(function() {
          run(true);
        }, 0);
      }

      function run(enable) {
        kuin({ // eslint-disable-line no-undef
          cmdLine:
            ['-i', 'main.kn', '-s', 'res/sys/', '-e', target].concat(extra),
          readFile:
            function(p) {
              const srcValue = editor.getValue();
              if (p === './main.kn') {
                return toUtf8(srcValue);
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
            },
        });
        if (platform === 'run') {
          const inputStr = app.elems.input.value;
          const data = [];
          for (let i = 0; i < inputStr.length; i++) {
            data.push(inputStr.charCodeAt(i));
          }
          let idx = 0;
          const print =
            function(s) {
              app.elems.output.value += s;
            };
          const inputLetter =
            function() {
              if (idx < data.length) {
                return data[idx++];
              } else {
                return 0xFFFF;
              }
            };
          eval(`${code.S}
            if (typeof out !== 'undefined') {
              out({
                print: ${print.toString()},
                inputLetter: ${inputLetter.toString()}
              });
            }`);
        } else {
          app.elems.output.value = code.S;
        }
        if (enable) {
          enableButton();
        }
      }

      function toUtf8(s) {
        let r = new Uint8Array(0);
        for (let i = 0; i < s.length; i++) {
          let data = s.charCodeAt(i);
          let u;
          if ((data >> 7) === 0) {
            u = data;
            r = concat(r, Uint8Array.from([u & 0xff]));
          } else {
            u = (0x80 | (data & 0x3f)) << 8;
            data >>= 6;
            if ((data >> 5) === 0) {
              u |= 0xc0 | data;
              r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff]));
            } else {
              u = (u | 0x80 | (data & 0x3f)) << 8;
              data >>= 6;
              if ((data >> 4) === 0) {
                u |= 0xe0 | data;
                r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff,
                  (u >> 16) & 0xff]));
              } else {
                u = (u | 0x80 | (data & 0x3f)) << 8;
                data >>= 6;
                if ((data >> 3) === 0) {
                  u |= 0xf0 | data;
                  r = concat(r, Uint8Array.from([u & 0xff, (u >> 8) & 0xff,
                    (u >> 16) & 0xff, (u >> 24) & 0xff]));
                } else {
                  return r;
                }
              }
            }
          }
        }
        return r;

        function concat(a, b) {
          const c = new Uint8Array(a.length + b.length);
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
          if ((c & 0xc0) === 0x80) {
            continue;
          }
          if ((c & 0x80) === 0x00) {
            len = 0;
          } else if ((c & 0xe0) === 0xc0) {
            len = 1;
            c &= 0x1f;
          } else if ((c & 0xf0) === 0xe0) {
            len = 2;
            c &= 0x0f;
          } else if ((c & 0xf8) === 0xf0) {
            len = 3;
            c &= 0x07;
          } else if ((c & 0xfc) === 0xf8) {
            len = 4;
            c &= 0x03;
          } else if ((c & 0xfe) === 0xfc) {
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
      while (app.elems.log.firstChild) {
        app.elems.log.removeChild(app.elems.log.firstChild);
      }
    }

    function addErrorHighlight(row, col) {
      const elemLines = elemAceTextLayer.getElementsByClassName('ace_line');
      const firstRow = parseInt(elemLines[0].style.top) /
          parseInt(elemLines[0].style.height);
      const lastRow = firstRow + elemLines.length - 1;
      if (firstRow <= row && row <= lastRow) {
        const targetLeft =
            editor.renderer.textToScreenCoordinates(row, col).pageX;
        const elems = elemLines[row - firstRow].children;
        for (const elem of elems) {
          const elemLeft = elem.getBoundingClientRect().x;
          if (elemLeft >= targetLeft - 1) {
            elem.classList.add('ace_error');
            break;
          }
        }
      }
    }

    function updateErrorHighlight() {
      if (errorPosNum === 0) {
        return;
      }
      for (const logList of app.elems.log.children) {
        const data = logList.getAttribute('data-pos');
        if (data !== null) {
          const pos = JSON.parse(data);
          addErrorHighlight(pos.row, pos.col);
        }
      }
    }

    function addLog(str) {
      if (versionOfKuin === '') {
        const match = str.match(/^Kuin Programming Language (v.*)\s*$/);
        if (match) {
          versionOfKuin = match[1];
        }
      }
      if (str.match(/^0x[\dA-F]{8}: /)) {
        logTypeId = str;
      } else if (str.match(/^\[.*\]$/)) {
        logTypeId += str;
      } else {
        const li = document.createElement('li');
        li.textContent = logTypeId + str;
        if (logTypeId.match(/^0x0003/)) {
          if (logTypeId.match(/^0x00030001/)) {
            li.style.backgroundColor = '#aaffaa';
          } else if (logTypeId.match(/^0x00030002/)) {
            li.style.backgroundColor = '#db5671';
            li.style.color = '#ffffff';
          } else {
            li.style.backgroundColor = '#f5f5f5';
          }
        } else {
          if (logTypeId.match(/^0x000[12]/)) {
            li.style.backgroundColor = '#ffeff7';
            li.style.color = '#db5671';
          } else {
            li.style.backgroundColor = '#ffddff';
          }
          const match = logTypeId.match(/^^0x[\dA-F]+: \[\\main: (\d+), (\d+)\]/);
          if (match) {
            errorPosNum++;
            const row = match[1] - 1;
            const col = match[2] - 1;
            li.setAttribute('data-pos', `{"row": ${row}, "col": ${col}}`);
            addErrorHighlight(row, col);
          }
        }
        app.elems.log.appendChild(li);
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
      while (app.elems.button.tweet.firstChild !== null) {
        app.elems.button.tweet.removeChild(app.elems.button.tweet.firstChild);
      }
      const elemTweet = document.createElement('a');
      elemTweet.setAttribute('href', 'https://twitter.com/share');
      elemTweet.setAttribute('class', 'twitter-share-button');
      elemTweet.setAttribute('data-text', 'KuinWeb');
      let href = location.href;
      const questionPos = href.search('\\?');
      if (questionPos !== -1) {
        href = href.substr(0, questionPos);
      }
      let c = '?';
      let srcData = '';
      let inputData = '';
      if (srcEncoded !== null) {
        srcData = c + paramNameSrc + '=' + srcEncoded;
        c = '&';
      }
      if (inputEncoded !== null && inputEncoded !== '') {
        inputData = c + paramNameInput + '=' + inputEncoded;
        c = '&';
      }
      elemTweet.setAttribute('data-url', href + srcData + inputData);
      elemTweet.setAttribute('data-hashtags', 'KuinWeb');
      elemTweet.appendChild(document.createTextNode('tweet'));
      app.elems.button.tweet.appendChild(elemTweet);

      twttr.widgets.load(); // eslint-disable-line no-undef
    }

    window.onload = function() {
      editor = ace.edit(app.elems.src); // eslint-disable-line no-undef
      elemAceTextLayer = app.elems.src.getElementsByClassName('ace_text-layer')[0];
      const config = {
        childList: true,
        subtree: true,
      };
      const observer = new window.MutationObserver(updateErrorHighlight);
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
      editor.on('change', function() {
        errorPosNum = 0;
      });

      {
        const paravalsStr = location.href.split('?')[1];
        if (paravalsStr !== null) {
          for (const paravals of paravalsStr.split('&')) {
            const paraval = paravals.split('=');
            if (paraval.length === 2) {
              if (paraval[0] === paramNameSrc) {
                const srcValue = decodeURIComponent(paraval[1]);
                editor.setValue(srcValue);
                editor.navigateTo(0, 0);
              } else if (paraval[0] === paramNameInput) {
                const inputValue = decodeURIComponent(paraval[1]);
                app.elems.input.value = inputValue;
              }
            }
          }
        }
        updateTweetButton(null, null);
      }
    };

    function enableButton() {
      isButtonEnable = true;
      app.elems.button.execute.innerHTML = '処理開始' +
          '<img src="./images/kuin.png?2021-08-06" width="28" height="28" />';
      app.elems.button.execute.classList.remove('init');
      app.elems.button.execute.classList.remove('disable');
      app.elems.button.execute.classList.add('enable');
    }

    function disableButton() {
      isButtonEnable = false;
      app.elems.button.execute.innerHTML = '処理中...';
      app.elems.button.execute.classList.remove('enable');
      app.elems.button.execute.classList.add('disable');
    }
  }
})();
