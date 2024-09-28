import fs from 'fs';
import path from 'path';

// * js-yaml
import yaml from 'js-yaml';

// * utils
import { MD5Hash, __dirname } from './utils.js';

// * constants
const CONFIG_PATH = path.join(__dirname(), '..', 'deployer.config.yaml');

let _config;

export const resolveConfig = (update = false) => {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Could Not Find 'deployer.config.yaml'`);

  if (!update && _config) return _config;

  const configYaml = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const configHash = MD5Hash(configYaml);
  const config = yaml.load(configYaml);

  if (!config) throw new Error('Failed Resolving Deployer Config');

  _config = config;

  return [config, configHash];
};

export const resolveConfigHash = () => {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Could Not Find 'deployer.config.yaml'`);

  const configYaml = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const configHash = MD5Hash(configYaml);

  if (!configHash) throw new Error('Failed Resolving Deployer Config Hash');

  return configHash;
};
