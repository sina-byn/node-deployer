import crypto from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const __dirname = () => dirname(fileURLToPath(import.meta.url));

export const MD5Hash = input => crypto.createHash('md5').update(input).digest('hex');
