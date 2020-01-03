import { diff } from 'deep-object-diff';
import coreLogger from './coreLogger';
import monitoringMiddleware from './util/monitoringMiddleware';
import logger from './logger';

export const BookingLogger = store => next => (action) => {
  const previousState = store.getState();

  if (!previousState.core.debugActive) {
    return next(action);
  }

  const logEntry = {};
  const hidePhoneLines = state => ({
    ...state,
    phoneLines: {
      ...state.phoneLines,
      phoneLines: ['Not logging for performance reasons'],
    },
  });

  const startTime = new Date();

  logEntry.startTime = startTime;
  logEntry.action = action;

  // Action itself
  const result = next(action);

  const endTime = new Date();

  const curState = store.getState();
  logEntry.stateDiff = diff(hidePhoneLines(previousState), hidePhoneLines(curState));
  logEntry.endTime = endTime;
  logEntry.duration = endTime - startTime;

  coreLogger.pushAction(logEntry);

  return result;
};

export const StopUndefinedActions = () => next => (action) => {
  try {
    if (typeof action === 'undefined' || typeof action.type === 'undefined') {
      let extraMsg = 'Undefined action';
      if (typeof action === 'object') {
        extraMsg = JSON.stringify(action);
      }
      throw new Error(`Hey! Your action is undefined, maybe you mispelled it somewhere? Action: ${extraMsg}`);
    } else {
      return next(action);
    }
  } catch (err) {
    logger.error('Caught an exception!', err);
    // Send the log buffer to Booking
    throw err;
  }
};

export const InterceptForMonitoring = monitoringMiddleware;

