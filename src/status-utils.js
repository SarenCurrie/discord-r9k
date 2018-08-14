const exec = require('child_process').exec;
const os = require('os');

const startTime = Date.now();

exports.getTemp = () => new Promise((resolve, reject) => {
  if (os.type() === 'Linux') {
    exec('/opt/vc/bin/vcgencmd measure_temp', (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(`**Thermal status:**\n${stdout}`);
      }
    });
  } else {
    // Defer rejection
    process.nextTick(() => {
      reject(`Do not know how to get thermal status for os ${os.type()}`);
    });
  }
});

const printTimeDifference = (timestamp) => {
  const totalSeconds = Math.floor((timestamp - startTime) / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  const formatTwoDigit = value => (value <= 9 ? `0${value}` : value);

  return `${days} days, ${formatTwoDigit(hours)}:${formatTwoDigit(minutes)}:${formatTwoDigit(seconds)}`;
};

exports.getUptime = () => `**Bot uptime:** ${printTimeDifference(Date.now())}`;
