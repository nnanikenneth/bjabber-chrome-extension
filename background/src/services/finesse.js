// services are state-less
// they act as utility facades that abstract the details for complex operations
// normally, our interface to any sort of server API will be as a service

/* global btoa */
import Http from '../util/http';

function createUrl(connectionDetails, endpoint) {
  return `${connectionDetails.scheme}://${connectionDetails.host}/finesse/api/${endpoint}`;
}

function createDialogRequestXML(action, agentExtension) {
  return `<Dialog><targetMediaAddress>${agentExtension}</targetMediaAddress><requestedAction>${action}</requestedAction></Dialog>`;
}

function createUserRequestXML(reasonId) {
  const agentState = (reasonId === '101') ? 'READY' : 'NOT_READY';

  if (reasonId === '102') {
    return '<User><state>LOGOUT</state></User>';
  }
  const codeAsNumber = parseInt(reasonId, 10);
  if (codeAsNumber > 100) {
    reasonId = codeAsNumber - 100; // eslint-disable-line no-param-reassign
  }

  return `<User><state>${agentState}</state><reasonCodeId>${reasonId}</reasonCodeId></User>`;
}

function defaultHeaders(agent, usesBody = false) {
  const headers = {
    Accept: 'application/xml',
    Authorization: `Basic ${btoa(`${agent.login}:${agent.password}`)}`,
  };
  if (usesBody) {
    headers['Content-Type'] = 'application/xml';
  }
  return headers;
}

class Finesse {
  static putUser(connectionDetails, agentInfo) {
    const url = createUrl(connectionDetails, `User/${agentInfo.agentid}`);

    return Http.put(url, {
      body: `<User><state>LOGIN</state><extension>${agentInfo.extension}</extension></User>`,
      headers: defaultHeaders(agentInfo, true),
      timeout: 10000,
    });
  }

  static getQueues(connectionDetails, agentInfo) {
    const url = createUrl(connectionDetails, `User/${agentInfo.agentid}/Queues`);

    return Http.get(url, {
      headers: defaultHeaders(agentInfo),
      timeout: 10000,
      retry: {
        retries: 3,
        maxInterval: 1000,
      },
    });
  }

  static getAgentState(connectionDetails, agent) {
    const url = createUrl(connectionDetails, `User/${agent.agentid}`);

    return Http.get(url, {
      headers: defaultHeaders(agent),
      timeout: 4900,
    });
  }

  static getAgentDialogs(connectionDetails, agent) {
    const url = createUrl(connectionDetails, `User/${agent.agentid}/Dialogs`);

    return Http.get(url, {
      headers: defaultHeaders(agent),
      timeout: 10000,
      retry: {
        retries: 3,
        maxInterval: 1000,
      },
    });
  }

  static getSystemInfo(connectionDetails, agent, retry = null) {
    const url = createUrl(connectionDetails, 'SystemInfo');

    return Http.get(url, {
      headers: defaultHeaders(agent),
      timeout: 7000,
      retry,
    });
  }

  static makeCall(agent, connectionDetails, number) {
    const xml = `<Dialog><requestedAction>MAKE_CALL</requestedAction><toAddress>${number}</toAddress><fromAddress>${agent.extension}</fromAddress></Dialog>`;
    const url = createUrl(connectionDetails, `User/${agent.agentid}/Dialogs`);
    return Http.post(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 10000,
    });
  }

  static transferSSTCall(agent, connectionDetails, callId, number) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><toAddress>${number}</toAddress><requestedAction>TRANSFER_SST</requestedAction></Dialog>`;

    const url = createUrl(connectionDetails, `Dialog/${callId}`);
    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 15000,
    });
  }

  static transferCall(agent, connectionDetails, callId, number) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><toAddress>${number}</toAddress><requestedAction>TRANSFER</requestedAction></Dialog>`;

    const url = createUrl(connectionDetails, `Dialog/${callId}`);
    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 15000,
    });
  }

  static consultCall(agent, connectionDetails, callId, number) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><toAddress>${number}</toAddress><requestedAction>CONSULT_CALL</requestedAction></Dialog>`;
    const url = createUrl(connectionDetails, `Dialog/${callId}`);
    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 15000,
    });
  }

  static holdCall(agent, connectionDetails, callId) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><requestedAction>HOLD</requestedAction></Dialog>`;
    const url = createUrl(connectionDetails, `Dialog/${callId}`);

    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 15000,
    });
  }

  static retrieveCall(agent, connectionDetails, callId) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><requestedAction>RETRIEVE</requestedAction></Dialog>`;
    const url = createUrl(connectionDetails, `Dialog/${callId}`);
    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 10000,
    });
  }

  static endCall(agent, connectionDetails, callId) {
    const xml = `<Dialog><targetMediaAddress>${agent.extension}</targetMediaAddress><requestedAction>DROP</requestedAction></Dialog>`;

    const url = createUrl(connectionDetails, `Dialog/${callId}`);

    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 7000,
      retry: {
        retries: 3,
      },
    });
  }

  static answerCall(agent, connectionDetails, callId) {
    const xml = createDialogRequestXML('ANSWER', agent.extension);
    const url = createUrl(connectionDetails, `Dialog/${callId}`);

    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 10000,
    });
  }

  static changeState(agent, connectionDetails, newReason) {
    const xml = createUserRequestXML(newReason.id);
    const url = createUrl(connectionDetails, `User/${agent.agentid}`);

    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 7000,
    });
  }

  static changeWrapUpReason(agent, connectionDetails, callId, newWraupUpReason) {
    const xml = `<Dialog><mediaProperties><wrapUpReason>${newWraupUpReason.id}</wrapUpReason></mediaProperties><requestedAction>UPDATE_CALL_DATA</requestedAction></Dialog>`;
    const url = createUrl(connectionDetails, `Dialog/${callId}`);

    return Http.put(url, {
      body: xml,
      headers: defaultHeaders(agent, true),
      timeout: 7000,
    });
  }

  static loadReasonCodes(agent, connectionDetails) {
    const url = createUrl(connectionDetails, `User/${agent.agentid}/ReasonCodes?category=NOT_READY`);

    return Http.get(url, {
      headers: defaultHeaders(agent, true),
      retry: {
        retries: 3,
        maxInterval: 500,
      },
      timeout: 10000,
    });
  }

  static loadWrapupReasons(agent, connectionDetails) {
    const url = createUrl(connectionDetails, `User/${agent.agentid}/WrapUpReasons`);

    return Http.get(url, {
      headers: defaultHeaders(agent),
      retry: {
        retries: 3,
        maxInterval: 500,
      },
    });
  }
}

export default Finesse;

