import crypto from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const __dirname = () => dirname(fileURLToPath(import.meta.url));

export const MD5Hash = input => crypto.createHash('md5').update(input).digest('hex');

export const applyVars = (input, vars = {}) => {
  const varRegex = /<(\w+)>/g;

  return input.replace(varRegex, (_, varName) => {
    if (!(varName in vars)) throw new Error(`Could Not Resolve Variable '${varName}'`);

    return vars[varName];
  });
};
