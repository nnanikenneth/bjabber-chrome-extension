import parsePhone from '../../background/src/action_creators/events/utils/phoneparser';

export function getPhoneNumber(callData, agentInfo) {
  const rawNumber = (callData.from === 'Me') ? callData.to : callData.from;
  if (rawNumber.length === 8 || rawNumber[0] === '+') {
    // internal number or already well-formatted number
    return rawNumber;
  }
  const cc = (`${callData.prefix}` || agentInfo.calling_code || '').replace(/[^0-9]/g, '');
  if (!cc) {
    return rawNumber;
  }
  const numberData = parsePhone(rawNumber, `+${cc}`);
  if (!numberData) {
    return rawNumber;
  }
  const has = name => agentInfo[name] !== '' && agentInfo[name] != null;
  const hasExternalPrefix = has('external_line_prefix');
  const hasIntlPrefix = has('international_prefix');
  if (`+${numberData.countryCode}` === agentInfo.calling_code) {
    return hasExternalPrefix ?
      agentInfo.external_line_prefix + rawNumber :
      agentInfo.calling_code + numberData.number;
  }
  if (hasIntlPrefix && hasExternalPrefix) {
    return agentInfo.external_line_prefix +
      agentInfo.international_prefix +
      cc +
      numberData.number;
  }
  return `+${cc}${numberData.number}`;
}

export function groupDisplayCalls(state) {
  const organizedItems = [];
  const mapByNumber = new Map();
  const callsLog = (state.callManager) ? state.callManager.callsLog : [];

  const { agentInfo } = state.callManager;
  for (const callData of callsLog) {
    const number = getPhoneNumber(callData, agentInfo);
    const callType = (callData.from === 'Me') ? 'OUT' : 'IN';
    if (mapByNumber.get(number)) {
      const data = mapByNumber.get(number);
      data.counter += 1;
      data.startTime = callData.startTime;
      data.endTime = callData.endTime;
      data.callType = callType;
      mapByNumber.set(number, data);
    } else {
      const entry = {
        number,
        display: number,
        callType,
        startTime: callData.startTime,
        endTime: callData.endTime,
        counter: 1,
      };
      mapByNumber.set(number, entry);
    }
  }

  // Sort by endTime
  for (const [_, value] of mapByNumber.entries()) {
    organizedItems.push(value);
  }

  organizedItems.sort((a, b) => {
    if (a.endTime > b.endTime) return -1;
    if (a.endTime < b.endTime) return 1;

    return 0;
  });

  return organizedItems;
}

export function getReasonByLabel(state, reasonLabel) {
  if ({}.hasOwnProperty.call(state.callManager.reasonsByLabel, reasonLabel)) {
    const idx = state.callManager.reasonsByLabel[reasonLabel];
    if (idx > -1) {
      return state.callManager.reasons[idx];
    }
  }

  return null;
}