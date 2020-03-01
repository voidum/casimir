const crypto = require('crypto');

function getMD5Hash(data) {
  const hash = crypto.createHash('md5');
  hash.update(data);
  return hash.digest('hex');
}

function getNextPort(prevPort) {
  let nextPort = prevPort += 997; // max prime less than 1000
  if (nextPort > 65535) nextPort -= 65535;
  return nextPort;
}

function getRandomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  getMD5Hash,
  getNextPort,
  getRandomInteger
}