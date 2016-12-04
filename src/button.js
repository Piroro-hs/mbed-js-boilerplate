import EventEmitter from 'eventemitter3';

const button = InterruptIn(USER_BUTTON);

const buttonEmitter = new EventEmitter();

button.rise(() => {
  buttonEmitter.emit('rise');
})

button.fall(() => {
  buttonEmitter.emit('fall');
})

export default buttonEmitter;
