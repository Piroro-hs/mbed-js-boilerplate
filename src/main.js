// for nucleo_f411re

let state = 1;
const led = DigitalOut(LED1);

setInterval(() => {
  state = state ? 0 : 1;
  led.write(state);
}, 500);

print('main.js has finished executing.');
