/**
 * @param {string} id
 * @param {() => Element} factory
 */
export function createIfNotExists(id, factory) {
  let element = document.getElementById(id);
  if (!element) {
    element = factory();
  }
  return element;
}

export function detectBackgroundDisconnection(port) {
  return new Promise((resolve) => {
    port.onDisconnect.addListener(() => {
      resolve();
    });
  });
}
