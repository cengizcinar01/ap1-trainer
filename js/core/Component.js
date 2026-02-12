export default class Component {
  constructor(props = {}) {
    this.props = props;
  }

  render() {
    throw new Error('Component must implement render()');
  }

  escape(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
