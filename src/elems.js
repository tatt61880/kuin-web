(function() {
  'use strict';

  if (typeof window !== 'undefined') {
    window.app = window.app || {};
    window.app.elems = {
      init: init,
    };
  }

  const elems = {
    src: 'src',
    input: 'input',
    output: 'output',
    kBody: 'k_body',
    log: 'log',
    platform: 'platform',
    button: {
      execute: 'execute-button',
      tweet: 'tweet-button',
    },
  };

  function init() {
    initElems(window.app.elems, elems);
    Object.freeze(window.app.elems);

    function initElems(obj, elems) {
      for (const key in elems) {
        const value = elems[key];
        if (typeof value === 'object') {
          obj[key] = {};
          initElems(obj[key], value);
        } else {
          obj[key] = document.getElementById(value);
          if (obj[key] === null) {
            console.error(`Elem not exist. [id=${value}]`);
          }
        }
      }
    }
  }
})();
