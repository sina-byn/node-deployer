const _fmt = (color, messages) => messages.map(m => `[[b;${color};]${m}]`).join('');

const fmt = (...messages) => _fmt('white', messages);

fmt.info = (...messages) => _fmt('deepskyblue', messages);

fmt.error = (...messages) => _fmt('red', messages);

fmt.success = (...messages) => _fmt('green', messages);

fmt.warning = (...messages) => _fmt('yellow', messages);

export default fmt;
