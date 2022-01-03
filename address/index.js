const pancakeswap = require('./pancakeswap.json');
const apeswap = require('./apeswap.json');
const KYBER = require('./kyber.json');
const BISWAP = require('./biswap.json');

module.exports = {
  mainnet: {
    PANCAKESWAP: pancakeswap,
    APESWAP: apeswap,
    KYBER,
    BISWAP
  }
};
