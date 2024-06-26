window.addEventListener('message', (event) => {
  const msg = tryParseMsg(event.data);
  if (!msg) {
    return;
  }
  processMessage(msg);
});

function makeWeakCallbacksCache() {
  const callbacks = new Map();
  const cleanup = new FinalizationRegistry(key => {
    // See note below on concurrency considerations.
    const ref = callbacks.get(key);
    if (ref && !ref.deref()) {
      callbacks.delete(key);
      sendToWix({
        type: '@com',
        action: 'removeCallback', // notify that callback can be garbage collected
        callbackId: key,
      });
    }
  });

  return {
    getCallback: (callbackId) => {
      const ref = callbacks.get(callbackId);
      if (ref) {
        const cached = ref.deref();
        // See note below on concurrency considerations.
        if (cached !== undefined) return cached;
      }
      
      const fresh = (...args) => {
        sendToWix({
          type: '@com',
          action: 'callback',
          callbackId: callbackId,
          args,
        });
      };

      callbacks.set(callbackId, new WeakRef(fresh));
      cleanup.register(fresh, callbackId);
      return fresh;
    }
  }
}

const callbacksCache = makeWeakCallbacksCache();

function processMessage(msg) {
  console.log('>> processing message', msg)
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

function isCallbackArg(arg) {
  if (!arg) {
    return false;
  }
  if (typeof arg !== 'object') {
    return false
  }
  return arg.type === '@callback' && Boolean(arg.callbackId);
}

function processArgs(args = []) {
  return args.map((arg) => {
    if (isCallbackArg(arg)) {
      return callbacksCache.getCallback(arg.callbackId);
    }
    return arg;
  });
}

function processAction(msg) {
  const method = path(Telegram, msg.path);
  const result = method(...processArgs(msg.args));
  sendToWix({
    type: '@com',
    action: 'response',
    requestId: msg.requestId,
    result: msg.withResult ? result : undefined,
  });
}

function findIframeIfNeeded() {
  return document.querySelector('iframe');
}

function sendToWix(message) {
  const iframe = findIframeIfNeeded();
  console.log('>> sending to velo', message)
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
