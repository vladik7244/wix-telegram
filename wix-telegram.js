window.addEventListener('message', (event) => {
  console.log('EVENT', event);

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
  sendToWix({
    result,
    requestId: msg.requestId,
  });
}

function processAction(msg) {
  const method = path(Telegram.WebApp, msg.path);
  const result = method(...msg.args);
  sendToWix({
    
    result,
    requestId: msg.requestId,
  });
}

let iframe;
function findIframeIfNeeded() {
  if (iframe) {
    return
  }
  iframe = document.querySelectorAll('iframe')[0];
}

function sendToWix(message) {
  findIframeIfNeeded();
  iframe.contentWindow.postMessage({
    proxy: true,
    message,
  }, '*');
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
