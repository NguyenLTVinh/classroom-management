function showSnackbar(message, isError = false) {
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    if (isError) {
      snackbar.classList.add('error');
    }
    snackbar.innerText = message;
    document.body.appendChild(snackbar);
  
    setTimeout(() => {
      snackbar.classList.add('show');
    }, 10);
  
    setTimeout(() => {
      snackbar.classList.remove('show');
      snackbar.addEventListener('transitionend', () => {
        snackbar.remove();
      });
    }, 3000);
  }
  