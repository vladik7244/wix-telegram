window.addEventListener('message', (event) => {
  console.log('EVENT', event);
  
  if (event.data === 'openButton') {
    Telegram.WebApp.MainButton.show();
  }
  if (event.data === 'hideButton') {
    Telegram.WebApp.MainButton.hide()
  }
  const msg = tryParseMsg(event.data);
  if (!msg) {
    return;
  }
  processMessage(msg);
});

function processMessage(msg) {
  if (msg.action === 'read') {
    return processReadRequest(msg)
  }
  if (msg.action === 'action') {
    return processAction(msg)
  }
}

function processReadRequest(msg) {
  const result = path(Telegram.WebApp, msg.path);
  const resultStr = JSON.stringify(result);
  writeToStorage(msg.address, resultStr);
}

function processAction(msg) {
  const method = path(Telegram.WebApp, msg.path);
  const result = method(...msg.args);
  if (msg.resultAddress) {
    writeToStorage(msg.resultAddress, JSON.stringify(result));
  }
}

let iframe;
function findIframeIfNeeded() {
  if (iframe) {
    return
  }
  iframe = document.querySelectorAll('iframe')[0];
}

function writeToStorage(key, value) {
  findIframeIfNeeded();
  iframe.postMessage({
    key, value,
  }, '*');
  // const appKey = 'platform_app_675bbcef-18d8-41f5-800e-131ec9e08762_f84fae55-bb4b-4880-a1e0-eb02bc41fa27';
  // const data = localStorage.getItem(appKey) ?? '{}';
  // const parsedData = JSON.parse(data);
  // parsedData[key] = value;
  // localStorage.setItem(appKey, JSON.stringify(parsedData));
}

function tryParseMsg(data) {
  if (typeof data !== 'string') {
    return;
  }
  try {
    const messageObj = JSON.parse(data);
    if (messageObj.type === '@com') {
      return messageObj;
    }
  } catch (e) {
    return;
  }
}

function path(obj, path) {
  return pathArr(obj, path.split('.'));
}

function pathArr(obj, arr) {
  if (arr.length === 0) {
    return obj;
  }
  const [first, ...rest] = arr;
  return pathArr(obj[first], rest);
}
