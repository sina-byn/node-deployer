import { createInterface } from 'readline';

// * openurl
import { open } from 'openurl';

const initReadline = port => {
  const rl = createInterface(process.stdin);

  rl.on('line', input => {
    switch (input.trim()) {
      case 'o': {
        open(process.env.URL || `http://localhost:${port}`);
      }
    }
  });
};

export default initReadline;
