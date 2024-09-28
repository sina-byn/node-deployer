import chalk from 'chalk';

const _logger = (color, ...inputs) => {
  console.log(...inputs.filter(i => typeof i === 'string').map(i => chalk[color](i)));
};

const logger = _logger.bind(null, 'whiteBright');

logger.success = _logger.bind(null, 'greenBright');
logger.error = _logger.bind(null, 'redBright');

logger.info = _logger.bind(null, 'blueBright');
logger.warning = _logger.bind(null, 'yellowBright');

export default logger;
