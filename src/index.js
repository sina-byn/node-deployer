import path from 'path';
import { createServer } from 'http';

// * express
import express from 'express';

// * dotenv
import dotenv from 'dotenv';
dotenv.config();

// * utils
import logger from './logger.js';
import socket from './socket.js';
import initReadline from './readline.js';

import { __dirname } from './utils.js';
import { execWorkflow, resolveWorkflow } from './workflow.js';
import { resolveConfig, resolveConfigHash } from './config.js';

let [config, configHash] = resolveConfig();

const app = express();
const server = createServer(app);

socket.connect(server);

const port = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname(), 'views'));

app.use(express.static('public'));

app.get('/', (_req, res) => {
  const projects = Object.keys(config);

  res.render('index', { projects });
});

app.get('/init/:project', (req, res, next) => {
  const secret = req.get('X-PASSWORD');

  if (secret !== process.env.AUTH_SECRET) return res.status(401).json({ message: 'Unauthorized' });

  const { project } = req.params;

  let { c } = req.query;
  c = /[01]/.test(c) ? !!Number(c) : c;

  const workflowQueue = resolveWorkflow('init', project, c);
  execWorkflow(workflowQueue, socket());

  res.status(200).json({ message: `${project} Project Initialized` });
});

app.get('/deploy/:project', (req, res, next) => {
  const secret = req.get('X-PASSWORD');

  if (secret !== process.env.AUTH_SECRET) return res.status(401).json({ message: 'Unauthorized' });

  const { project } = req.params;

  let { c } = req.query;
  c = /[01]/.test(c) ? !!Number(c) : c;

  const workflowQueue = resolveWorkflow('deploy', project, c);
  execWorkflow(workflowQueue, socket());

  res.status(200).json({ message: `${project} Project Deployment Initialized` });
});

app.get('/login/:secret', (req, res, next) => {
  const { secret } = req.params;

  if (secret !== process.env.AUTH_SECRET) return res.status(401).json({ message: 'Unauthorized' });
  res.status(200).json({ message: 'Authorized' });
});

app.get('/update', (_req, res, next) => {
  [config, configHash] = resolveConfig(true);
  const projects = Object.keys(config);

  res.status(200).json({ projects });
});

app.get('/validate-config', (_req, res, next) => {
  const newConfigHash = resolveConfigHash();
  res.status(200).json({ outdated: configHash !== newConfigHash });
});

app.use((err, req, res, next) => {
  logger.error('[Deployer-Error]', err.message);
  res.status(500).json({ message: 'Server-Side Exception Occurred' });
});

server.listen(port, () => {
  logger.info(`Server Running At http://localhost:${port}`);

  initReadline(port);
});
