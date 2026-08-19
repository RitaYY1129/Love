import { App } from './app';

window.App = App;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}