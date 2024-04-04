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
  localStorage.setItem(msg.address, resultStr);
}

function processAction(msg) {
  const method = path(Telegram.WebApp, msg.path);
  const result = method(...msg.args);
  if (msg.resultAddress) {
    localStorage.setItem(msg.resultAddress, JSON.stringify(result));
  }
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
