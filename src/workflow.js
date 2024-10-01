import fs from 'fs';
import path from 'path';

// * execa
import { $ } from 'execa';

// * js-yaml
import yaml from 'js-yaml';

// * pretty-ms
import prettyMs from 'pretty-ms';

// * utils
import logger from './logger.js';

import { applyVars, __dirname } from './utils.js';
import { resolveConfig } from './config.js';

// * constants
const WORKFLOWS_PATH = path.join(__dirname(), '..', 'workflows');

const loadWorkflow = (workflow, action) => {
  if (!workflow) throw new Error('No Workflow Specified');

  const workflowPath = path.join(WORKFLOWS_PATH, workflow + '.yaml');
  if (!fs.existsSync(workflowPath)) throw new Error(`Could Not Find Workflow '${workflow}'`);

  const loadedWorkflow = yaml.load(fs.readFileSync(workflowPath));
  if (Array.isArray(loadedWorkflow)) return loadedWorkflow;

  const actionWorkflow = loadedWorkflow[action];
  if (!actionWorkflow) throw new Error(`No '${action}' Workflow Found In '${workflow}' Workflows`);

  return actionWorkflow;
};

const resolveWorkflow = (action, project, custom = false) => {
  const config = resolveConfig();
  const projectConfig = config[project];
  const { vars } = projectConfig;

  if (custom) {
    if (typeof custom === 'string') {
      return loadWorkflow(path.basename(custom), action).map(c => applyVars(c, vars));
    }

    const customWorkflow = projectConfig.custom;
    if (!customWorkflow) throw new Error(`No Custom Workflow Specified For '${project}' In Config`);

    return customWorkflow;
  }

  const workflow = projectConfig[action];
  if (!workflow) throw new Error(`Could Not Find Action '${action}' For '${project}' In Config`);

  return loadWorkflow(workflow, action).map(c => applyVars(c, vars));
};

const execWorkflow = (workflowQueue, socket = null) => {
  if (!workflowQueue.length) throw new Error('Empty Workflow');

  const initTime = Date.now();
  const root = process.cwd();
  const isCLI = !socket;

  // console.log(workflowQueue);

  // workflowQueue = [
  //   'cd',
  //   'cd src',
  //   'cd',
  //   'cd ..',
  //   'git status',
  //   'npm i react',
  //   'npm uninstall react',
  // ];
  let command = workflowQueue[0];
  let index = 0;

  const execCommand = command => {
    command = command.trim();

    const cp = $`${command}`;

    cp.then(() => {
      if (command.startsWith('cd')) {
        const args = command.split(/\s+/);

        if (args.length === 2) {
          process.chdir(args[1]);
        } else if (args.length > 2) {
          // ! invalid change directory command
        }
        // ! handle the case where length is 1
      }

      // ! workflow finished
      if (index === workflowQueue.length - 1) {
        const elapsedTime = prettyMs(Date.now() - initTime);

        if (socket) socket.emit('end', elapsedTime);
        process.chdir(root);

        logger.info('--------------------------------------------------');
        logger.info('[DEPLOYER] Workflow Execution Finished');
        logger.info(`Took ${elapsedTime} To Finish`);
        logger.info('--------------------------------------------------');
        logger('');

        return;
      }

      execCommand(workflowQueue[++index]);
    }).catch(err => {
      logger.error('[DEPLOYER-EXEC-ERROR]', err);
    });

    cp.stdout.on('data', chunk => {
      chunk = chunk.toString();

      logger.success(!isCLI && '[DATA]', chunk);
      if (socket) socket.emit('log', chunk);
    });

    cp.stderr.on('data', chunk => {
      chunk = chunk.toString();

      logger.error(!isCLI && '[ERROR]', chunk);
      if (socket) socket.emit('error', chunk);
    });
  };

  execCommand(command);
};

export { execWorkflow, resolveWorkflow };
