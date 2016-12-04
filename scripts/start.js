const {spawn} = require('child_process');

spawn('cmd', {detached: true, shell: true});
