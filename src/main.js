import button from './button';

const led = DigitalOut(LED1, 1);

button.on('rise', () => {
  led.write(led.read() ? 0 : 1);
});
