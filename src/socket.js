import { Server } from 'socket.io';

// * utils
import logger from './logger.js';

let _io;

const socket = () => {
  if (!_io) throw new Error('No Socket Connection Was Found');
  return _io;
};

socket.connect = server => {
  const io = new Server(server);
  _io = io;

  io.on('connection', () => {
    logger.info('[DEPLOYER]', 'Socket Connected');
    io.emit('cwd', process.cwd());
  });
};

export default socket;
