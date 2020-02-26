function getNextPort(prevPort) {
  let nextPort = prevPort += 2400;
  if (nextPort > 65535) nextPort -= 65535;
  return nextPort;
}

module.exports = {
  getNextPort
}