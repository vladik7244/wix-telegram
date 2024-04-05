// const telegramBaseURL= 'https://www.slowo-wiary.com';

window.addEventListener('message', (event) => {
  console.log('IFRAME EVENT', event);

  proxyMessage(event.data);
});

function proxyMessage(message) {
  postMessage({
    proxied: true,
    message,
  })
}
