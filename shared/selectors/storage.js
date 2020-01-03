
export function email(state) {
  if (state.storage && state.storage.data && state.storage.data.email) {
    return state.storage.data.email;
  }

  return '';
}

export function hideToolbar(state) {
  if (state.storage && state.storage.data && state.storage.data.hideToolbar) {
    return state.storage.data.hideToolbar;
  }
  return false;
}

