import { createInterface } from 'readline';

// * openurl
import { open } from 'openurl';

const initReadline = port => {
  const rl = createInterface(process.stdin);

  rl.on('line', input => {
    switch (input.trim()) {
      case 'o':
        return open(process.env.URL || `http://localhost:${port}`);

      case 'cls':
        return console.clear();

      case 'exit':
        return process.exit();
    }
  });
};

export default initReadline;
