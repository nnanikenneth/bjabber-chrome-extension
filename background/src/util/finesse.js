import parsePhone from '../action_creators/events/utils/phoneparser';

function getCallStartAndEndTimes(dialog) {
  if (dialog.participants.Participant) {
    let temp = [];
    if (dialog.participants.Participant.length !== undefined) {
      temp = dialog.participants.Participant;
    } else {
      temp.push(dialog.participants.Participant);
    }
    const participant = temp.filter(p =>
      p.state === 'DROPPED',
    );

    if (participant.length > 0) {
      return { startTime: participant[0].startTime, endTime: participant[0].stateChangeTime };
    }
    return { startTime: temp[0].startTime };
  }
  return {};
}

function getDialogActions(dialog, agent) {
  /* istanbul ignore next */
  if (dialog.participants.Participant && dialog.participants.Participant.length > 0) {
    const participant = dialog.participants.Participant.filter(p =>
      p.mediaAddress === agent.extension,
    );

    if (participant.length > 0 && participant[0].actions) {
      return participant[0].actions.action;
    }
  }

  /* istanbul ignore next */
  return [];
}

export function formatCallData(dialog, event, agent) {
  /* istanbul ignore next */
  const callProperties = {};
  /* istanbul ignore next */
  for (let i = 0; i < dialog.mediaProperties.callvariables.CallVariable.length; i += 1) {
    callProperties[dialog.mediaProperties.callvariables.CallVariable[i].name] =
      dialog.mediaProperties.callvariables.CallVariable[i].value;
  }

  /* istanbul ignore next */
  let lang = callProperties['user.Language'] || 'N/A';
  /* istanbul ignore next */
  let isOverflow = false;
  /* istanbul ignore next */
  let overflowTo = '';
  /* istanbul ignore next */
  // let overflowToFlagLang = '';

  // support for new style of naming the variable
  /* istanbul ignore next */
  if (callProperties['user.InOverflow']) {
    callProperties['user.InOVtoEnglish'] = callProperties['user.InOverflow'];
  }

  /* so 1 === en;
  otherwise InOVtoEnglish has the actual language code to which the call was overflown */
  /* istanbul ignore next */
  if ((callProperties['user.InOVtoEnglish'] && (`${callProperties['user.InOVtoEnglish']}`).match(/^(1|([a-z][a-z]))$/)) || window.fake_overflow) { // eslint-disable-line no-undef
    callProperties['user.InOVtoEnglish'] = !(`${callProperties['user.InOVtoEnglish']}`.match(/^([a-z][a-z])$/)) ? 'en' : callProperties['user.InOVtoEnglish'];
    lang += ` - overflown to ${(callProperties['user.InOVtoEnglish'] === 'en' ? 'English' : callProperties['user.InOVtoEnglish'])}`;
    isOverflow = true;
    overflowTo = callProperties['user.InOVtoEnglish'];
  }

  let parsedPhone = null;
  let parsedCC;
  let parsedPrefix;

  /* istanbul ignore next */
  if (dialog.fromAddress !== agent.extension) {
    parsedPhone = parsePhone(dialog.fromAddress, callProperties['user.CountryISO'] || agent.calling_code);
    if (parsedPhone && parsedPhone.countryISOCode !== 'nothing') {
      parsedCC = parsedPhone.countryISOCode;
      parsedPrefix = parsedPhone.countryCode;
    }
  }

  /* istanbul ignore next */
  const experiments = callProperties['user.ExpTested'] ? callProperties['user.ExpTested'].split(',') : [];

  /* istanbul ignore next */
  const callData = {
    actions: getDialogActions(dialog, agent),
    state: dialog.state,
    brand: callProperties['user.Brand'] || window.fake_brand || 'N/A', // eslint-disable-line no-undef
    country: callProperties['user.Country'] || 'N/A',
    countryCode: parsedCC || callProperties['user.CountryISO'] || 'N/A',
    prefix: parsedPrefix,
    lang, // is used for the text
    is_overflow: isOverflow, // we need to know this because then we might want to show to images
    overflow_to: isOverflow ? overflowTo : '',
    overflow_to_flag_lang: '', // Flags are not being show in jabber sdk
    department: callProperties['user.Department'] || 'N/A',
    queueTime: callProperties['user.Reserved1'] || 'N/A',
    display_from: dialog.fromAddress === agent.extension ? 'Me' : dialog.fromAddress, // set initial display_from to the same value as from in case it doesn't get overwritten anywhere
    from: dialog.fromAddress === agent.extension ? 'Me' : dialog.fromAddress,
    to: dialog.toAddress === agent.extension ? 'Me' : dialog.toAddress,
    uri: dialog.uri,
    id: parseInt(dialog.id, 10),
    media_id: callProperties['user.media.id'] || '',
    event: event || '',
    wrapUpReason: dialog.mediaProperties.wrapUpReason || '',
    experiments,
    __debug_raw_callvars: callProperties,
  };

  if (event === 'DELETE') {
    const times = getCallStartAndEndTimes(dialog);
    callData.startTime = times.startTime;
    callData.endTime = times.endTime;
  }
  // Let experiments add to the hash

  /* istanbul ignore next */
  const bookingNumber = callProperties['user.get.reservation'];
  /* istanbul ignore next */
  callData.menu_used = 0;
  /* istanbul ignore next */
  if (bookingNumber !== undefined && bookingNumber.match(/^[0-9]{9,}$/)) {
    callData.booking_number = bookingNumber;
    callData.menu_used = 1;
    callData.menu_usage = 'booking_number.match';
  } else {
    if (bookingNumber !== undefined && bookingNumber !== '' && bookingNumber !== 'X') {
      callData.menu_used = 1;
      callData.menu_usage = `other booknr ${bookingNumber}`;
    }
    callData.booking_number = undefined;
  }
  /* istanbul ignore next */
  const pin = callProperties['user.get.pin'];
  /* istanbul ignore next */
  if (pin !== undefined && pin.match(/^[0-9]{4}$/)) {
    callData.pin = pin;
    callData.menu_used = 1;
    callData.menu_usage = `${callData.menu_usage} PIN !`;
  } else {
    callData.pin = undefined;
  }

  /* istanbul ignore next */
  callData.is_cancelation = callProperties['user.cancel.reservation'];
  /* istanbul ignore next */
  if (callData.is_cancelation !== undefined && callData.is_cancelation === 1) {
    callData.menu_used = 1;
    callData.menu_usage = `${callData.menu_usage} CANCEL`;
  }
  // voice_phone_menu_usage
  /* istanbul ignore next */
  return callData;
}

