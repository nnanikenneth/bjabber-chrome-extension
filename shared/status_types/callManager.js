export const CM_STATUS = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  FAILED: 'FAILED',
};

export const ACTION_STATUS = {

  REQUESTING_QUEUE: 'REQUESTING_QUEUE', // Clicked the 'show queues' button
  QUEUE_UPDATED: 'QUEUE_UPDATED', // Clicked the 'show queues' button
  QUEUE_REQUEST_FAILED: 'QUEUE_REQUEST_FAILED',

  REQUESTING_SYSTEM_INFO: 'REQUESTING_SYSTEM_INFO',

  MAKE_CALL: 'UI_MAKE_CALL', // CLicked the button to make call
  REQUESTING_CALL: 'REQUESTING_MAKE_CALL', // Requesting Finesse to Make the call

  UI_ANSWER_CALL: 'UI_ANSWER_CALL', // CLicked the button to answer the call
  REQUESTING_ANSWER_CALL: 'REQUESTING_ANSWER_CALL', // Requesting Finesse to answer the call

  UI_TRANSFER_CALL: 'UI_TRANSFER_CALL', // CLicked the button to answer the call
  REQUESTING_TRANSFER_CALL: 'REQUESTING_TRANSFER_CALL', // Requesting Finesse to answer the call

  REQUESTING_REASON_CODES: 'REQUESTING_REASON_CODES', // Requesting Finesse to load reason codes
  REQUESTING_WRAPUP_REASON_CODES: 'REQUESTING_WRAPUP_REASON_CODES', // Requesting Finesse to load wrap up reason codes

  UI_CONSULT_CALL: 'UI_CONSULT_CALL', // CLicked the button to answer the call
  REQUESTING_CONSULT_CALL: 'REQUESTING_CONSULT_CALL', // Requesting Finesse to answer the call

  UI_HOLD_CALL: 'UI_HOLD_CALL',
  REQUESTING_HOLD_CALL: 'REQUESTING_HOLD_CALL',

  UI_RETRIEVE_CALL: 'UI_RETRIEVE_CALL',
  REQUESTING_RETRIEVE_CALL: 'REQUESTING_RETRIEVE_CALL',

  UI_REASON_STATE_CHANGE: 'UI_REASON_STATE_CHANGE',
  REQUESTING_REASON_STATE_CHANGE: 'REQUESTING_REASON_STATE_CHANGE',

  REQUESTING_WRAPUP_CHANGE: 'REQUESTING_WRAPUP_CHANGE',

  REQUESTING_AGENT_REASON_STATE: 'REQUESTING_AGENT_REASON_STATE',
  REQUESTING_AGENT_SETTINGS: 'REQUESTING_AGENT_SETTINGS',

  REQUESTING_AGENT_DIALOGS: 'REQUESTING_AGENT_DIALOGS',

  REQUESTING_STAFF_EXTENSIONS: 'REQUESTING_STAFF_EXTENSIONS',

  UI_HANG_UP_CALL: 'UI_HANG_UP_CALL', // Clicked the button to hang up the call
  REQUESTING_END_CALL: 'REQUESTING_END_CALL', // Requesting Finesse to end the call

  // Sharing Context
  UI_SHARE_CONTEXT: 'UI_SHARE_CONTEXT',
  SHARING_CONTEXT: 'SHARING_CONTEXT',
  REQUESTING_CONTEXT: 'REQUESTING_CONTEXT',
  CONTEXT_CLICKED: 'CONTEXT_CLICKED',
};

export const CALL_STATUS = {
  FREE: 'FREE',
  INCOMING_CALL: 'INCOMING_CALL',
  OUTGOING_CALL: 'OUTGOING_CALL',

  INITIATING: 'INITIATING', // Call is being made, initiating

  // When ended go bac to FREE state
  TALKING: 'TALKING',
};

export const AGENT_STATE = {
  READY: 'READY',
  NOT_READY: 'NOT_READY',
  TALKING: 'TALKING',
  WORK: 'WORK',
  WORKING: 'WORKING',
  WORK_READY: 'WORK_READY',
  LOGOUT: 'LOGOUT',
  RESERVED: 'RESERVED',
};
