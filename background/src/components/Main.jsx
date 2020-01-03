import React from 'react';
import BookingCore from '../containers/core';
import Storage from '../containers/storage';
import Settings from '../containers/settings';
import System from '../containers/system';
import * as Authentication from '../containers/authentication';
import * as CallManager from '../containers/call_manager';
import * as EventsManager from '../containers/events';
import Initialize from '../containers/initialize';
import TelephonyConversation from '../containers/telephonyConversation';

/** ***********************************
 * This is the main component, everything starts here!
 * It loads all the backends for
 * - Authentication (Google Authentication)
 * - callManager (Finesse)
 * - events (XMPP Events - a.k.a Cisco Jabber)
 */
export default function Main() {
  // Load the authentication method
  const authentication = <Authentication.Booking />;
  // Load the call Manager
//  const callManager = <CallManager.Finesse />;
  // Load the events Manager
//  const eventsManager = <EventsManager.XMPPEvents />;
  const callManager = <CallManager.Finesse />;
  const eventsManager = <EventsManager.XMPPEvents />;

  return (<div>
    <BookingCore />
    <Initialize />
    <TelephonyConversation/>
    {authentication}
    {callManager}
    {eventsManager}
    <Storage />
    <Settings />
    <System />
  </div>);
}
