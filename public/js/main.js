import fmt from './fmt.js';

// const BASE_URL = document.querySelectorAll('input[name="baseURL"]').name;
let projects = [...document.querySelectorAll('input[name="project"]')].map(i => i.value);
let terminal;
let pending;
let cwd;

const list = async (checkHash = true) => {
  if (checkHash) {
    const res = await fetch('/validate-config');
    const { outdated } = await res.json();

    if (outdated) {
      terminal.echo(fmt.error('Outdated Config'));
      terminal.echo(fmt.info(`Run 'update' To Fetch The Latest Config`));
      return;
    }
  }

  if (!projects.length) {
    terminal.echo(fmt.error('Failed Resolving Projects List!'));
    return;
  }

  terminal.echo(fmt.info('Projects:'));
  for (const project of projects) terminal.echo(fmt.info('  ' + project));
};

const update = async () => {
  const res = await fetch('/update');
  const { projects: _projects } = await res.json();

  projects = _projects;

  list(false);
};

const help = () => {
  const commands = [
    'cls',
    'list',
    'update',
    'reset',
    'clear',
    'reload',
    'login',
    'logout',
    'init <project> -c,--custom [workflowName\\]',
    'deploy <project> -c,--custom [workflowName\\]',
  ];

  terminal.echo(fmt.info('Commands List:'));
  for (const command of commands) terminal.echo(fmt.info('  ' + command));
};

const login = async password => {
  const res = await fetch(`/login/${password}`);

  if (res.ok) {
    terminal.echo(fmt.success('[DEPLOYER\\] ', 'Logged-In Successfully'));
    localStorage.setItem('admin-key', password);
  } else {
    terminal.echo(fmt.error('[DEPLOYER\\] ', 'Failed to Log-In'));
  }

  terminal.pop();
};

const exec = async (action, project, custom) => {
  if (!projects.includes(project)) {
    terminal.echo(fmt.error('[DEPLOYER\\] ', 'Invalid Project Name'));
    terminal.echo();
    list();
    return;
  }

  const password = localStorage.getItem('admin-key') || prompt('Admin Key:');
  if (!password) return;

  pending = true;
  terminal.pause().set_prompt('');

  const query = `?c=${typeof custom === 'string' ? custom : +custom}`;
  const res = await fetch(`/${action}/${project}${query}`, { headers: { 'X-PASSWORD': password } });

  if (!res.ok) {
    terminal.echo(fmt.error('[DEPLOYER\\] ', `Failed To '${action}' Project '${project}'`));

    if (res.status === 401) terminal.echo(fmt.error('[DEPLOYER\\] ', res.statusText));

    terminal.resume().set_prompt(fmt.warning(cwd) + fmt.info(' > '));
    pending = false;

    return;
  }

  const data = await res.json();

  terminal.echo(fmt.info('[DEPLOYER\\] ', data.message));
};

terminal = $('#terminal').terminal(
  function (command) {
    let custom = false;

    const deployerCommand = (mainCommand, command) => {
      if (command.startsWith(mainCommand)) {
        const [_, project, ...args] = command.split(/\s+/).filter(Boolean);

        const customOption = args.slice(-2).join(' ');
        const customOptionRegex = /^-c(?:\s+([\w.-]+))?$|^--custom(?:\s+([\w.-]+))?$/;
        const match = customOptionRegex.exec(customOption);

        if (match) {
          const [_, workflowName] = match;
          custom = typeof workflowName === 'string' ? workflowName : true;
        }

        if (!project) {
          terminal.echo(fmt.error('No Project Specified!'));
          terminal.echo(fmt.info(`${mainCommand} <project> --c|--custom [workflowName\\]`));
          terminal.echo();
          list();
          return [false, true];
        }

        if (args.length > 2) {
          terminal.echo(fmt.error('Too Many Arguments!'));
          terminal.echo(fmt.info(`${mainCommand} <project> --c|--custom [workflowName\\]`));
          terminal.echo();
          list();
          return [false, true];
        }

        return [true, false, project];
      }

      return [false];
    };

    command = command.trim();

    const [isInit, isInvalidInit, projectToInit] = deployerCommand('init', command);

    if (isInit) {
      exec('init', projectToInit, custom);
      return;
    }

    const [isDeploy, isInvalidDeploy, projectToDeploy] = deployerCommand('deploy', command);

    if (isDeploy) {
      exec('deploy', projectToDeploy, custom);
      return;
    }

    switch (command) {
      case 'reload':
        location.reload();
        break;

      case 'reset':
        terminal.reset();
        break;

      case 'update':
        update();
        break;

      case 'cls':
        terminal.clear();
        break;

      case 'list':
        list();
        break;

      case 'login':
        terminal.push(
          function (command) {
            login(command);
          },
          { prompt: fmt.info('Admin Key: ') }
        );

        break;

      case 'logout':
        localStorage.removeItem('admin-key');
        break;

      case 'help':
        help();
        break;

      default:
        if (isInvalidInit || isInvalidDeploy) break;
        terminal.echo(fmt.error(`Command '${command}' Not Found!`));
        terminal.echo();
        help();
    }
  },
  {
    greetings: fmt.info(document.getElementById('greetings').innerHTML),
    prompt: fmt.warning('prompt', fmt.info(' > ')),
  }
);

$.terminal.defaults.formatters.push(input => {
  if (terminal.paused()) return input;

  let fileFormatted = false;

  return input.replace(/\w+|--?\w*/g, match => {
    if (match.startsWith('-')) return fmt.success(match);

    if (!fileFormatted) {
      fileFormatted = true;
      return fmt.warning(match);
    }

    return match;
  });
});

// * socket init and configuration
const socket = io('/');

socket.on('connect', () => {
  console.log('%c[DEPLOYER] Socket Connected', 'color: #00bfff;');
});

socket.on('cwd', _cwd => {
  cwd = _cwd;
  terminal.set_prompt(fmt.warning(cwd) + fmt.info(' > '));
});

socket.on('log', log => {
  terminal.echo(fmt(log));
});

socket.on('error', error => {
  terminal.echo(fmt.error(error));
});

socket.on('end', elapsedTime => {
  pending = false;

  terminal.echo(fmt.info('--------------------------------------------------'));
  terminal.echo(fmt.info('[DEPLOYER\\] Workflow Execution Finished'));
  terminal.echo(fmt.info(`Took ${elapsedTime} To Finish`));
  terminal.echo(fmt.info('--------------------------------------------------'));
  terminal.echo();

  terminal.resume().set_prompt(fmt.warning(cwd) + fmt.info(' > '));
});

window.addEventListener('beforeunload', e => {
  if (pending) {
    e.preventDefault();
    e.returnValue = true;
  }
});
