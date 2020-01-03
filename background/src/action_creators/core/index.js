import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import Voiceapi from '../../services/voiceapi';
import coreLogger from '../../coreLogger';

export function clearCacheRestart() {
  return (dispatch) => {
    const entries = coreLogger.logger;
    return Voiceapi.postBulkLog(entries)
      .catch(() => null)
      .then(() => dispatch({
        type: CORE_ACTIONS.CLEAR_CACHE_RESTART,
      }));
  };
}