export function formatPhoneNumber(num, agent) {
  const number = num.replace(/\(.*\)/g, '');
  let formattedNumber = number;
  if (number.length > 8) { // not an internal number
    if ((agent.external_line_prefix == null && agent.international_prefix == null) || (agent.external_line_prefix === '' && agent.international_prefix === '')) {
      // if we don't have dial settings, we're just passing + number to Finesse we
      // need to detect here if the number is a local number or not and we need to
      // make sure that we don't add any + in case of local numbers we do this by
      // trying to add the plus and see if the number can then be parsed if it can't
      // then we assume it's a local number and we don't need to add anything
      if (number[0] !== '+') {
        formattedNumber = number.replace(/[^0-9]/g, '');
        if (parsePhone(number, '+') !== null) {
          formattedNumber = `+${formattedNumber}`;
        }
      } else {
        formattedNumber = `+${number.replace(/[^0-9]/g, '')}`;
      }
    } else if (agent.originating_country === 'us') {
      if (number[0] === '+' && number[1] !== '1') {
        formattedNumber = agent.international_prefix + number.substring(1);
      } else if (number[0] === '+') {
        formattedNumber = agent.international_prefix + number.substring(1);
      }
      formattedNumber = agent.external_line_prefix + formattedNumber;
      formattedNumber = formattedNumber.replace(/[^0-9]/g, ''); // strip out anything not numeric
      // it might be that in some countries, intl format doesn't work for local numbers
    }
  }
  return formattedNumber;
}
