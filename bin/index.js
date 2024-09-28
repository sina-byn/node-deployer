#!/usr/bin/env node

// * commander
import { program } from 'commander';

// * utils
import logger from '../src/logger.js';

import { resolveConfig } from '../src/config.js';
import { execWorkflow, resolveWorkflow } from '../src/workflow.js';

const [config] = resolveConfig();
const projects = Object.keys(config);

program.command('list').action(() => {
  logger.info('Projects:');
  for (const project of projects) logger.info('  ' + project);
});

program
  .command('init')
  .argument('<project>')
  .option('-c, --custom [workflowName]')
  .action(project => {
    const { custom } = options;

    if (!(project in config)) {
      logger.error('[DEPLOYER] Invalid Project Name');
      logger('');
      logger.info('Projects:');
      for (const project of projects) logger.info('  ' + project);
      return;
    }

    const workflowQueue = resolveWorkflow('init', project, custom);
    execWorkflow(workflowQueue);
  });

program
  .command('deploy')
  .argument('<project>')
  .option('-c, --custom [workflowName]')
  .action((project, options) => {
    const { custom } = options;

    if (!(project in config)) {
      logger.error('[DEPLOYER] Invalid Project Name');
      logger('');
      logger.info('Projects:');
      for (const project of projects) logger.info('  ' + project);
      return;
    }

    const workflowQueue = resolveWorkflow('deploy', project, custom);
    execWorkflow(workflowQueue);
  });

process.on('uncaughtException', err => {
  logger.error('[DEPLOYER]', err.message);
});

program.parse();
