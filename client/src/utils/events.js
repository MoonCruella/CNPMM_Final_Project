export const USER_UPDATED_EVENT = 'user:updated';

export const emitUserUpdated = () => {
  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT));
};

export const onUserUpdated = (callback) => {
  window.addEventListener(USER_UPDATED_EVENT, callback);
  return () => window.removeEventListener(USER_UPDATED_EVENT, callback);
};