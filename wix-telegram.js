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
  const result = path(Telegram, msg.path);
  sendToWix({
    type: '@com',
    action: 'response',
    requestId: msg.requestId,
    result,
  });
}

function processArgs(args = []) {
  return args.map((arg) => {
    if (typeof arg === 'object' && 'type' in arg && arg.type === 'callback' && arg.callbackId) {
      return (...args) => {
        sendToWix({
          type: '@com',
          action: 'callback',
          callbackId: arg.callbackId,
          args,
        });
      };
    }
    return arg;
  });
}

function processAction(msg) {
  const method = path(Telegram, msg.path);
  const result = method(...processArgs(msg.args));
  if (msg.requestId) {
    sendToWix({
      type: '@com',
      action: 'response',
      requestId: msg.requestId,
      result,
    });
  }
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
