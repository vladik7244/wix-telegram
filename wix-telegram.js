window.addEventListener('message', (event) => {
  console.log('EVENT', event);
  
  if (event.data === 'openButton') {
    Telegram.WebApp.MainButton.show();
  }
  if (event.data === 'hideButton') {
    Telegram.WebApp.MainButton.hide()
  }
});
