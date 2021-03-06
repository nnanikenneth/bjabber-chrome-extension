/* eslint-disable */

/*build/dist/CAXL-debug-2014.04.10787/src/webinit.js*/
/**
 * filename:        WebInit.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

/**
 * An initialization file that defines the root jabberwerx namespace and
 * a jabberwerx.system namespace that abstracts platform globals.
 *
 * This file is the standard browser implementation. It MUST be loaded before
 * any other source file including jQuery.
 */
;(function() {
    var jabberwerx = {};

    /**
     * @private
     * @namespace
     * @minimal
     *
     * jw.system contains functions and properties that abstract global classes
     * and objects that may not be available on all platforms.
     *
     * All functions defined in this namespace MUST be implemented.
     */
    jabberwerx.system = {
        /**
         * Get the no conflict jQuery and fixup environment as needed.
         *
         * Sets the global reference to jQuery and $ if not already assigned.
         * This function is called immediately on load of jabberwerx.js.
         *
         * @returns jQuery The jQuery that should be used
         */
        jQuery_NoConflict: function() {
            // reset jQuery and $ if not present.
            var jq = require('jquery'); //jQuery.noConflict(true);
            if (typeof(window.jQuery) == "undefined") {
                window.jQuery = jq;
            }
            if (typeof(window.$) == "undefined") {
                window.$ = jq;
            }
            return jq;
        },

        /**
         * Serialize the given XML node.
         *
         * May return null if serialization is not possible (not implemented)
         *
         * @param node The node to serialize.
         * @throws Error if some exception happened during serialization
         * @returns string the serializaton of node or null if serialization
         *          could not be accomplished.
         */
        serializeXMLToString: function(node)
        {
            if (node && (typeof(XMLSerializer) != "undefined")) {
                return new XMLSerializer().serializeToString(node)
            }
            return null;
        },

        //window.setTimeout(func, delay, [param1, param2, ...]);
        /**
         * Trigger func after delay milliseconds.
         *
         * Documentation for this function is exactly the same as
         * window.setTimeout.
         */
        setTimeout: function(func, delay) {
            return window.setTimeout(func, delay);
        },

        /**
         * Cancel a function scheduled run using setTimeout
         *
         * Documentation for this function is exactly the same as
         * window.clearTimeout.
         */
        clearTimeout: function(timeoutID) {
            window.clearTimeout(timeoutID);
        },

        /**
         * Trigger func after delay milliseconds and immediately reschedule
         *
         * Documentation for this function is exactly the same as
         * window.setInterval.
         */
        setInterval: function(func, delay) {
            return window.setInterval(func, delay);
        },

        /**
         * Stop triggering the function passed to a setInterval
         *
         * Documentation for this function is exactly the same as
         * window.clearInterval.
         */
        clearInterval: function(intervalID) {
            window.clearInterval(intervalID);
        },

        /**
         * A debug console or null if not available
         *
         * @returns console
         */
        getConsole: function() {
            //implemented as a getter to always refresh, ie console went away
            return  window.console || null;
        },

        /**
         * The current locale
         *
         * @returns locale
         */
        getLocale: function() {
            return navigator.userLanguage || navigator.language;
        }
    };

    /**
     * Create a new XML DOM
     *
     * @throws Error if new document could not be created
     * @returns Document The newly created XML document
     */
    jabberwerx.system.createXMLDocument = (function() {
        // First call initializes inner function to platform specific
        // document constructor.
        var fn = function() {
            fn = function(){return Windows.Data.Xml.Dom.XmlDocument();};
            try {
                return fn();
            } catch (ex) {
                fn = function() {
                    var doc = new ActiveXObject("Msxml2.DOMDocument.3.0");
                    doc.async = false;//synced loading
                    return doc;
                }
                try {
                    return fn();
                } catch (ex) {
                    fn = function() {
                        return document.implementation.createDocument(null, null, null);}
                    try {
                        return fn();
                    } catch (ex) {
                        fn = function(){
                            throw new Error("No document constructor available.");}
                        return fn();
                    }
                }
            }
        }

        return function() {
            try {
                return fn();
            } catch (ex) {
                console.warn("Could not create XML Document: " + ex.message);
                throw ex;
            }
        }
    })();

    /**
     * Parse the given string into an XML DOM.
     *
     * @param xmlstr The string to parse into an XML DOM
     * @throws TypeError if some unhandled exception occurs
     * @returns The DOM or an error DOM depending upon the implementation
     */
    jabberwerx.system.parseXMLFromString = function(xmlstr) {
        //note order is the same as createXMLDocument to ensure DOMs created
        //by parsing are the same type as DOMs created through document
        //windows 8
        var dom = null;
        try {
            //IE 8,9
            dom =  jabberwerx.system.createXMLDocument();
            dom.loadXML(xmlstr);
        } catch (ex) {
            try {
                //W3C
                dom = (new DOMParser()).parseFromString(xmlstr,"text/xml");
            } catch (ex) {
                dom  = null;
            }
        }
        dom = dom ? dom.documentElement : null;
        //check elem to see if a parse error occurred
        if (!dom || //ie
            (dom.nodeName == "parsererror") || //mozilla
            (jabberwerx.$("parsererror", dom).length > 0)) // safari
        {
            throw new TypeError("Parse error in trying to parse" + xmlstr);
        }
        return dom;
    };

    /**
     * All implementations of Node must have an xml property. Implemented
     * here to clearly call out that requirement.
     */
    if (typeof(Node) != "undefined" &&
        Node.prototype &&
        typeof(Object.defineProperty) != "undefined")
    {
        //readonly enumerable permenant
        Object.defineProperty(Node.prototype, "xml",
            {
                get: function () {
                    return jabberwerx.system.serializeXMLToString(this);
                },
                enumerable: true,
                writeable: false,
                configurable: true
            });
    }

    /**
     * @private
     * The document location
     *
     * The returned object is never null and should contain at least a protocol
     * and host properties.
     *
     * This is added outside jw.system as it is only used by stream and BOSH,
     * two classes that will always run in a browser. It is not required as
     * part of a jabberwerx.system implementation. Kept as an abstraction to
     * remove all window references in base library.
     *
     * @returns the documents location url
     */
    jabberwerx.system.getLocation = function() {
        return (document && document.location) || {};
    };

    window.jabberwerx = jabberwerx;
})();

/*build/dist/CAXL-debug-2014.04.10787/src/jabberwerx.js*/
/**
 * filename:        jabberwerx.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

/**
 * @private
 */
;(function(jabberwerx) {
    var jq = jabberwerx.system.jQuery_NoConflict();

    /**
     * jQuery instance used by this library.
     *
     * @property
     * @type String
     * @minimal
     */
    jabberwerx.$ = jq;

    /**
     * @namespace
     * <p>Cisco AJAX XMPP Library is an easy to use, AJAX-based XMPP client.
     * This namespace contains the core, non-UI classes and methods.</p>
     *
     * <p>To use these features you must have an account on an XMPP server.</p>
     *
     * <h3>Events</h3>
     * The Cisco AJAX XMPP Library eventing mechanism is implemented in
     * {@link jabberwerx.EventDispatcher} and {@link jabberwerx.EventNotifier}.
     * Any possible event that may be fired will trigger on
     * {@link jabberwerx.globalEvents}. See
     * <a href="../jabberwerxEvents.html">JabberWerx Events</a> for all
     * possible events.
     *
     * <h3>Configuration</h3>
     * The following configuration options are available:
     * <table>
     * <tr>
     *  <th>Name</th>
     *  <th>Default</th>
     *  <th>Description</th>
     * </tr>
     * <tr>
     *  <td>persistDuration</td>
     *  <td>30</td>
     *  <td>The number of seconds that persisted data is considered to still
     *  be valid.</td>
     * </tr>
     * <tr>
     *  <td>capabilityFeatures</td>
     *  <td>[]</td>
     *  <td>The base capabilities for clients, not including those defined
     *  by enabled controllers</td>
     * </tr>
     * <tr>
     *  <td>capabilityIdentity</td>
     *  <td><pre class="code">{
     *      category: "client",
     *      type: "pc",
     *      name: "JabberWerx AJAX",
     *      node: "http://jabber.cisco.com/jabberwerx"
     *}</pre></td>
     *  <td>The identity for clients' capabilities.</td>
     * </tr>
     * <tr>
     *  <td>unsecureAllowed</td>
     *  <td>false</td>
     *  <td><tt>true</tt> if plaintext authentication is allowed over
     *  unencrypted or unsecured HTTP channels</td>
     * </tr>
     * <tr>
     *  <td>baseReconnectCountdown</td>
     *  <td>30</td>
     *  <td>base number of seconds between a disconnect occurring and a
     * reconnect been initiated. The actual reconnect period will be the
     * {baseReconnectCountdown} +/- x%, where x is a random number between
     * 0 and 10. If {baseReconnectCountdown} is 0 then a reconnect will
     * never be attempted. {baseReconnectCountdown}  is also used as a persist
     * password flag. If 0 password is never persisted and is cleared from memory
     * as soon as possible (immediately after a connect ATTEMPT. IF > 0, password
     * is persisted obfuscated and the password remains in memory (accessable through
     * the client.connectParams object)
     </td>
     * </tr>
     * <tr>
     *  <td>enabledMechanisms</td>
     *  <td>["DIGEST-MD5", "PLAIN"]</td>
     *  <td>The list of SASL mechanism to enable by default.</td>
     * </tr>
     * </table>
     *
     * <p>To set any of these options, create an object called `jabberwerx_config`
     * in the global namespace, like this:</p>
     *
     *<pre class='code'>
     *      jabberwerx_config = {
     *          persistDuration: 30,
     *          unsecureAllowed: false,
     *          capabilityFeatures: ['http://jabber.org/protocol/caps',
     *                          'http://jabber.org/protocol/chatstates',
     *                          'http://jabber.org/protocol/disco#info',
     *                          'http://jabber.org/protocol/muc',
     *                          'http://jabber.org/protocol/muc#user'],
     *          capabilityIdentity: {
     *                  category: 'client',
     *                  type: 'pc',
     *                  name: 'JabberWerx AJAX',
     *                  node: 'http://jabber.cisco.com/jabberwerx'},
     *          baseReconnectCountdown: 30,
     *          enabledMechanisms: ["DIGEST-MD5", "PLAIN"]
     *      };
     *</pre>
     * <p>This code must be evaluated **before** including this file, jabberwerx.js.</p>
     * @minimal
     */
    jabberwerx = jq.extend(jabberwerx, {
        /**
         * JabberWerx Version
         * @property {String} version
         * @type String
         */
        version: '2014.04.0',

        /**
         * Internal config settings. These may be overwritten by the user at init time
         * by setting properties on a global object named jabberwerx_config.
         *
         * @property _config
         */
        _config: {
            /** The age past which a saved session is expired. */
            persistDuration: 30,
            /** Dictates if unsecure connections are allowed. A connection is considered unsecure if it
             * is SASL PLAIN or JEP-0078 password over http. */
            unsecureAllowed: false,
            /** Default feature list for entity capabilities (XEP-115) */
            capabilityFeatures: [],
            /** Default binding url */
            httpBindingURL: "/httpbinding",
            /** Default base reconnect period */
            baseReconnectCountdown: 30,
            /** Default SASL Mechanisms to enable */
            enabledMechanisms: ["DIGEST-MD5", "PLAIN"]
        },

        /**
         * @private
         * Returns the url for the currently configured install location.
         *
         * @type String
         * @returns The url for the currently configured install location.
         */
        _getInstallURL: function() {
            return this._getInstallPath();
        },

        /**
         * @private
         * Returns the url for the currently configured install location.
         *
         * @type String
         * @returns The url for the currently configured install location.
         */
        _getInstallPath: function() {
            var p = this._config.installPath;
            if (!p) {
                var target = String(arguments[0] || "jabberwerx") + ".js";

                p = jabberwerx.$("script[src$='" + target + "']").slice(0,1).attr("src");
                p = p.substring(0, p.indexOf(target));
            }

            return p.charAt(p.length - 1) == '/' ? p : p + '/';
        },

        /**
         * Converts an XMPP-formatted date/time string into a Javascript Date object.
         *
         * @param   {String} timestamp The timestamp string to parse from
         * @returns  {Date} The date object representing the timestamp
         * @throws  {TypeError} If {timestamp} cannot be parsed
         */
        parseTimestamp: function(timestamp) {
            var result = /^([0-9]{4})(?:-?)([0-9]{2})(?:-?)([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}(?:\.([0-9]+))?)(?:(Z|[-+]?[0-9]{2}:[0-9]{2})?)$/.exec(timestamp);
            if (!result) {
                throw new TypeError("timestamp string not recognized");
            }

            var ts, offset = 0;
            ts = Date.UTC(  Number(result[1]),
                            Number(result[2]) - 1,
                            Number(result[3]),
                            Number(result[4]),
                            Number(result[5]),
                            Number(result[6]),
                            0); //fractional part of seconds MAY be ignored (XEP-0082)

            if (result[8] && result[8] != "Z") {
                result = /^([-+]?[0-9]{2}):([0-9]{2})$/.exec(result[8]);
                if (result) {
                    offset += Number(result[1]) * 3600000;
                    offset += Number(result[2]) * 60000;
                }
            }

            return new Date(ts - offset);
        },
        /**
         * Converts a Date object into an XMPP-formatted date/time string.
         *
         * @param   {Date} ts The date object to generate from
         * @param   {Boolean} [legacy] <tt>true</tt> if the date/time string
         *          should conform to the legacy format in XEP-0091
         * @returns {String} The date/time string
         * @throws  {TypeError} If {ts} is not a Date object
         */
        generateTimestamp: function(ts, legacy) {
            var padFN = function(val, amt) {
                var result = "";
                if (amt > 1) {
                    result = arguments.callee(parseInt(val / 10), amt - 1);
                }
                return result + String(parseInt(val % 10));
            };

            if (!(ts && ts instanceof Date)) {
                throw new TypeError("Expected Date object");
            }
            var date = [
                    padFN(ts.getUTCFullYear(), 4),
                    padFN(ts.getUTCMonth() + 1, 2),
                    padFN(ts.getUTCDate(), 2)];
            var time = [
                    padFN(ts.getUTCHours(), 2),
                    padFN(ts.getUTCMinutes(), 2),
                    padFN(ts.getUTCSeconds(), 2)];

            if (legacy) {
                return date.join("") + "T" + time.join(":");
            } else {
                return date.join("-") + "T" + time.join(":") + "Z";
            }
        },


        /**
         * Internal JabberWerx init method. Clients do not need to call this.
         *
         * @private
         */
        _init: function() {
            this._inited = true;

            // copy user config into internal config
            if (typeof jabberwerx_config != 'undefined') {
                for (var name in jabberwerx_config) {
                    var val = jabberwerx_config[name];
                    if (jabberwerx.$.isArray(val) && val.concat) {
                        val = val.concat();
                    }
                    this._config[name] = val;
                }
            }
        },

        /**
         * Disconnects from the server and clears any stored chat sessions.
         */
        reset: function() {
            if (this.client) {
                this.client.disconnect();
            }
        },

        /**
         * Performs a "reduce" on the given object (array or otherwise). This
         * method iterates over the items in &lt;obj&gt;, calling &lt;fn&gt;
         * with the current item from &lt;obj&gt; and the current &lt;value&gt;.
         *
         * The signature for &lt;fn&gt; is expected to take two arguments: The
         * current item from &lt;obj&gt; to evaluate, and the current value of
         * the reduction. &lt;fn&gt; is expected to return the updated value.
         *
         * For example, the following sums all of the items in an array:
         * <pre class="code"
         * var value = jabberwerx.reduce([0,1,2],
         *                              function(item, value) {
         *                                     return item + value;
         *                              });
         * </pre>
         *
         * @param {Object|Array} obj The object to reduce
         * @param {Function} fn The callback to perform the reduction
         * @param [value] The initial value for reduction; may be undefined
         * @throws {TypeError} If {fn} is not a function object.
         * @returns The reduction value
         */
        reduce: function(obj, fn, value) {
            if (!jabberwerx.$.isFunction(fn)) {
                throw new TypeError("expected function object");
            }

            jabberwerx.$.each(obj, function(idx, item) {
                value = fn(item, value);
                return true;
            });

            return value;
        },
        /**
         * Removes duplicate items from the given array.
         *
         * @param {Array} arr The array to make unique
         * @returns {Array} The provided array {arr}
         */
        unique: function(arr) {
            if (!jabberwerx.$.isArray(arr)) {
                return arr;
            }

            var specified = {};
            for (var idx = arr.length - 1; idx >= 0; idx--) {
                var item = arr[idx];
                if (!specified[item]) {
                    specified[item] = true;
                } else {
                    arr.splice(idx, 1);
                }
            }

            return arr;
        },
        /**
         * Check whether the given node {o} is a TextNode
         *
         * @param {Node} o The object to check against
         * @returns {Boolean} <tt>true</tt> if {o} is a TextNode
         */
        isText: function(o) {
            return (
                //typeof TextNode === "object" ? o instanceof TextNode : //DOM2
                o && o.ownerDocument && o.nodeType == 3 && typeof o.nodeName == "string"
            );
        },

        /**
         * Check whether the given NODE {o} is an element node
         *
         * @param {Node} o The node to check against
         * @returns {Boolean} <tt>true</tt> if {o} is an element node
         */
        isElement: function(o) {
            return (
                //typeof Element === "object" ? o instanceof Element : //DOM2
                o &&
                (o.ownerDocument !== undefined) &&
                (o.nodeType == 1) &&
                (typeof o.nodeName == "string")
            );
        },

        /**
         * Check whether the given node {o} is a document node
         *
         * @param {Node} o The node to check against
         * @returns {Boolean} <tt>true</tt> if {o} is a document node
         */
        isDocument: function(o) {
            return (
                //typeof Document === "object" ? o instanceof Document : //DOM2
                o &&
                (o.documentElement !== undefined) &&
                (o.nodeType == 9) &&
                (typeof o.nodeName == "string")
            );
        },

        client: null,
        _inited: false
    });

    jabberwerx._config.debug = {
    /*DEBUG-BEGIN*/
        streams: {
            rawStanzaLogging: false,
            connectionStatus: false,
            clientStatus: false,
            entityLifeCycle: false,
            stanzaSelectors: false, // a LOT of info ...
            persistence: false,
            observers: false,
            collectionControllers: false
        },
    /*DEBUG-END*/
        on: true
    };

    /**
     * @class
     * Utility class to build DOMs programmatically. This class is used to
     * create most of the XMPP data.
     *
     * @property {jabberwerx.NodeBuilder} parent The parent node builder
     * @property {Element} data The current data
     * @property {Document} document The document (used for creating nodes)
     *
     * @description
     * <p>Creates a new jabberwerx.NodeBuilder</p>
     *
     * <p>The value of {data} may be an Element or a String. If it is a string,
     * it is expected to be an expanded name in one of the following forms:</p>
     *
     * <ol>
     *<li>{namespace-uri}prefix:local-name</li>
     * <li>{namespace-uri}local-name</li>
     * <li>prefix:local-name</li>
     * <li>local-name</li>
     * </ol>
     *
     * @param   {Element|String} [data] The context element, or the expanded-name
     *          of the root element.
     * @throws  {TypeError} If {data} is defined, not an element, not a
     *          Document, or not a valid expanded name
     * @minimal
     */
    jabberwerx.NodeBuilder = function(data) {
        var parent, doc, ns = null;

        if (data instanceof jabberwerx.NodeBuilder) {
            // NOT FOR EXTERNAL USE: support a hierarchy of
            // NodeBuilders.
            this.parent = parent = arguments[0];
            data = arguments[1];
            doc = parent.document;
            ns = parent.namespaceURI;
        }

        if (jabberwerx.isDocument(data)) {
            doc = data;
            data = doc.documentElement;
            ns = data.namespaceURI || data.getAttribute("xmlns") || ns;
        } else if (jabberwerx.isElement(data)) {
            if (!doc) {
                doc = data.ownerDocument;
            } else if (data.ownerDocument !== doc) {
                data = (doc.importNode) ?
                       doc.importNode(data, true) :
                       data.cloneNode(true);
            }

            if (parent && parent.data) {
                parent.data.appendChild(data);
            }
            if (!doc.documentElement) {
                doc.appendChild(data);
            }

            ns = data.namespaceURI || data.getAttribute("xmlns") || ns;
        } else if (data) {
            if (!doc) {
                doc = this._createDoc();
            }

            var ename, ln, pre;

            ename = this._parseName(data, ns);
            ns = ename.namespaceURI;
            data = this._createElem(doc, ns, ename.localName, ename.prefix);
        } else if (!parent) {
            doc = this._createDoc();
        }

        this.document = doc;
        this.data = data;
        this.namespaceURI = ns;
    };

    /* @extends jabberwerx.NodeBuilder.prototype */
    jabberwerx.NodeBuilder.prototype = {
        /**
         * Adds or updates an attribute to this NodeBuilder's data.
         *
         * <p><b>NOTE:</b> namespaced attributes are not supported</p>
         *
         * @param {String} name The name of the attribute
         * @param {String} val The attribute value
         * @returns {jabberwerx.NodeBuilder} This builder
         * @throws  {TypeError} if {name} is not valid
         */
        attribute: function(name, val) {
            var ename = this._parseName(name);

            if (ename.prefix && ename.prefix != "xml" && ename.prefix != "xmlns") {
                var xmlns = "xmlns:" + ename.prefix;

                if (!this.data.getAttribute(xmlns)) {
                    this.attribute(xmlns, ename.namespaceURI || "");
                }
            } else if (ename.prefix == "xml") {
                ename.namespaceURI = "http://www.w3.org/XML/1998/namespace";
            } else if (ename.prefix == "xmlns" || ename.localName == "xmlns") {
                ename.namespaceURI = "http://www.w3.org/2000/xmlns/";
            } else if (!ename.prefix && ename.namespaceURI !== null) {
                throw new TypeError("namespaced attributes not supported");
            }

            var doc = this.document;
            var elem = this.data;
            if (typeof(doc.createNode) != "undefined") {
                var attr = doc.createNode(2,
                                          ename.qualifiedName,
                                          ename.namespaceURI || "");
                attr.value = val || "";
                elem.setAttributeNode(attr);
            } else if (typeof(elem.setAttributeNS) != "undefined") {
                elem.setAttributeNS(ename.namespaceURI || "",
                                    ename.qualifiedName,
                                    val || "");
            } else {
                throw new TypeError("unsupported platform");
            }

            return this;
        },
        /**
         * Appends a new text node to this NodeBuilder's data.
         *
         * @param {String} val The text node value
         * @returns {jabberwerx.NodeBuilder} this builder
         */
        text: function(val) {
            if (!val) {
                return this;
            }

            var txt = this.document.createTextNode(val);
            this.data.appendChild(txt);

            return this;
        },
        /**
         * Appends a new element to this NodeBuilder's data, with the given
         * name and attributes. The created element is automatically appended
         * to this NodeBuilder's data.
         *
         * <p>If expanded-name uses form 2 (local-name, no namespace), then the
         * namespace for the parent is used.</p>
         *
         * @param {String} name The expanded name of the new element
         * @param {Object} [attrs] A hashtable of attribute names to
         *        attribute values
         * @returns {jabberwerx.NodeBuilder} The builder for the new element,
         *           with the current builder as its parent.
         * @throws  {TypeError} if {name} is not a valid expanded name
         */
        element: function(name, attrs) {
            if (!attrs) {
                attrs = {};
            }
            if (typeof(name) != "string") {
                throw new TypeError("name is not a valid expanded name");
            }
            var builder = new jabberwerx.NodeBuilder(this, name);
            for (var key in attrs) {
                if (key == 'xmlns') { continue; }
                builder.attribute(key, attrs[key]);
            }

            return builder;
        },

        /**
         * Appends the given node to this NodeBuilder's data:
         * <ul>
         * <li>If {n} is a document, its documentElement is appended to
         * this NodeBuilder's data and a NodeBuilder wrapping that element
         * is returned</li>
         * <li>If {n} is an element, it is cloned and appended to this
         * NodeBuilder's data and a NodeBuilder wrapping the cloned element
         * is returned</li>
         * <li>If {n} is a TextNode, its value is appended to this
         * NodeBuilder's data and this NodeBuilder is returned</li>
         * <li>Otherwise, a TypeError is thrown</li>
         * <ul>
         *
         * @param   {Node} n The node to append
         * @returns  {jabberwerx.NodeBuilder} The builder appropriate for {node}
         * @throws   {TypeError} If {node} is invalid
         */
        node: function(n) {
            if (!n) {
                throw new TypeError("node must exist");
            }

            if (jabberwerx.isDocument(n)) {
                n = n.documentElement;
            }

            if (jabberwerx.isElement(n)) {
                return new jabberwerx.NodeBuilder(this, n);
            } else if (jabberwerx.isText(n)) {
                return this.text(n.nodeValue);
            } else {
                throw new TypeError("Node must be an XML node");
            }

            return this;
        },

        /**
         * <p>Appends the given value as parsed XML to this NodeBuilder's
         * data.</p>
         *
         * @param {String} val The XML to parse and append
         * @returns {jabberwerx.NodeBuilder} This NodeBuilder
         */
        xml: function(val) {
            var wrapper = (this.namespaceURI) ?
                          "<wrapper xmlns='" + this.namespaceURI + "'>" :
                          "<wrapper>";
            wrapper += val + "</wrapper>";
            var parsed = this._parseXML(wrapper);
            var that = this;

            jabberwerx.$(parsed).contents().each(function() {
                if (jabberwerx.isElement(this)) {
                    new jabberwerx.NodeBuilder(that, this);
                } else if (jabberwerx.isText(this)) {
                    that.text(this.nodeValue);
                }
            });

            return this;
        },

        /**
         * @private
         * <ol>
         * <li>{namespace-uri}prefix:local-name</li>
         * <li>{namespace-uri}local-name</li>
         * <li>prefix:local-name</li>
         * <li>local-name</li>
         * </ol>
         */
        _parseName: function(name, ns) {
            var ptn = /^(?:\{(.*)\})?(?:([^\s{}:]+):)?([^\s{}:]+)$/;
            var m = name.match(ptn);

            if (!m) {
                throw new TypeError("name '" + name + "' is not a valid ename");
            }

            var retval = {
                namespaceURI: m[1],
                localName: m[3],
                prefix: m[2]
            };

            if (!retval.localName) {
                throw new TypeError("local-name not value");
            }

            retval.qualifiedName = (retval.prefix) ?
                    retval.prefix + ":" + retval.localName :
                    retval.localName;

            if (!retval.namespaceURI) {
                // IE work-around, since RegExp returns "" if:
                //  1) it evaluates to "" OR
                //  2) it is missing!
                if (name.indexOf("{}") == 0) {
                    retval.namespaceURI = "";
                } else {
                    retval.namespaceURI = ns || null;
                }
            }

            return retval;
        },

        /**
         * @private
         */
        _createDoc: jabberwerx.system.createXMLDocument,

        /**
         * @private
         */
        _parseXML: jabberwerx.system.parseXMLFromString,

        /**
         * @private
         */
        _createElem: function(doc, ns, ln, pre) {
            var parent = this.parent;
            var elem;
            var qn = pre ? (pre + ":" + ln ) : ln;
            var declare = true;

            // determine if the namespace must be declared
            if (parent && parent.data) {
                if (    parent.namespaceURI == ns ||
                        ns == null ||
                        ns == undefined) {
                    declare = false;
                }
            } else {
                // declared if namespace is defined (even "")
                declare = (ns != null && ns != undefined);
            }

            if (typeof(doc.createNode) != "undefined") {
                elem = doc.createNode(1, qn, ns || "");
                if (declare) {
                    var decl = doc.createNode(2,
                                              (pre ? "xmlns:" + pre : "xmlns"),
                                              "http://www.w3.org/2000/xmlns/");
                    decl.value = ns || "";
                    elem.setAttributeNode(decl);
                }
            } else if (typeof(doc.createElementNS) != "undefined") {
                elem = doc.createElementNS(ns || "", qn);
                if (declare) {
                    elem.setAttributeNS("http://www.w3.org/2000/xmlns/",
                                        (pre ? "xmlns:" + pre : "xmlns"),
                                        ns || "");
                }
            } else {
                throw Error("unsupported platform");
            }

            if (!doc.documentElement) {
                doc.appendChild(elem);
            } else if (parent && parent.data) {

                parent.data.appendChild(elem);
            }

            return elem;
        }
    };

    /**
     * @namespace
     * Namespace for XHTML-IM functions and constants.
     * @minimal
     */
    jabberwerx.xhtmlim = {};

    /**
     * An array of css style properties that may be included in xhtml-im.
     * Default values are from XEP-71 Recommended Profile but may be modified
     * at anytime. For example some clients may want to ignore font size
     * property would add the following to their initialization code:
     * <pre class='code'>
     *  delete jabberwerx.xhtmlim.allowedStyles[
     *      jabberwerx.xhtmlim.allowedStyles.indexOf("font-size")
     *  ];
     * </pre>
     *
     * @property {Array} jabbewerx.xhtmlim.allowedStyles
     * @minimal
     */
    jabberwerx.xhtmlim.allowedStyles = [
        "background-color",
        "color",
        "font-family",
        "font-size",
        "font-style",
        "font-weight",
        "margin-left",
        "margin-right",
        "text-align",
        "text-decoration"
    ];


    /**
     * A map of tags that may be included in xhtml-im. The defaults are defined
     * in XEP-71 Recommended Profile. The map is indexed by tag and provides an
     * array of allowed attributes for that tag. Clients may modify this map at
     * any time to change behavior. For example a client that wanted to include
     * table tags would add the following to their initialization code:
     * <pre class="code">
     *  jabberwerx.$.extend(jabberwerx.xhtmlim.allowedTags,{
     *      table: ["style",
     *              "border",
     *              "cellpadding",
     *              "cellspacing",
     *              "frame",
     *              "summary",
     *              "width"]
     *  })
     * </pre>
     *
     * @property {Map} jabbewerx.xhtmlim.allowedTags
     * @minimal
     */
    jabberwerx.xhtmlim.allowedTags = {
        br:         [],
        em:         [],
        strong:     [],
        a:          ["style","href","type"],
        blockquote: ["style"],
        cite:       ["style"],
        img:        ["style", "alt", "height", "src", "width"],
        li:         ["style"],
        ol:         ["style"],
        p:          ["style"],
        span:       ["style"],
        ul:         ["style"],
        body:       ["style", "xmlns", "xml:lang"]
    }


    /**
     * Sanitize xhtmlNode by applying XEP-71 recommended profile.
     *
     * Each node in the given DOM is checked to make sure it is an
     * {@link jabberwerx.xhtmlim.allowedTags}, with allowed attributes and
     * style values. If a node is not allowed it is removed from the DOM and
     * its children reparented to its own parent. If an attribute is not
     * allowed it is removed. If the attribute's name is "href" or "src" and
     * its value starts with 'javascript:', its element is removed and the
     * children reparented. Finally any css values not in the
     * {@link jabberwerx.xhtmlim.allowedStyles} array is removed from the style
     * attribute.
     *
     * xhtmlNode must be a &lt;body/&gt; or one of the other allowed tags.
     * Typical usage of this function would be to clean an html fragment (an
     * entire &lt;p/&gt; for instance) or in preperation for a message stanza
     * by passing a &lt;body/&gt; element.
     *
     * @param DOM xhtmlNode <body xmlns='http://www.w3.org/1999/xhtml'/>
     * @returns DOM A reference to xhtmlNode
     * @throws TYPE_ERROR if xhtmlNode is not a DOM or not an allowed tag
     * @minimal
     */
    jabberwerx.xhtmlim.sanitize = function(xhtmlNode) {
        //private filter function, expects a jq
        var filterNodes = function(fNode) {
            //keep element children to recurse later
            var myKids = fNode.children();
            var fDOM = fNode.get(0);
            if (jabberwerx.xhtmlim.allowedTags[fDOM.nodeName] === undefined) {
                fNode.replaceWith(fDOM.childNodes);
                fNode.remove();
            } else { //filter attributes
                var i = 0;
                while (i < fDOM.attributes.length) {
                    var aName = fDOM.attributes[i].nodeName;
                    if (jabberwerx.$.inArray(aName, jabberwerx.xhtmlim.allowedTags[fDOM.nodeName]) == -1) {
                        fNode.removeAttr(aName); //removes from attributes
                    } else {
                        if (aName == "href" || aName == "src") {
                            // filter bad href/src values
                            var aValue = fDOM.attributes[i].nodeValue;
                            if (aValue.indexOf("javascript:") == 0) {
                                fNode.replaceWith(fDOM.childNodes);
                                fNode.remove();
                            }
                        } else if (aName == "style") {
                            // filter unknown css  properties
                            var rProps = jabberwerx.$.map(
                                fDOM.attributes[i].value.split(';'),
                                function(oneStyle, idx) {
                                    return jabberwerx.$.inArray(oneStyle.split(':')[0], jabberwerx.xhtmlim.allowedStyles) != -1 ? oneStyle : null;
                                });
                            fNode.attr("style", rProps.join(';'));
                        }
                        ++i;
                    }
                }
            }

            for (var i = 0; i < myKids.length; ++i) {
                if (jabberwerx.isElement(myKids[i])) {
                    filterNodes(jabberwerx.$(myKids[i]));
                }
            }
        } //filterNodes

        if (!jabberwerx.isElement(xhtmlNode)) {
            throw new TypeError("xhtmlNode must be a DOM");
        }
        if (jabberwerx.xhtmlim.allowedTags[xhtmlNode.nodeName] === undefined) {
            throw new TypeError("xhtmlNode must be an allowed tag")
        }

        filterNodes(jabberwerx.$(xhtmlNode));
        return xhtmlNode;
    }


    jabberwerx._init();
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/jwapp/JWCore.js*/
/**
 * filename:        JWCore.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

/**
 * @namespace
 * A namespace for the JWApp framework. The framework is a general Javascript
 * application framework, built for but not tied to JabberWerx.
 *
 * Note: The jabberwerx.JWBase class does not live in this namespace.
 * Note: The JW framework depends on jQuery; jQuery must be loaded before this code runs.
 */

;(function(jabberwerx) {
    /**
     * @namespace
     * <p>Namespace that holds a collection of functions and properties used
     * throughout the library.</p>
     *
     * @minimal
     */
    jabberwerx.util = {};

    var initializing = false;

    /**
     * @class jabberwerx.JWBase
     *
     * <p>The base class for objects in the JWApp framework.</p>
     *
     * <p>Objects derived from jabberwerx.JWBase get the following features:</p>
     *
     * <h3>Object Graph Client-Side Persistence </h3>
     * <p>A graph of JWBase-derived objects can be serialized, stored, and re-loaded
     * via {@link jabberwerx.util.saveGraph} and {@link jabberwerx.util.loadGraph}. Cycles and uniqueing are handled via an
     * object registry and per-object guids. Note that cycles among non-JWBase objects
     * will result in infinite recursion, as per usual.</p>
     *
     * <p>FYI, there are two steps to loading a serialized graph: unserializing and
     * "rehydrating". We unserialize the object registry via eval(). Rehydrating
     * involves turning the resulting bare JS objects with keys and values into full JW objects,
     * with appropriate methods and prototype chain in place. For this to work, the
     * serialization must include the objects' class name. For now this is accomplished
     * in the class definition/declaration: {@link jabberwerx.JWBase.extend} takes a string parameter
     * that must be the fully-qualified name of the class being defined.</p>
     *
     * <p>Client-side storage is handled via dojo storage. By default any given JW object
     * in a graph will NOT be saved. Objects that want to be saved must implement
     * {@link jabberwerx.JWBase#shouldBeSavedWithGraph} and return true.</p>
     *
     * <p>Typically only model objects should be saved to a persistent store. See
     * {@link jabberwerx.JWModel}, which does return true for `shouldBeSavedWithGraph`.</p>
     *
     * <h3>Object-Method Invocation Objects</h3>
     * <p>A jabberwerx.JWBase object can generate portable function objects that, when invoked, are
     * scoped automatically to their generating instance. The graph storage engine
     * treats these function objects specially, so the observer relationships among
     * stored objects can be serialized and restored automatically.</p>
     *
     * @description
     * Creates a new jabberwerx.JWBase object.
     *
     * @constructs jabberwerx.JWBase
     * @minimal
     */
    jabberwerx.JWBase = function(){};     // The base class constructor (does nothing; used to generate a prototype)

    /**
     * This method is called to initialize the JWBase-derived instance.
     */
    jabberwerx.JWBase.prototype.init = function() {
    };
    /**
     * This method is offered as a way to release resources that were acquired by an object
     * during its lifetime. However, as Javascript does not have any built-in way to trigger code
     * when an object is about to be garbage-collected, or when a temporary/stack-based object
     * goes out of scope, this method will have to be called by hand.
     */
    jabberwerx.JWBase.prototype.destroy = function() {
        // currently not tracking observees; subclasses must unregister by hand
        // ... not that there's any way to get destructors to run anyway ... :(

        return null;
    };

    /**
     * Get the class name of this object.
     *
     * @type String
     * @returns The fully-qualified name of the object's class.
     */
    jabberwerx.JWBase.prototype.getClassName = function() {
        return this._className || '';
    };

    /**
     * Returns the objects' classname, in brackets.
     * Override if desired.
     *
     * @type String
     * @returns A string representation of this object.
     */
    jabberwerx.JWBase.prototype.toString = function() {
        return '[' + this.getClassName() + ']';
    };

    /**
     * By default JW objects will not be saved with the object graph.
     * Subclasses can override this behavior by implementing this method
     * and having it return true.
     *
     * The jabberwerx.JWModel class does this for you; in general, model objects are
     * the only objects that should be saved in a persistent store.
     *
     * @type Boolean
     * @returns Whether this object should be saved with the object graph.
     */
    jabberwerx.JWBase.prototype.shouldBeSavedWithGraph = function() {
        return false;
    };

    /**
     * By default JW objects will not be serialized inline from their references.
     * Subclasses can override this behavior by implementing this method
     * and having it return true.
     *
     * @type Boolean
     * @returns Whether this object should be serialized inline with its references.
     */
    jabberwerx.JWBase.prototype.shouldBeSerializedInline = function() {
        return false;
    };

    /**
     * A hook for objects to prepare themselves for serialization. Subclasses
     * should use this to do any custom serialization work. Typically this will
     * involve serializing by hand any foreign (eg, non-JWModel-based) object
     * references that will be necessary for the object's functioning when restored
     * from serialization.
     *
     * It's important to note that there is no guarantee of the order in which
     * objects will have this method invoked, relative to other objects in the
     * graph. Basically, you can't depend on other object's `willBeSerialized`
     * having been called or not called when you're in this method.
     * @see {@link #wasUnserialized}
     */
    jabberwerx.JWBase.prototype.willBeSerialized = function() {
    };

    /**
     * A hook for objects to undo any custom serialization work done
     * in {@link #willBeSerialized}.
     *
     * As with that method, there's no guarantee of the order in which
     * objects will have this method invoked. When this method is invoked,
     * every object in the graph will have been rehydrated into a fully-fleshed-out
     * JW object, with data and prototype chain in place, but there is no
     * guarantee that any other object will have had its `wasUnserialized` invoked.
     */
    jabberwerx.JWBase.prototype.wasUnserialized = function() {
        // whack any observers that did not survive serialization
        jabberwerx.$.each(this._observerInfo, function(eventName, info) {
            info.observers = jabberwerx.$.grep(info.observers, function(observer, i) { return typeof observer.target != 'undefined'; });
        });
    };

    /**
     * A chance for recently-unserialized objects to do something and be assured that
     * every object in the graph has run its custom post-serialization code.
     */
    jabberwerx.JWBase.prototype.graphUnserialized = function() {
    }

    /**
     * Subclasses can call this with one of their method names to get back a storable, portable,
     * and invokable function object. The result can be passed to anything expecting a bare callback.
     *
     * @see jabberwerx.util.generateInvocation
     * @param {String} methodName The name of this object's method to wrap in an invocation object.
     * @param {Array} [boundArguments] Arguments can be bound to the eventual invocation of your object
     * method here at the invocation creation. These arguments will **preceed** in the argument list any
     * arguments that are passed to your method at the actual call site.
     * @type Function
     * @returns A bare callback
     */
    jabberwerx.JWBase.prototype.invocation = function(methodName, boundArguments) {
        return jabberwerx.util.generateInvocation(this, methodName, boundArguments);
    };

    /**
     * @private
     * Creates the override chain.  If {base} and {override} are both
     * functions, then this method generates a new function that:
     * <ol>
     * <li>Remembers any current superclass method (e.g. overriding an
     * override)</li>
     * <li>Sets this._super to {base}</li>
     * <li>Calls {override}, remembering its return value (if any)</li>
     * <li>Sets this._super back to its previous value (if any).</li>
     * <li>Returns the result from {override}</li>
     * </ol>
     *
     * If {override} is undefined and {base} is defined (regardless
     * of its type), {base} is returned as-is. If {override} and {base} are
     * not functions, or if {base} is not a function, {override} is returned
     * as-is.</p>
     *
     * @param   base The base method or property (may be undefined)
     * @param   override The overriding method or property (may be undefined)
     * @returns The function providing the override chain, or {base} or
     *          {override} as appropriate
     */
    var __jwa__createOverrideChain = function(base, override) {
        if (base !== undefined && override === undefined) {
            return base;
        }

        if (    !jabberwerx.$.isFunction(base) ||
                !jabberwerx.$.isFunction(override)) {
            return override;
        }

        return function() {
            var tmp = this._super;

            this._super = base;
            var retval = override.apply(this, arguments);
            this._super = tmp;

            return retval;
        };
    };

    /**
     * Provide mixin support to Javascript objects. This method applies all of
     * the properties and methods from {prop} to this type. A copy of {prop}
     * is made before it is applied, to ensure changes within this type do
     * not impact the mixin definition.</p>
     *
     * <p><b>NOTE:</b> This method should not be called for jabberwerx.JWBase directly.
     * Instead, specific subclasses of jabberwerx.JWBase may use it to include new
     * functionality.</p>
     *
     * <p>Mixin properties are shadowed by the jabberwerx.JWBase class in the same way
     * as super class properties are. In this case, the mixin is considered
     * the super class, and any properties defined in the class override
     * or shadow those with the same name in the mixin.</p>
     *
     * <p>Mixin methods may be overridden by the jabberwerx.JWBase class in the same
     * manner as super class methods are.  In this case, the mixin's method
     * is considered to be the "_super":</p>
     *
     * <p><pre class='code'>
        AMixin = {
            someProperty: "property value",
            doSomething: function() {
                jabberwerx.util.debug.log("something is done");
            }
        };
        MyClass = jabberwerx.JWBase.extend({
            init: function() {
                this._super();  //calls JWBase.prototype.init
            },
            doSomething: function() {
                jabberwerx.util.debug.log("preparing to do something");
                this._super();  //calls AMixin.doSomething
                jabberwerx.util.debug.log("finished doing something");
            }
        }, "MyClass");

        MyClass.mixin(AMixin);
     * </pre></p>
     *
     * @param   {Object} prop The mixin to include
     */
    jabberwerx.JWBase.mixin = function(prop) {
        // create a deep copy of the mixin, to prevent corruption of the Mixin
        prop = jabberwerx.$.extend(true, {}, prop);

        // Apply the mixin's properties and methods, treating the mixin methods
        // as if coming from a super-class (the opposite of extend!)
        for (var name in prop) {
            this.prototype[name] = __jwa__createOverrideChain(
                    prop[name],
                    this.prototype[name]);
        }
    };

    /**
     * Provide intercept support to Javascript objects. This method applies all of
     * the properties and methods from {prop} to this type. A copy of {prop}
     * is made before it is applied, to ensure changes within this type do
     * not impact the intercept definition.</p>
     *
     * <p><b>NOTE:</b> This method should not be called for jabberwerx.JWBase directly.
     * Instead intercept a specific subclasses of jabberwerx.JWBase by adding new
     * or overriding exisiting functions and properties.</p>
     *
     * <p>Intercept functions are inserted into the top of the super class call stack,
     * that is a intercept function's _super call will invoke the original, overridden
     * method. Other properties are "overridden" by changing the property directly.</p>
     *
     * <p><pre class='code'>
     * MyClass = jabberwerx.JWBase.extend({
     *        someProperty: "MyClass property"
     *        init: function() {
     *            this._super();  //calls JWBase.prototype.init
     *        },
     *        doSomething: function() {
     *            jabberwerx.util.debug.log("something is done");
     *        }
     *    }, "MyClass");
     *    AnIntercept = {
     *        someProperty: "AnIntercept property",
     *        doSomething: function() {
     *            jabberwerx.util.debug.log("preparing to do something");
     *            this._super(); //call MyClass.doSomething
     *            jabberwerx.util.debug.log("post something");
     *        }
     *    };
     *
     * MyClass.intercept(AnIntercept);
     * </pre></p>
     *
     * @param   {Object} prop The intercept to include
     */
    jabberwerx.JWBase.intercept = function(prop) {
        prop = jabberwerx.$.extend(true, {}, prop);
        for (var name in prop) {
            this.prototype[name] =
                __jwa__createOverrideChain(this.prototype[name], prop[name]);
        }
    };

    /**
     * Provide classical inheritance to Javascript objects.
     *
     * Following John Resig's Class,
     * <a href="http://ejohn.org/blog/simple-javascript-inheritance/">http://ejohn.org/blog/simple-javascript-inheritance/</a>
     * Inspired by base2 and Prototype
     *
     * One important addition to Resig's code: we provide a quasi-"copy constructor"
     * that will take a bare javascript object with the data and classname of a
     * JW object, and rehydrate it into a full object with prototype chain and object
     * methods in place. Clients/sub-classes probably won't need to use it; it's used
     * by {@link jabberwerx.util.loadGraph}.
     *
     * Within any object method, the superclass's version may be invoked via the variable
     * named `_super`.
     *
     * Ex:
     *
     * <p><pre class='code'>
        MyClass = jabberwerx.JWBase.extend({
            init: function() {
                this._super()
            },
            someMethod: function() {
                doSomething();
            }
        }, 'MyClass');

        AnotherClass = MyClass.extend({ ... })
     * </pre></p>
     *
     * @param {Object} prop The "subclass definition", an object with which to extend the parent class.
     * @param {String} className The fully-qualified name of the class.
     */
    //I haven't found a way to avoid passing the fully-qualified name of the classs.
    jabberwerx.JWBase.extend = function(prop, className) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = __jwa__createOverrideChain(_super[name], prop[name]);
        };

        var _superClass = jabberwerx.$.extend({}, this);

        // The dummy class constructor
        function JWBase() {
            if ( !initializing ) {
                // a JW object is "dehydrated" if its data has been unserialized but
                // it does not have the methods or prototype chain of a real object yet.
                // Rehydrating is done by invoking
                //
                //      new ClassName('__jw_rehydrate__', obj);
                //
                // Where obj is the unserialized raw data object. The returned instance
                // will be a shallow copy of the passed object (including its GUID),
                // but with methods and prototype chain in place. Sort of a "copy constructor".
                if (arguments.length == 2 && typeof arguments[0] == 'string' && arguments[0] == '__jw_rehydrate__') {
                    /*DEBUG-BEGIN*/
                    jabberwerx.util.debug.log('rehydrate constructor, ' + arguments[1]._className, 'persistence');
                    /*DEBUG-END*/
                    // make a SHALLOW copy of the passed argument.
                    // it's assumed that the passed object is dehydrated; ie, no methods or
                    // prototype chain.
                    var obj = arguments[1];
                    for (var p in obj) {
                        this[p] = obj[p];
                    }
                }
                else {
                    // regular construction of a new instance
                    this._guid = jabberwerx.util.newObjectGUID(className || "");
                    this._jwobj_ = true;    // cheap way to say "i'm a jw object!"
                    //this._serialized = false;
                    this._className = (typeof className == 'undefined' ? null : className); // REALLY wish there were a better way!
                    this._observerInfo = {};
                    //this._className = arguments.callee.name;
                    // give ourselves private copies of declared arrays and objects
                    for (var p in this) {
                        if (typeof this[p] != 'function' && p != 'fullJid') {
                            this[p] = jabberwerx.util.clone(this[p]);
                        }
                    }
                    //[this._guid] = this;
                    if (this.init) {
                        // All construction is actually done in the init method
                        //jabberwerx.util.debug.log('regular init, argument list is length ' + arguments.length, 'persistence');
                        this.init.apply(this, arguments);
                    }
                }
            }
        };

        // Include class-level methods and properties
        for (var name in _superClass) {
            JWBase[name] = _superClass[name];
        }

        // Populate our constructed prototype object
        JWBase.prototype = prototype;

        // Enforce the constructor to be what we expect
        prototype.constructor = JWBase;

        return JWBase;
    };

    /**
     * @class
     * JWApp's "native" error object. Just a wrapper/namespace so we can extend
     * Error objects pleasantly.
     *
     * @description
     * <p>Creates a new jabberwerx.util.Error with the given message.</p>
     *
     * @param {String} message The error message.
     * @extends Error
     * @minimal
     */
    jabberwerx.util.Error = function(message) {
        this.message = message;
    };
    jabberwerx.util.Error.prototype = new jabberwerx.util.Error();


    /**
     * Create a new Error type.
     *
     * You can define the message and extension at declaration time (ie, defining the error class)
     * and then override it at creation time (ie, at the throw site) if desired.
     *
     * @param {String} message Becomes the base Error object's message.
     * @param {Object} extension Properties in this object are copied into the new error type's prototype.
     * @type Function
     */
    jabberwerx.util.Error.extend = function(message, extension) {
        var f = function(message, extension) {
            this.message = message || this.message;
            for (var p in extension) {
                this[p] = extension[p];
            }
        };

        f.prototype = new this(message);
        for (var p in extension) {
            f.prototype[p] = extension[p];
        }

        return f;
    }

    /**
     * @class
     * <p>Error thrown when an object has, but does not support,
     * a method or operation.</p>
     *
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.util.NotSupportedError = jabberwerx.util.Error.extend("This operation is not supported");


    /**
     * @private
     * Internal cache of invocation objects; two calls to
     * {@link jabberwerx.util.generateInvocation} will return the same function object.
     */
    jabberwerx.util._invocations = {};

    /**
     * Invocations are function objects that do two nifty things.
     *
     * <p><ul>
     * <li>They wrap an (optional) JW object reference and method name, and
     *   an invocation of the bare invocation object reference is secretly
     *   an invocation of the named method on the JW object.</li>
     *
     * <li>We treat invocation objects specially during serialization and
     *   unserialization. They carry their object GUID and method name along with
     *   them into persistence-land, and we rehydrate that info into a real function
     *   when we load the graph.</li>
     * </ul></p>
     *
     * <p>The former nifty thing means you can pass an invocation object as a callback
     * to any service expecting a bare function reference, and, when invoked,
     * the callback will be applied within object scope, rather than global scope.</p>
     *
     * <p>We also cache invocation objects, so you will always get the same function object
     * back from each call to generateInvocation when passing the same object and
     * method name. This is useful for registering an invocation as a handler
     * for some service that registers/unregisters handlers by function reference,
     * (eg, dom or jQuery events) and then unregistering it later.</p>
     *
     * <p>The latter nifty thing means that callback handlers among JW objects will be
     * preserved across graph loading and storing and automatically re-connected when
     * the graph is rehydrated. That's assuming, of course, that the target object
     * was stored in the graph to begin with. Since models are generally stored,
     * callback networks among model objects can be expected to be stored, while
     * callbacks involving other kinds of objects will have to be re-created after
     * unserialization. {@link jabberwerx.JWBase.wasUnserialized} and
     * {@link jabberwerx.JWBase.graphUnserialized} are usually good places to do this.</p>
     *
     * @param {jabberwerx.JWBase} object Any JW object
     * @param {String} methodName The name of the method this invocation represents.
     * @param {Array} [boundArguments] An optional array of arguments to pass to the invocation. These will PRECEED any arguments passed to the invocation at the actual call site.
     * @returns {function} object An "invocation"-type function object.
     */
    jabberwerx.util.generateInvocation = function(object, methodName, boundArguments) {
        var objectTag = '_global_';
        if (jabberwerx.util.isJWObjRef(object)) {
            objectTag = object._guid;
        }
        // we don't support any objects that aren't JW objects or global (window)

        var f = jabberwerx.util._invocations[objectTag + '.' + methodName]
        if (typeof f != 'undefined') {
            return f;
        }
        if (typeof boundArguments != 'undefined') {
            if (typeof boundArguments != 'object' || !(boundArguments instanceof Array)) {
                boundArguments = [boundArguments];
            }
        }
        else {
            boundArguments = [];
        }

        function fn() {
            //return jabberwerx.util.invoke.apply(arguments.callee, [arguments.callee].concat(boundArguments, Array.prototype.slice.call(arguments)));
            return jabberwerx.util.invoke.apply(fn, [fn].concat(boundArguments, Array.prototype.slice.call(arguments)));
        };

        fn.object = object;
        fn.methodName = methodName;
        fn._jwinvocation_ = true;
        jabberwerx.util._invocations[objectTag + '.' + methodName] = fn;
        return fn;
    };


    /**
     * Invoke an invocation function object. Clients shouldn't need to call this.
     *
     * The first argument is the invocation object, remaining arguments are arguments
     * to pass through to the method.
     *
     * @param {Object} invocationObject The invocation object.
     * @param {Anything} [...] Remaining arguments are passed on to the invocation method.
     */
    jabberwerx.util.invoke = function() {
        var invocation = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);
        if (typeof invocation.object == 'undefined' || !invocation.object) {
            // assume a global method
            return window[invocation.methodName].apply(window, args);
        }
        else {
            return invocation.object[invocation.methodName].apply(invocation.object, args);
        }
    };

    /**
     * @private
     * This is an optional saftey measure to try to avoid observer event name
     * collisions. There's no requirement that you register custom event names;
     * just be careful.
     */
    jabberwerx.util.eventNames = [
        'jw_valueChanged',
        'jw_collectionChanged',
    ];
    /**
     * @private
     * Register an observer event name. There's no requirement
     * that you register events; it's like wearing a bike helmet.
     *
     * @param {String} name The name of the observable/event.
     * @throws jabberwerx.util.EventNameAlreadyRegisteredError
     */
    jabberwerx.util.registerEventName = function(name) {
        if (jabberwerx.util.eventNames.indexOf(name) == -1) {
            jabberwerx.util.eventNames.push(name);
        }
        else {
            throw new jabberwerx.util.EventNameAlreadyRegisteredError('JW event name ' + name + ' already registered!');
        }
    };

    /**
     * @private
     */
    jabberwerx.util.EventNameAlreadyRegisteredError = jabberwerx.util.Error.extend('That event name is already registered!');

    /**
     * @private
     */
    jabberwerx.util._objectUIDCounter = 0;

    /**
     * Generate a quasi-guid for object tracking.
     *
     * @param {String} className Class name of object.
     * @returns {String} a new guid
     */
    jabberwerx.util.newObjectGUID = function(className) {
        jabberwerx.util._objectUIDCounter = (jabberwerx.util._objectUIDCounter + 1 == Number.MAX_VALUE) ? 0 : jabberwerx.util._objectUIDCounter + 1;
        return '_jwobj_' + className.replace(/\./g, "_") + '_' + (new Date().valueOf() + jabberwerx.util._objectUIDCounter).toString();
    };


    /**
     * @private
     * Adapted from dojo._escapeString.
     * Adds escape sequences for non-visual characters, double quote and
     * backslash and surrounds with double quotes to form a valid string
     * literal.
     *
     * @param {String} str String to escape
     * @returns {String} escaped string
     */
    jabberwerx.util._escapeString = function(str){
        return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
            replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
            replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
    };

    /**
     * Adapted from dojo.isString
     * <p>Checks if the parameter is a String.</p>
     *
     * @param {Object} it Object to check.
     * @returns {Boolean} <tt>true</tt> if object is a string, false otherwise.
     */
    jabberwerx.util.isString = function(it){
        return !!arguments.length && it != null && (typeof it == "string" || it instanceof String); // Boolean
    };

    /**
     * Adapted from dojo.isArray
     * <p>Checks if the parameter is an Array.</p>
     *
     * @param {Object} it Object to check.
     * @returns {Boolean} <tt>true</tt> if object is an array, false otherwise.
     */
    jabberwerx.util.isArray = function(it){
        return it && (it instanceof Array || typeof it == "array"); // Boolean
    };

    /**
     * @private
     * Dependency from dojo.map.
     *
     * @returns {Array} array of stuff used in dojo.map
     */
    jabberwerx.util._getParts = function(arr, obj, cb){
        return [
            jabberwerx.util.isString(arr) ? arr.split("") : arr,
            obj || window,
            // FIXME: cache the anonymous functions we create here?
            jabberwerx.util.isString(cb) ? new Function("item", "index", "array", cb) : cb
        ];
    };

    /**
     * Adapted from dojo.map
     * <p>Applies callback to each element of arr and returns an Array with
     * the results. This function corresponds to the JavaScript 1.6 Array.map() method.
     * In environments that support JavaScript 1.6, this function is a
     * passthrough to the built-in method.</p>
     * <p>For more details, see:
     * <a href = "http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/map">
     * http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/map
     * </a></P>
     *
     * @param {Array|String} arr The array to iterate on.  If a string, operates on individual characters.
     * @param {Function|String} callback The function is invoked with three arguments: item, index, and array and returns a value
     * @param {Object} [thisObject] May be used to scope the call to callback
     *
     * @returns {Array} passed in array after the callback has been applied to each item
     */
    jabberwerx.util.map = function(arr, callback, thisObject){
        var _p = jabberwerx.util._getParts(arr, thisObject, callback); arr = _p[0];
        var outArr = (arguments[3] ? (new arguments[3]()) : []);
        for(var i=0;i<arr.length;++i){
            outArr.push(_p[2].call(_p[1], arr[i], i, arr));
        }
        return outArr; // Array
    };

    /**
     * Determines if the passed reference is a GUID for a JWBase-derived object.
     * @param {Object} ref Reference to check.
     * @returns {Boolean} <tt>true</tt> if passed reference is a GUID for a JWBase-derived object, otherwise false.
     */
    jabberwerx.util.isJWObjGUID = function(ref) {
        return (typeof ref == 'string' && (ref.indexOf('_jwobj_') == 0 || ref.indexOf('"_jwobj_') == 0));
    }

    /**
     * Determines if the passed reference is a JWBase-derived object.
     * @param {Object} ref Reference to check.
     * @returns {Boolean} <tt>true</tt> if passed reference is a JWBase-derived object, otherwise false.
     */
    jabberwerx.util.isJWObjRef = function(ref) {
        return (ref && typeof ref == 'object' && typeof ref._jwobj_ == 'boolean' && ref._jwobj_);
    }

    /**
     * Determines if the passed reference is one of our invocation objects.
     * @param {Object} ref Reference to check.
     * @returns {Boolean} <tt>true</tt> if passed reference is one of our invocation objects, otherwise false.
     */
    jabberwerx.util.isJWInvocation = function(ref) {
        return (ref && (typeof ref._jwinvocation_ != 'undefined'));
    };

    /**
     * Depth-first recursively clone passed argument. Cyclical references will
     * result in infinite recursion. Will shallow-copy an argument's
     * prototype if it exists, and will shallow-copy functions.
     *
     * @param {arg} The object/array/whatever to clone.
     * @returns {Anything} The new cloned whatever.
    */
    jabberwerx.util.clone = function(arg) {
        if (typeof arg == 'object' && arg != null) {
            if (arg instanceof Array) {
                var copy = [];
                for (var i = 0; i < arg.length; i++) {
                    copy.push(jabberwerx.util.clone(arg[i]));
                }
            }
            if (typeof copy == 'undefined') {
                var copy = {};
            }
            for (var p in arg) {
                copy[p] = jabberwerx.util.clone(arg[p]);
            }
            if (typeof arg.prototype != 'undefined') {
                copy.prototype = arg.prototype;
            }
        }
        else {
            var copy = arg;
        }
        return copy;
    };

    /**
     * Almost, but not quite, like WordPress's sanitize_title_with_dashes.
     * <a href = "http://codex.wordpress.org/Function_Reference/sanitize_title_with_dashes">http://codex.wordpress.org/Function_Reference/sanitize_title_with_dashes</a>
     * <p>The difference with this implementation is that the seperator can be specified as an input parameter.</p>
     *
     * @param {String} string String which to slugify
     * @param {String} separator String value which to replace '-' with in string.
     * @returns {String} string but with all instances of '-' replaced with seperator.
     */
    jabberwerx.util.slugify = function(string, separator) {
        return string.toLowerCase().replace('-', separator).replace(/[^%a-z0-9 _-]/g, '').replace(/\s+/g, (typeof separator != 'undefined' ? separator : '-'));
    };

    //utf8 safe encoding
    /**
     * <p>Encodes a string into an obfuscated form.</p>
     *
     * @param   {String} s The string to encode
     * @returns {String} The obfuscated form of {s}
     */
    jabberwerx.util.encodeSerialization = function(s) {
        if (s) {
            return jabberwerx.util.crypto.b64Encode(jabberwerx.util.crypto.utf8Encode(s));
        }
        return '';
    }

    /**
     * <p>Decodes a string from an obfuscated form.</p>
     *
     * @param   {String} s The string to decode
     * @returns {String} The un-obfuscated form of {s}
     */
    jabberwerx.util.decodeSerialization = function(s) {
        if (s) {
            return jabberwerx.util.crypto.utf8Decode(jabberwerx.util.crypto.b64Decode(s));
        }
        return '';
    }


    /**#nocode+
     * if Array.indexOf is not defined, define it.
     */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(elt /*, from*/) {
            var len = this.length;

            var from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0)
                from += len;

            for (; from < len; from++) {
                if (from in this && this[from] === elt) return from;
            }
            return -1;
        };
    }
    /**#nocode- */

    /**
     * Pass an xml string, get back an xml document. Optionally pass
     * the name of a tag in which to wrap the result.
     *
     * @param {String} s The XML to convert into DOM objects
     * @param {String} [wrap] The name of a tag in which you'd like your xml wrapped.
     * @returns {Document} An XML document.
     */
    jabberwerx.util.unserializeXMLDoc = function(s, wrap) {
        if (!s && !wrap) {return null;}

        if(typeof wrap == 'string') {
            s = '<' + wrap + '>' + s + '</' + wrap + '>';
        }
        var builder = new jabberwerx.NodeBuilder("nbwrapper");
        builder.xml(s);
        var unwrapped = builder.data.childNodes[0];
        builder.data.removeChild(unwrapped);
        builder.document.removeChild(builder.data);
        builder.document.appendChild(unwrapped);
        return builder.document;
    };

    /**
     * Parses the passed XML and returns the document element.
     * <p>Similar to {@link jabberwerx.util.unserializeXMLDoc}</p>
     *
     * @param {String} s The XML to convert into DOM objects
     * @param {String} [wrap] The name of a tag in which you'd like your xml wrapped.
     * @returns {Element} An XML document element.
     */
    jabberwerx.util.unserializeXML = function(s, wrap) {
        var d = jabberwerx.util.unserializeXMLDoc(s, wrap);
        return (d ? d.documentElement : d);
    };
    /**
     * Generates XML for the given Node.
     *
     * @param {XML DOM Node} n XML node
     * @returns {String} XML for given node n. null if n is undefined.
     */
    jabberwerx.util.serializeXML = function(n) {
        try {
            //IE 10+, FF, Chrome and Safari
            if (n.hasOwnProperty("xml")) {
                return n.xml;
            //Windows.Data.Xml.Dom
            } else if (n.getXml) {
                return n.getXml();
            } else {
                return jabberwerx.system.serializeXMLToString(n);
            }
        } catch(e) {
            // Some objects in IE will throw an exception for 'hasOwnProperty'
            // Since it is IE, we'll assume n.xml is there.
            return n.xml || null;
        }
    };

    /**
     * <p>Jabberwerx debug console. Exposes a subset of Firebug methods
     * including log, warn, error, info, debug and dir. Jabberwerx console
     * methods may only be passed one log message (Firebug allows formatted
     * strings and values, ala printf) and a "stream". Streams are message types and allow
     * finer filtering of log messages.</p>
     *
     * <p>For example jabberwerx.util.debug.log("my foo", "bar") will log
     * "my foo" if the stream "bar" is enabled see {@link jabberwerx.util.setDebugStream}.</p>
     *
     * <p>If the built in console (jabberwerx.system.console) does not support a
     * particular method the given message is not logged.</p>
     *
     */
    jabberwerx.util.debug = {
        /** an external console implementing the same logging methods as jabbrwerx.util.debug **/
        consoleDelegate: null,
        /** The built in window console or a global console **/
        console: jabberwerx.system.getConsole() || null
    }

    // jabberwerx.util.debug.log, jabberwerx.util.debug.dir, etc ...
    // second argument is a stream name; will only log when that stream is turned on in jabberwerx.util.debug.streams
    jabberwerx.$.each(['log', 'dir', 'warn', 'error', 'info', 'debug'], function(i, e) {
        jabberwerx.util.debug[e] = function(a, streamName) {
            //no logging if all logging disabled or the given stream is disabled
            if (!jabberwerx._config.debug.on ||
                (jabberwerx.util.isString(streamName) && !jabberwerx._config.debug[streamName])) {
                return;
            }

            if (jabberwerx.util.isString(streamName)) {
                a = '[' + streamName + '] '  + a;
            }

            //built in console may have been destroyed or may not support this method. Don't log.
            try {
                jabberwerx.util.debug.console[e](a);
            } catch (ex) {}

            //console delegates should support the same interface jabberwerx.util.debug implements.
            //throw exception if it does not
            if (jabberwerx.util.debug.consoleDelegate) {
                jabberwerx.util.debug.consoleDelegate[e](a);
            }
        }
    });

    /**
     * Add or overwrite the setting on a debug stream.
     *
     * @param {String} streamName Debug stream name
     * @param {String} value Debug stream value to set.
     */
    jabberwerx.util.setDebugStream = function(streamName, value) {
        jabberwerx._config.debug[streamName] = (typeof value == 'undefined' ? true : value);
    };

    /*DEBUG-BEGIN*/
    jabberwerx.util.debug.on = jabberwerx._config.debug.on;
    for (var streamName in jabberwerx._config.debug.streams) {
        jabberwerx.util.setDebugStream(streamName, jabberwerx._config.debug.streams[streamName]);
    }
    /*DEBUG-END*/
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/jwapp/JWModel.js*/
/**
 * filename:        JWModel.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx) {
    /** @private */
    jabberwerx.JWModel = jabberwerx.JWBase.extend(/** @lends jabberwerx.JWModel.prototype */{
        /**
         * @class
         * <p>Base class for Model objects.</p>
         *
         * @description
         * Creates a new jabberwerx.JWModel object.
         * <p>A jabberwerx.JWModel object assumes it will be persisted in any saved object
         * graphs, and assumes it is a source of events.</p>
         *
         * @see jabberwerx.JWBase#shouldBeSavedWithGraph
         * @constructs jabberwerx.JWModel
         * @extends jabberwerx.JWBase
         * @minimal
         */
        init: function() {  },
        /**
         * Determines if this object should be persisted in object graphs.
         * This method always returns <tt>true</tt>.
         *
         * @return  {Boolean} Always <tt>true</tt>
         */
        shouldBeSavedWithGraph: function() { return true; }
    }, 'JWModel');
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/util/crypt.js*/
/**
 * filename:        crypt.js
 *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS 180-1
 * Version 2.2 Copyright Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 *
 * Modified for jabbwerwerx AJAX
 *      moved functions under the jabberwerx.util.crypto namespace
 *      Eliminated functions not called directly by jwa
 *      made sha1 and md5 heklper functions inner to relevant global funcs
 *      replaced b64 encoding/decoding functions
 *      added jsdocs documentation, keeping private
 */

;(function(jabberwerx) {
    /** @private */
    jabberwerx.util.crypto = {};

    /**
     * @private
     * <p> Encodes the given string into base64.</p>
     *
     * <p><b>NOTE:</b> {input} is assumed to be UTF-8; only the first
     * 8 bits of each {input} element are significant.</p>
     *
     * @param   {String} input The string to convert to base64
     * @returns {String} The converted string
     */
    jabberwerx.util.crypto.b64Encode = function(input) {
        var table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";

        for (var idx = 0; idx < input.length; idx += 3) {
            var data =  input.charCodeAt(idx) << 16 |
                        input.charCodeAt(idx + 1) << 8 |
                        input.charCodeAt(idx + 2);

            //assume the first 12 bits are valid
            output +=   table.charAt((data >>> 18) & 0x003f) +
                        table.charAt((data >>> 12) & 0x003f);
            output +=   ((idx + 1) < input.length) ?
                        table.charAt((data >>> 6) & 0x003f) :
                        "=";
            output +=   ((idx + 2) < input.length) ?
                        table.charAt(data & 0x003f) :
                        "=";
        }

        return output;
    };

    /**
     * @private
     * <p>Decodes the given base64 string.</p>
     *
     * <p><b>NOTE:</b> output is assumed to be UTF-8; only the first
     * 8 bits of each output element are significant.</p>
     *
     * @param   {String} input The base64 encoded string
     * @returns {String} Decoded string
     */
    jabberwerx.util.crypto.b64Decode = function(input) {
        var table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";

        for (var idx = 0; idx < input.length; idx += 4) {
            var h = [
                table.indexOf(input.charAt(idx)),
                table.indexOf(input.charAt(idx + 1)),
                table.indexOf(input.charAt(idx + 2)),
                table.indexOf(input.charAt(idx + 3))
            ];

            var data = (h[0] << 18) | (h[1] << 12) | (h[2] << 6) | h[3];
            if          (input.charAt(idx + 2) == '=') {
                data = String.fromCharCode(
                    (data >>> 16) & 0x00ff
                );
            } else if   (input.charAt(idx + 3) == '=') {
                data = String.fromCharCode(
                    (data >>> 16) & 0x00ff,
                    (data >>> 8) & 0x00ff
                );
            } else {
                data = String.fromCharCode(
                    (data >>> 16) & 0x00ff,
                    (data >>> 8) & 0x00ff,
                    data & 0x00ff
                );
            }
            output += data;
        }

        return output;
    };

    /**
     * @private
     * <p>Encodes the given utf-16 string into utf-8.</p>
     *
     * @param   {String} input The utf-16 string to encode
     * @returns {String} The utf-8 encoding
     */
    jabberwerx.util.crypto.utf8Encode = function (input) {
      var output = "";
      var i = -1;
      var x, y;

      while(++i < input.length) {
        /* Decode utf-16 surrogate pairs */
        x = input.charCodeAt(i);
        y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
        if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
          x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
          i++;
        }

        /* Encode output as utf-8 */
        if(x <= 0x7F)
          output += String.fromCharCode(x);
        else if(x <= 0x7FF)
          output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                        0x80 | ( x         & 0x3F));
        else if(x <= 0xFFFF)
          output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                        0x80 | ((x >>> 6 ) & 0x3F),
                                        0x80 | ( x         & 0x3F));
        else if(x <= 0x1FFFFF)
          output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                        0x80 | ((x >>> 12) & 0x3F),
                                        0x80 | ((x >>> 6 ) & 0x3F),
                                        0x80 | ( x         & 0x3F));
      }
      return output;
    }
    /**
     * @private
     * <p>Decodes the given utf-8 string into utf-16.</p>
     *
     * @param   {String} input The utf-8 string to encode
     * @returns {String} The utf-16 encoding
     * @throws  {Error} If the input contains any invalid UTF-8 characters
     */
    jabberwerx.util.crypto.utf8Decode = function (input) {
        var output = "";

        for (idx = 0; idx < input.length; idx++) {
            // UTF-16 only goes up to 0x10FFFF, so we only need to handle up to four bytes
            var c = [
                input.charCodeAt(idx),
                input.charCodeAt(idx + 1),
                input.charCodeAt(idx + 2),
                input.charCodeAt(idx + 3)
            ];
            var pt;

            if        (0x7f >= c[0]) {
                pt = c[0];
            } else if (0xc2 <= c[0] && 0xdf >= c[0] &&
                       0x80 <= c[1] && 0xbf >= c[1]) {
                pt = ((c[0] & 0x001f) << 6) |
                     (c[1] & 0x003f);
                idx += 1;
            } else if (((0xe0 == c[0] &&
                         0xa0 <= c[1] && 0xbf >= c[1]) ||
                        (0xe1 <= c[0] && 0xec >= c[0] &&
                         0x80 <= c[1] && 0xbf >= c[1]) ||
                        (0xed == c[0] &&
                         0x80 <= c[1] && 0x9f >= c[1]) ||
                        (0xee <= c[0] && 0xef >= c[0] &&
                         0x80 <= c[1] && 0xbf >= c[1])) &&
                       0x80 <= c[2] && 0xbf >= c[2]) {
                pt = ((c[0] & 0x000f) << 12) |
                     ((c[1] & 0x003f) << 6) |
                     (c[2] & 0x003f);
                idx += 2;
            } else if (((0xf0 == c[0] &&
                         0x90 <= c[1] && 0xbf >= c[1]) ||
                        (0xf1 <= c[0] && 0xf3 >= c[0] &&
                         0x80 <= c[1] && 0xbf >= c[1]) ||
                        (0xf4 == c[0] &&
                         0x80 <= c[1] && 0x8f >= c[1]) ||
                        (0xf5 <= c[0] && 0xf7 >= c[0] &&
                         0x80 <= c[1] && 0xbf >= c[1])) &&
                       0x80 <= c[2] && 0xbf >= c[2] &&
                       0x80 <= c[3] && 0xbf >= c[3]) {
                pt = ((c[0] & 0x0007) << 18) |
                     ((c[1] & 0x003f) << 12) |
                     ((c[2] & 0x003f) << 6) |
                     (c[3] & 0x003f);
                idx += 3;
            } else {
                // error out
                throw new Error("invalid UTF-8 at position: " + idx);
            }

            output += String.fromCharCode(pt);
        }

        return output;
    };

    /**
     * @private
     * <p>Convert a raw string to a hex string.</p>
     *
     * @param   {String} input The string to hexify
     * @params {Boolean} [useUpperCase] Use uppercase hex characters
     * @returns {String} The hex representation iof string's bytes
     */
    jabberwerx.util.crypto.str2hex = function(input, useUpperCase) {
        var hex_tab = useUpperCase ? "0123456789ABCDEF" : "0123456789abcdef";
        var output = "";
        var x;
        for(var i = 0; i < input.length; i++) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F)
                   +  hex_tab.charAt( x        & 0x0F);
        }
        return output;
    }

    /**
     * @private
     * <p>Applies sha1 to given strng and encodes as Base64</p>
     *
     * @param   {String} input The utf-8 string to encode
     * @returns {String} The base64 encoded sha1 hash of input
     */
    jabberwerx.util.crypto.b64_sha1 = function(input) {
        return jabberwerx.util.crypto.b64Encode(jabberwerx.util.crypto.str_sha1(input));
    }

    /**
     * @private
     * <p>Applies sha1 to given utf-8 string and encodes as String</p>
     * <p><b>NOTE:</b> {input} is assumed to be UTF-8; only the first
     * 8 bits of each {input} element are significant.
     * Make sure to call utf8Encode as needed before invoking this function.</p>
     * @param   {String} input The utf-8 String to encode
     * @returns {String} The base64 encoded sha1 hash of input
     */
    jabberwerx.util.crypto.str_sha1 = function(input) {
        //Convert a raw string to an array of big-endian words
        //Characters >255 have their high-byte silently ignored.
        var rstr2binb = function (input) {
            var output = Array(input.length >> 2);
            for(var i = 0; i < output.length; i++)
                output[i] = 0;
            for(var i = 0; i < input.length * 8; i += 8)
                output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
            return output;
        }
        //Convert an array of big-endian words to a string
        var binb2rstr = function(input) {
            var output = "";
            for (var i = 0; i < input.length * 32; i += 8) {
                output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
            }
            return output;
        }

        //Add integers, wrapping at 2^32. This uses 16-bit operations internally
        //to work around bugs in some JS interpreters.
        var safe_add = function(x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }

        //Bitwise rotate a 32-bit number to the left.
        var bit_rol = function(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        }

        var sha1_ft = function(t, b, c, d) {
            if (t < 20) return (b & c) | ((~b) & d);
            if (t < 40) return b ^ c ^ d;
            if (t < 60) return (b & c) | (b & d) | (c & d);
            return b ^ c ^ d;
        }

        var sha1_kt = function(t) {
            return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
                    (t < 60) ? -1894007588 : -899497514;
        }

        //Calculate the SHA-1 of an array of big-endian words, and a bit length
        var binb_sha1 = function(x, len) {
            /* append padding */
            x[len >> 5] |= 0x80 << (24 - len % 32);
            x[((len + 64 >> 9) << 4) + 15] = len;

            var w = Array(80);
            var a =  1732584193;
            var b = -271733879;
            var c = -1732584194;
            var d =  271733878;
            var e = -1009589776;

            for (var i = 0; i < x.length; i += 16) {
                var olda = a;
                var oldb = b;
                var oldc = c;
                var oldd = d;
                var olde = e;

                for (var j = 0; j < 80; j++) {
                    if (j < 16) {
                        w[j] = x[i + j];
                    } else {
                        w[j] = bit_rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
                    }
                    var t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                                     safe_add(safe_add(e, w[j]), sha1_kt(j)));
                    e = d;
                    d = c;
                    c = bit_rol(b, 30);
                    b = a;
                    a = t;
                }

                a = safe_add(a, olda);
                b = safe_add(b, oldb);
                c = safe_add(c, oldc);
                d = safe_add(d, oldd);
                e = safe_add(e, olde);
            }
            return Array(a, b, c, d, e);
        }
        return binb2rstr(binb_sha1(rstr2binb(input), input.length * 8));
    }

    /**
     * @private
     * <p>Applies sha1 to given strng and encodes as Base64</p>
     *
     * <p><b>NOTE:</b> {input} is assumed to be UTF-8; only the first
     * 8 bits of each {input} element are significant.
     * Make sure to call utf8Encode as needed before invoking this function.</p>
     * @param   {String} input The utf-8 string to encode
     * @returns {String} The base64 encoded sha1 hash of input
     */
    jabberwerx.util.crypto.hex_md5 = function(input) {
        return jabberwerx.util.crypto.str2hex(jabberwerx.util.crypto.rstr_md5(input));
    }

    /**
     * @private
     * <p>Calculate the MD5 of a raw string/p>
     *
     * <p><b>NOTE:</b> {input} is assumed to be UTF-8; only the first
     * 8 bits of each {input} element are significant.
     * Make sure to call utf8Encode as needed before invoking this function.</p>
     * @param   {String} input The utf-8 string to encode
     * @returns {String} The base64 encoded sha1 hash of input
     */
    jabberwerx.util.crypto.rstr_md5 = function(input) {
        function md5_cmn(q, a, b, x, s, t) {
            return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
        }
        function md5_ff(a, b, c, d, x, s, t) {
            return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }
        function md5_gg(a, b, c, d, x, s, t) {
            return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }
        function md5_hh(a, b, c, d, x, s, t) {
            return md5_cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function md5_ii(a, b, c, d, x, s, t) {
            return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
        }
        //Add integers, wrapping at 2^32. This uses 16-bit operations internally
        //to work around bugs in some JS interpreters.
        var safe_add = function(x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }
        //Bitwise rotate a 32-bit number to the left.
        var bit_rol = function(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        }

        //Convert a raw string to an array of little-endian words
        //Characters >255 have their high-byte silently ignored.
        var rstr2binl = function(input) {
            var output = Array(input.length >> 2);
            for(var i = 0; i < output.length; i++) {
                output[i] = 0;
            }
            for(var i = 0; i < input.length * 8; i += 8) {
                output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
            }
            return output;
        }
        //Convert an array of little-endian words to a string
        var binl2rstr = function(input) {
            var output = "";
            for (var i = 0; i < input.length * 32; i += 8) {
                output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
            }
            return output;
        }
        //Calculate the MD5 of an array of little-endian words, and a bit length.
        var binl_md5 = function(x, len) {
          //append padding
          x[len >> 5] |= 0x80 << ((len) % 32);
          x[(((len + 64) >>> 9) << 4) + 14] = len;

          var a =  1732584193;
          var b = -271733879;
          var c = -1732584194;
          var d =  271733878;

          for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;

            a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
            d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
            d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
            d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
            d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
            d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
            c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
            d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
            c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
            d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
            c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
            d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
            c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
            d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
            d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
            d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
            d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
            d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
            d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
            d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
            d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
          }
          return Array(a, b, c, d);
        }

        return binl2rstr(binl_md5(rstr2binl(input), input.length * 8));
    }
    /**
     * @private
     * <p>Generates a random UUID as per rfc4122</p>
     *
     * @returns {String} A random UUID
     */
     jabberwerx.util.crypto.generateUUID = function() {
        // Based on RFC 4122
        // time_lo:  bytes 0-3   (bits 0-31)
        // time_mid: bytes 4-5   (bits 32-47)
        // time_hi:  bytes 6-7   (bits 48-63)
        // clock_hi: bytes 8     (bits 64-71)
        // clock_lo: bytes 9     (bits 72-79)
        // node:     bytes 10-15 (bits 80-127)

        // start with "random" data
        var parts = [];
        for (var idx = 0; idx < 16; idx++) {
            parts[idx] = Math.floor(Math.random() * 256);
        }

        // set version to 4 (bits 12-15 of clock_hi)
        parts[6] = (parts[6] & 0x0f) | 0x40;

        // set clock_seq_and_reserved bits 6,7 to 0,1
        parts[8] = (parts[8] & 0x3f) | 0x80;

        // Assemble UUID as printed string
        var result = "";
        for (var idx = 0; idx < parts.length; idx++) {
            var val = parts[idx];
            if (idx == 4 || idx == 6 || idx == 8 || idx == 10) {
                // separators after time_lo, time_mid, time_hi, clock_lo
                result += "-";
            }

            result += ((val >>> 4) & 0x0f).toString(16);
            result += (val & 0x0f).toString(16);
        }

        return result;
    }
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Translator.js*/
/**
 * filename:        Translator.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.Translator = jabberwerx.JWBase.extend( /** @lends jabberwerx.Translator.prototype */{
        /**
         * @class
         * <p>Performs localization of strings.</p>
         *
         * @description
         * <p>Creates a new Translator.</p>
         *
         * <p><b>NOTE:</b> This class should not be created directly. Instead,
         * use the global localizing method @{link jabberwerx._}.</p>
         *
         * @constructs jabberwerx.Translator
         * @extends jabberwerx.JWBase
         * @minimal
         */
        init: function() {
            this._super();
        },

        /**
         * <p>Localizes and formats the given input string.</p>
         *
         * <p>This method attempts to find a localized version of {istr} in
         * a table. If one is found, that localized form is used for the rest
         * of this; otherwise {istr} is used as-is. Then the string is searched
         * for substitutions, and the results are returned.</p>
         *
         * <p>Substitutions take the form "{&lt;number&gt;}", where &lt;number&gt;
         * is the index of the arugment passed into this method. For example:</p>
         *
         * <pre class='code'>
         *  var l10n = new jabberwerx.Translator()'
         *  var result = l10n.format("Connected to {0} as {1}",
         *                           client.connectedServer.jid,
         *                           client.connectedUser.jid);
         * </pre>
         *
         * <p>Returns a string where "{0}" is replaced with the string value of
         * "client.connectedServer.jid" and "{1}" is replaced with the string
         * of "client.connectedUser.jid". If a matching argument is not found,
         * the original pattern is returned (e.g. "{0}").</p>
         *
         * @param   {String} istr The input string
         * @returns {String} The formatted/localized string
         */
        format: function(istr /** params **/) {
            var ostr = this._updates[istr] || this._mappings[istr];
            if (!ostr) {
                ostr = istr;
            }

            var ptn = /\{([0-9]+)\}/g;
            var args = jabberwerx.$.makeArray(arguments).slice(1);
            var substFn = function(match, idx) {
                idx = parseInt(idx);
                if (isNaN(idx)) {
                    return match;
                }

                var found = args[idx];
                if (found === null || found === undefined) {
                    return match;
                }

                return found;
            };
            var ostr = ostr.replace(ptn, substFn);

            return ostr;
        },
        /**
         * <p>Loads a translation table for the given locale.</p>
         *
         * <p>The translation table is expected to be a JSON-formatted
         * map of keys to values</p>:
         *
         * <pre class='code'>
         *  {
         *      "first key" : "The First Key",
         *      "service {0} unavailable" : "The service {0} is not available at this time.  Please try again later"
         *  }
         * </pre>
         *
         * <p>Translation are declared via &lt;link/&gt; elements within the
         * HTML page, with the type 'text/javascript' and the rel 'translation',
         * and optionally an xml:lang to declare the locale it represents. For
         * example, a tranlsation table for American English (en-US) would be
         * declared in the HTML as follows:</p>
         *
         * <pre class='code'>
         *  &lt; link rel='translation' type='text/javascript' xml:lang='en-US' href='path/to/tranlsation.js'/&gt;
         * </pre>
         *
         * <p>The lookup attempts to find the best match for {locale} using
         * the following algorithm:</p>
         *
         * <ol>
         * <li>The specific value for {locale}, if specified (e.g. en-US)</li>
         * <li>The language-only value for {locale}, if specified (e.g. en)</li>
         * <li>A default (no xml:lang declared on &lt;link/&gt;)</li>
         * </ol>
         *
         * @param   {String} [locale] The locale to load, or "" to
         *          use the platform default.
         * @throws  {Error} If a translation table for {locale}
         *          cannot be found or loaded
         */
        load: function(locale) {
            if (!locale) {
                // make best attempt at determining the user's locale
                locale = jabberwerx.system.getLocale();
            }
            if (this.locale == locale) {
                // already loaded this translation, return
                return;
            }

            // Function to create a function that filters
            var filterFN = function(l) {
                return function() {
                    var lang = (jabberwerx.$(this).attr("xml:lang") || "").toLowerCase();
                    return (lang == l) ? this : null;
                };
            };

            // Find matches, grouped by specificity
            var localeFull = locale.toLowerCase();
            var localePart = locale.split("-")[0].toLowerCase();
            var tmpLinks = jabberwerx.$("link[rel='translation'][type='text/javascript']");
            var links = jabberwerx.$();
            links = jabberwerx.$.merge(links, tmpLinks.map(filterFN("")));
            links = jabberwerx.$.merge(links, tmpLinks.map(filterFN(localePart)));
            links = jabberwerx.$.merge(links, tmpLinks.map(filterFN(localeFull)));

            if (!links.length) {
                throw new TypeError("no translation links found");
            }

            var mappings = {};
            var processed = 0;
            links.each(function() {
                var url = jabberwerx.$(this).attr("href");
                if (!url) {
                    // TODO: loggit
                    return;
                }
                var data = null;
                var completeFn = function(xhr, status) {
                    if (status != "success") { return; }
                    data = xhr.responseText;
                };
                var setup = {
                    async: false,
                    cache: true,
                    complete: completeFn,
                    dataType: "text",
                    processData: false,
                    timeout: 1000,
                    url: url
                };
                jabberwerx.$.ajax(setup);
                if (!data) {
                    jabberwerx.util.debug.log("no translation data returned from " + url);
                }
                try {
                    data = eval("(" + data + ")");
                } catch (ex) {
                    jabberwerx.util.debug.log("could not parse translation data from " + url);
                }
                mappings = jabberwerx.$.extend(mappings, data);
                processed++;
            });

            if (!processed) {
                throw new TypeError("no valid translations found");
            }
            this._mappings = mappings;
            this.locale = locale;
        },

        /**
         * <p>Adds or updates the translation for the given key.</p>
         *
         * @param   {String} key The key to translate on
         * @param   {String} value The new replacement translation
         * @throws  {TypeError} If {key} or {value} are not valid Strings
         */
        addTranslation: function(key, value) {
            if (!(key && typeof(key) == "string")) {
                throw new TypeError();
            }
            if (!(value && typeof(value) == "string")) {
                throw new TypeError();
            }
            this._updates[key] = value;
        },
        /**
         * <p>Removes the translation for the given key.</p>
         *
         * @param   {String} key The key to translate on
         * @throws  {TypeError} If {key} or is not a valid String
         */
        removeTranslation: function(key) {
            if (!(key && typeof(key) == "string")) {
                throw new TypeError();
            }
            delete this._updates[key];
        },

        /**
         * The current locale for this jabberwerx.Translator
         *
         * @type String
         * @see jabberwerx.Translator#format
         */
        locale: undefined,

        /**
         * @private
         */
        _mappings: {},
        /**
         * @private
         */
        _updates: {}
    }, "jabberwerx.Translator");

    /**
     * <p>The global translator instance. Use this instead of
     * creating new instances of Translator.</p>
     *
     * @type jabberwerx.Translator
     */
    jabberwerx.l10n = new jabberwerx.Translator();

    /**
     * @function
     * @description
     * <p>Localizes and formats the given input string. This method performs
     * the same operations as {@link jabberwerx.Translator#format}, but as a
     * singleton method.</p>
     *
     * @param   {String} istr The input string
     * @returns {String} The formatted/localized string
     */
    jabberwerx._ = (function(l10n) {
        var fn;
        /** @private */
        fn = function() {
            return l10n.format.apply(l10n, arguments);
        };
        fn.instance = l10n;

        return fn;
    })(jabberwerx.l10n);

    try {
        jabberwerx.l10n.load(jabberwerx.system.getLocale());
        // DEBUG-BEGIN
        jabberwerx.util.debug.log("Loaded translation for " + jabberwerx.system.getLocale());
        // DEBUG-END
    } catch (e) {
        // log the failure to load a default
        jabberwerx.util.debug.log("Could not find a translation for " + jabberwerx.system.getLocale());
    }
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Rendezvous.js*/
/**
 * filename:        Rendezvous.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){

    /**
     * @class
     * <p>A mixin for participating in a {@link jabberwerx.Rendezvous}.</p>
     *
     * @see jabberwerx.JWBase.mixin
     */
    jabberwerx.Rendezvousable = {
        /**
         * <p>Starts this controller's rendezvous processing. This method
         * remembers the context Rendezvous object, then returns false</p>
         *
         * Mixins SHOULD override this method to perform the actual startup
         * logic, and MUST call "this._super(ctx)" or the behavior is
         * undefined.</p>
         *
         * @param {jabberwerx.Rendezvous} ctx The rendezvous context
         * @return {Boolean} <tt>true</tt> if this controller's rendezvous
         *                   work is in progress
         */
        startRendezvous: function(ctx) {
            this._rendezvousCtx = ctx;

            return false;
        },
        /**
         * <p>Ends this controller's rendezvous processing. This method
         * calls {@link jabberwerx.Rendezvous.finish} on the set context
         * (if any), then removes the context.</p>
         *
         * <p>Mixins MAY override this method to perform known completion
         * logic, but MUST call "this._super()" or the behavior is
         * undefined.</p>
         */
        finishRendezvous: function() {
            this._rendezvousCtx && this._rendezvousCtx.finish(this);
            delete this._rendezvousCtx;
        },

        /**
         * The current rendezvous context object.
         * @type jabberwerx.Rendezvous
         */
        rendezvousContext: null
    };

    jabberwerx.Rendezvous = jabberwerx.JWModel.extend(/** @lends jabberwerx.Rendezvous.prototype */{
        /**
         * @class
         * <p>Type for directing a Rendezvous pattern. The rendezvous
         * pattern allows for execution to continue once a number of
         * {@link jabberwerx.Rendezvousable} objects have finished.</p>
         *
         * <p>This is most notably used in {@link jabberwerx.Client} to
         * delay the "clientStatusChanged" event for connected until a
         * number of controllers have finished their startup logic.</p>
         *
         * @description
         *
         * <p>Creates a new rendezvous with the given finished
         * callback.</p>
         *
         * <p>The {cb} function is expected to implement the following
         * signature:</p>
         * <div><pre class='code'>
         *  cb = function(ctx) {
         *      ctx;        // This Rendezvous object
         *  }
         * </pre></div>
         *
         * @param cb {Function} The callback to execute when finished.
         * @throws TypeError If {cb} is not a Function
         * @constructs  jabberwerx.Rendezvous
         * @extends     jabberwerx.JWModel
         * @minimal
         */
        init: function(cb) {
            this._super();

            if (!(cb && jabberwerx.$.isFunction(cb))) {
                throw new TypeError("cb must be a function");
            }

            this._callback = cb;
        },

        /**
         * <p>Starts the rendezvous for a specific rendezvousable. This method
         * calls {@link jabberwerx.Rendezvousable.startRendezvous} on
         * {rnz}, and adds it to the pending list it is starting (returns
         * <tt>true</tt>}.</p>
         *
         * <p><b>NOTE:</b> Mixins cannot be categorically verified as
         * instances (e.g. there is no "instanceof" check on an object for a
         * mixin).  Instead, this method checks that {rnz} implements
         * {@link jabberwerx.Rendezvousable.startRendezvous} and that the
         * method returns <tt>true</tt>.</p>
         *
         * @param rnz {jabberwerx.Rendezvousable} The rendezvousable to start
         * @returns {Boolean} <tt>true</tt> if {rnz} is started.
         */
        start: function(rnz) {
            this._ready = true;
            if (jabberwerx.$.inArray(rnz, this._rendezvousers) != -1) {
                return true;
            }

            if (rnz.startRendezvous && rnz.startRendezvous(this)) {
                this._rendezvousers.push(rnz);
                return true;
            }

            return false;
        },
        /**
         * <p>Finishes the rendezvous for a specific rendezvousable. This
         * method removes calls
         * {@link jabberwerx.Rendezvousable.startRendezvous} on {rnz}, and
         * adds it to the pending list it is starting (returns
         * <tt>true</tt>}. If there are no pending compoents remaining, the
         * registered callback is executed.</p>
         *
         * @param rnz {jabberwerx.Rendezvousable} The rendezvousable to
         *        finish
         * @returns {Boolean} <tt>true</tt> if {rnz} is finished.
         */
        finish: function(rnz) {
            var pos = rnz ?
                      jabberwerx.$.inArray(rnz, this._rendezvousers) :
                      -1;
            if (pos != -1) {
                this._rendezvousers.splice(pos, 1);
            }

            if (this._ready && !this._rendezvousers.length) {
                this._callback(this);
                this._ready = false;
            }

            return (pos != -1);
        },

        /**
         * Determines if this rendezvous has any pending rendezvousables.
         */
        isRunning: function() {
            return this._ready && (this._rendezvousers.length > 0);
        },

        /**
         * @private
         */
        _ready: false,
        /**
         * @private
         */
        _rendezvousers: []
    }, "jabberwerx.Rendezvous");
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/SASL.js*/
/**
 * filename:        SASL.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.SASLMechanism = jabberwerx.JWBase.extend(/** @lends jabberwerx.SASLMechanism.prototype */{
        /**
         * @class
         * <p>Base class for SASL support.</p>
         *
         * <p><b>NOTE:</b> When defining new SASL mechanisms, the call to
         * {@link #.extend} MUST include the mechanism name:</p>
         *
         * <pre class='code'>var namespace.SASLSomeClient = jabberwerx.SASLMechanism.extend(
         *      { ... },
         *      "namespace.SASLSomeClient",
         *      "SOME-MECH");
         * </pre>
         *
         * <p>The mechanism name then becomes a property of the class and its
         * instances.</p>
         *
         * @description
         * <p>Creates a new SASLMechanism with the given client. The name of
         * this SASLMechanism is established by its type definition via
         * {@link #.extend}.</p>
         *
         * <p>If {encoded} is <tt>true</tt>, then {@link #evaluateStart} and
         * {@link #evaluateChallenge} are expected to perform the base64
         * encoding and decoding; {@link #evaluate} will not automatically
         * perform this step.</p>
         *
         * @param       {jabberwerx.Client} client The client
         * @param       {Boolean} [encoded] <tt>true</tt> if the mechanism's
         *              {@link #evaluateStart} and {@link #evaluateChallenge}
         *              return data that is already base-64 encoded (default is
         *              <tt>false</tt>)
         * @throws      TypeError If {client} is not a jabberwerx.Client
         * @constructs  jabberwerx.SASLMechanism
         * @abstract
         * @extends     jabberwerx.JWBase
         * @minimal
         */
        init: function(client, encoded) {
            this._super();

            this.mechanismName = this.constructor.mechanismName;
            this._encoded = Boolean(encoded);

            if (!(client && client instanceof jabberwerx.Client)) {
                throw new TypeError("client must be a jabberwerx.Client");
            }

            this.client = client;
        },

        /**
         * <p>Evaluates a step in the SASL negotation. This method
         * processes the SASL "challenge", "failure" and "success" stanzas, and
         * returns "auth" and "response" stanzas.</p>
         *
         * <p>If called with no arguments, this method performs the initial
         * step:
         * <ol>
         * <li>{@link #evaluateStart} is called</li>
         * <li>The &lt;auth mechanism="{@link #mechanismName}"/&gt; is generated
         * and returned, including any initial data as base64-encoded text
         * content.</li>
         * </ol>
         * </p>
         *
         * <p>If called with a &lt;challenge/&gt; element, it performs the
         * subsequent steps:
         * <ol>
         * <li>The challenge data (if any) is decoded from base64</li>
         * <li>{@link #evaluateChallenge} is called, and the response
         * data noted</li>
         * <li>The &lt;response/&gt; stanza is generated and returned,
         * including any response data as base64-encoded text content</li>
         * </ol>
         * </p>
         *
         * <p>If called with a &lt;success/&gt; element, it performs the
         * finalization step:
         * <ol>
         * <li>The success data (if any) is decoded from base64</li>
         * <li>If there is success data, {@link #evaluateChallenge} is
         * called</li>
         * <li>{@link #complete} is checked to see that it is now equal
         * to <tt>true</tt></li>
         * </ol>
         * </p>
         *
         * <p>If called with a &lt;failure/&gt; element, it performs
         * error handling:
         * <ol>
         * <li>The condition from the failure is analyzed</li>
         * <li>A {@link jabberwrex.SASLMechanism.SASLAuthFailure} error is
         * thrown.</li>
         * </ol>
         * </p>
         *
         * @param   {Element} [input] The challenge to evaluate, or
         *          <tt>undefined</tt> for the initial step.
         * @returns {Element} The response, or <tt>null</tt> if no further
         *          responses are necessary.
         * @throws  {TypeError} If {input} is not an Element
         * @throws  {jabberwerx.SASLMechanism.SASLAuthFailure} If a problem
         *          is encountered
         */
        evaluate: function(input) {
            if (input && !jabberwerx.isElement(input)) {
                throw new TypeError("input must be undefined or an element");
            }

            var output = null;
            var failure = null;
            var data;
            if (!input) {
                if (this.started) {
                    jabberwerx.util.debug.log("SASL mechanism already started!");
                    throw this._handleFailure();
                }

                this.started = true;
                try {
                    data = this.evaluateStart();
                    data = this._encodeData(data);

                    output = new jabberwerx.NodeBuilder("{urn:ietf:params:xml:ns:xmpp-sasl}auth").
                            attribute("mechanism", this.mechanismName).
                            text(data).
                            data;
                } catch (ex) {
                    jabberwerx.util.debug.log("SASL failed to initialize: " + ex);
                    throw this._handleFailure(ex);
                }
            } else {
                if (!this.started) {
                    jabberwerx.util.debug.log("SASL mechanism not yet started!");
                    throw this._handleFailure();
                }

                switch (input.nodeName) {
                    case "success":
                        try {
                            if (!this.complete) {
                                data = jabberwerx.$(input).text();
                                data = this._decodeData(data);
                                data = this.evaluateChallenge(data);
                            }
                        } catch (ex) {
                            jabberwerx.util.debug.log("SASL failed to evaluate success data: " + ex);
                            throw this._handleFailure(ex);
                        }

                        if (data || !this.complete) {
                            jabberwerx.util.debug.log("SASL failed to complete upon <success/>");
                            throw this._handleFailure();
                        }

                        break;
                    case "failure":
                        // some specific problem
                        {
                            var failure = this._handleFailure(jabberwerx.$(input).children().get(0));
                            jabberwerx.util.debug.log("SASL failure from server: " + failure.message);
                            throw failure;
                        }
                        break;
                    case "challenge":
                        if (this.complete) {
                            jabberwerx.util.debug.log("SASL received challenge after completion!");
                            throw this._handleFailure();
                        }
                        try {
                            data = jabberwerx.$(input).text();
                            data = this._decodeData(data);
                            data = this.evaluateChallenge(data);
                            data = this._encodeData(data);

                            output = new jabberwerx.NodeBuilder(
                                            "{urn:ietf:params:xml:ns:xmpp-sasl}response").
                                    text(data).
                                    data;
                        } catch (ex) {
                            jabberwerx.util.debug.log("SASL failed to evaluate challenge data: " + ex);
                            throw this._handleFailure(ex);
                        }
                        break;
                    default:
                        // some random problem!
                        jabberwerx.util.debug.log("unexpected stanza received!");
                        throw this._handleFailure();
                        break;
                }
            }

            return output;
        },
        /**
         * @private
         */
        _decodeData: function(data) {
            if (!data) {
                return "";
            }
            if (!this._encoded) {
                return jabberwerx.util.crypto.utf8Decode(jabberwerx.util.crypto.b64Decode(data));
            }
            return data;
        },
        /**
         * @private
         */
        _encodeData: function(data) {
            if (!data) {
                return "";
            }
            if (!this._encoded) {
                return jabberwerx.util.crypto.b64Encode(jabberwerx.util.crypto.utf8Encode(data));
            }

            return data;
        },

        /**
         * <p>Called by {@link #evaluate} to start use of this SASLMechanism.
         * Subclasses MUST override this method to perform the initial
         * step.</p>
         *
         * <p>This implementation always throws an Error.</p>
         *
         * @returns The initial data to send, or <tt>null</tt> to send
         *          an empty &lt;auth/&gt;
         */
        evaluateStart: function() {
            throw new Error("not implemented!");
        },
        /**
         * <p>Called by {@link #evaluate} to process challenge data into a
         * response. Subclasses MUST override this method to perform
         * the steps of SASL negotation appropriate to the mechanism. If
         * this step completes the negotation (even if part of a
         * &lt;challenge/&gt; instead of a &lt;success/&gt;), this method MUST
         * set the {@link #complete} flag to <tt>true</tt>.</p>
         *
         * <p>The input is the text content of the &lt;challenge/&gt; or
         * &lt;success/&gt;, decoded from base64.</p>
         *
         * <p>This implementation always throws an Error.</p>
         *
         * @param   {String} inb The input data ("" if there is no challenge
         *          data)
         * @returns {String} The output data, or <tt>null</tt> if no response
         *          data is available
         * @throws  {jabberwerx.SASLMechanism.SASLAuthFailure} If there is a
         *          problem evaluating the challenge.
         */
        evaluateChallenge: function(inb) {
            throw new Error("not implemented!");
        },
        /**
         * @private
         */
        _handleFailure: function(cond) {
            this.complete = true;
            if (cond instanceof jabberwerx.SASLMechanism.SASLAuthFailure) {
                return cond;
            } else if (jabberwerx.isElement(cond)) {
                var msg = "{urn:ietf:params:xml:ns:xmpp-sasl}" + cond.nodeName;

                return new jabberwerx.SASLMechanism.SASLAuthFailure(msg);
            } else {
                return new jabberwerx.SASLMechanism.SASLAuthFailure();
            }
        },

        /**
         * <p>Retrieves the connection/authentication properties from the
         * client.</p>
         *
         * @returns  {Object} The properties object from {@link #client}
         */
        getProperties: function() {
            return (this.client && this.client._connectParams) || {};
        },

        /**
         * The client to operate against
         * @type    jabberwerx.Client
         */
        client: null,
        /**
         * The mechanism name. This is automatically set by the init method
         * for jabberwerx.SASLMechanism, based on the mechanism name given when
         * the type is defined.
         * @type    String
         */
        mechanismName: "",
        /**
         * Flag to check to check if this SASLMechanism has completed the
         * authentication negotation (successful or not).
         * @type    Boolean
         */
        complete: false,
        /**
         * Flag to indicate the mechanism has been started.
         * @type    Boolean
         */
        started: false
    }, "jabberwerx.SASLMechanism");
    jabberwerx.SASLMechanism.SASLAuthFailure = jabberwerx.util.Error.extend("{urn:ietf:params:xml:ns:xmpp-sasl}temporary-auth-failure");

    /**
     * @private
     */
    jabberwerx.SASLMechanism._baseExtend = jabberwerx.SASLMechanism.extend;
    /**
     * <p>Defines a new subclass of jabberwerx.SASLMechanism. This method
     * overrides {@link JWBase.extend} to also include the name of the
     * SASL mechanism. This method will also register the new mechanism
     * with the global SASLMechanismFactory {@link jabberwerx.sasl}.</p>
     *
     * @param   {Object} props The properties and methods for the subclass
     * @param   {String} type The fully-qualified name of the subclass
     * @param   {String} mechname The SASL mechanism name this subclass
     *          supports
     * @returns {Class} The subclass of jabberwerx.SASLMechanism
     * @throws  {TypeError} If {mechname} is not a non-empty string
     */
    jabberwerx.SASLMechanism.extend = function(props, type, mechname) {
        if (!(mechname && typeof(mechname) == "string")) {
            throw new TypeError("name must be a non-empty string");
        }

        var subtype = jabberwerx.SASLMechanism._baseExtend(props, type);
        subtype.mechanismName = mechname.toUpperCase();
        if (    jabberwerx.sasl &&
                jabberwerx.sasl instanceof jabberwerx.SASLMechanismFactory) {
            jabberwerx.sasl.addMechanism(subtype);
        }

        return subtype;
    };

    jabberwerx.SASLMechanismFactory = jabberwerx.JWBase.extend(/** @lends jabberwerx.SASLMechanismFactory.prototype */{
        /**
         * @class
         * <p>Factory class for managing and creating SASLMechanisms.</p>
         *
         * @description
         * <p>Creates a new SASLMechanismFactory.</p>
         *
         * @param       {String[]} [mechs] The list of enabled mechanisms
         * @constructs  jabberwerx.SASLMechanismFactory
         * @extends     jabberwerx.JWBase
         * @minimal
         */
        init: function(mechs) {
            this._super();

            if   (!mechs) {
                if (jabberwerx._config.enabledMechanisms) {
                    mechs = jabberwerx._config.enabledMechanisms;
                } else {
                    mechs = [];
                }
            }

            this.mechanisms = mechs.concat();
        },

        /**
         * <p>Creates a SASLMechanism appropriate for the given list of
         * possible mechanisms.</p>
         *
         * @param   {jabberwerx.Client} client The client to work against
         * @param   {String[]} mechs The list of possible mechanisms to use
         * @returns {jabberwerx.SASLMechanism} The SASLMechanism object to use, or
         *          <tt>null</tt> if an appropriate mechanism could not be
         *          found
         * @throws  {TypeError} If {client} is not valid; or if {mechs} is not
         *          an array
         */
        createMechanismFor: function(client, mechs) {
            if (!jabberwerx.$.isArray(mechs)) {
                throw new TypeError("mechs must be an array of mechanism names");
            }
            if (!(client && client instanceof jabberwerx.Client)) {
                throw new TypeError("client must be an isntance of jabberwerx.Client");
            }

            // normalize mechanism names (all upper case)
            mechs = mechs.concat();
            for (var idx = 0; idx < mechs.length; idx++) {
                mechs[idx] = String(mechs[idx]).toUpperCase();
            }

            // find the mech!
            var selected = null;
            for (var idx = 0; !selected && idx < this.mechanisms.length; idx++) {
                var candidate = this._mechsAvail[this.mechanisms[idx]];
                if (!candidate) {
                    // enabled mech doesn't have an available mech
                    continue;
                }

                for (var jdx = 0; !selected && jdx < mechs.length; jdx++) {
                    if (mechs[jdx] != candidate.mechanismName) {
                        continue;
                    }

                    // we have an available, enabled, AND supported mechanism!
                    try {
                        selected = new candidate(client);
                    } catch (ex) {
                        jabberwerx.util.debug.log("could not create SASLMechanism for " +
                                candidate.mechanismName + ": "+ ex);
                        // make sure we don't have a SASLMechanism
                        selected = null;
                    }
                }
            }
            return selected;
        },

        /**
         * <p>Adds the given mechanism to the map of available mechanisms.</p>
         *
         * @param   {Class} type The SASLMechanism to add
         * @throws  {TypeError} if {type} is not the class for a SASLMechanism
         */
        addMechanism: function(type) {
            if (!(jabberwerx.$.isFunction(type) && type.mechanismName)) {
                throw new TypeError("type must be the constructor for a SASLMechanism type");
            }

            this._mechsAvail[type.mechanismName] = type;
        },
        /**
         * <p>Removes the given mechanism from the map of available
         * mechanisms.</p>
         *
         * @param   {Class} type The SASLMechanism to remove
         * @throws  {TypeError} if {type} is not the class for a SASLMechanism
         */
        removeMechanism: function(type) {
            if (!(jabberwerx.$.isFunction(type) && type.mechanismName)) {
                throw new TypeError("type must be the constructor for a SASLMechanism type");
            }

            this._mechsAvail[type.mechanismName] = undefined;
            delete this._mechsAvail[type.mechanismName];
        },

        /**
         * @private
         * The map of mechanism to SASLMechanism types.
         */
        _mechsAvail: {},
        /**
         * <p>The list of SASL client mechanisms supported. Each element in
         * the array is expected to be the string name of the mechanism.</p>
         *
         * <p>The order of mechanisms in this array is significant. This factory
         * will create an instance of first SASLMechanism that matches, based on the
         * intersection of server-supplied and client-enabled mechanisms.</p>
         *
         * @type    String[]
         */
        mechanisms: []
    }, "jabberwerx.SASLMechanismFactory");

    if (!(jabberwerx.sasl && jabberwerx.sasl instanceof jabberwerx.SASLMechanismFactory)) {
        /**
         * The global SASL factory.
         *
         * @memberOf    jabberwerx
         * @see         jabberwerx.SASLMechanismFactory#mechanisms
         * @see         jabberwerx.SASLMechanismFactory#createMechanismFor
         * @see         jabberwerx.SASLMechanismFactory#addMechanism
         * @see         jabberwerx.SASLMechanismFactory#removeMechanism
         * @type        jabberwerx.SASLMechanismFactory
         */
        jabberwerx.sasl = new jabberwerx.SASLMechanismFactory(jabberwerx._config.enabledMechanisms);
    }
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/SASLMechs.js*/
/**
 * filename:        SASLMechs.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx){
    /** @private */
    jabberwerx.SASLPlainMechanism = jabberwerx.SASLMechanism.extend(
    /** @lends jabberwerx.SASLPlainMechanism.prototype */ {
        /**
         * @class
         * <p>Implements the PLAIN SASL mechanism.</p>
         *
         * @description
         * Creates a new SASLPlainMechanism with the given client.
         *
         * @param   {jabberwerx.Client} client The client
         * @throws  {TypeError} If {client} is not valid
         * @constructs  jabberwerx.SASLPlainMechanism
         * @extends     jabberwerx.SASLMechanism
         * @minimal
         */
        init: function(client) {
            this._super(client);
        },

        /**
         * Called by {@link jabberwerx.SASLMechanism#evaluate} to generate initial data. This method
         * creates the string "\\u0000username\\u0000password", using
         * the connection parameters specified in {@link jabberwerx.SASLMechanism#client}.</p>
         *
         * <p><b>NOTE:</b> If the BOSH connection is not made over a
         * secure connection, or if the jabberwerx_config.unsecureAllowed
         * flag is <tt>false</tt>, this method throws a SASLAuthFailure
         * ("{urn:ietf:params:xml:ns:xmpp-sasl}mechanism-too-weak").</p>
         *
         * @returns {String} The credential data
         * @throws  {jabberwerx.SASLMechanism.SASLAuthFailure} If PLAIN is not
         *          supported by current configuration
         */
        evaluateStart: function() {
            // TODO: Look for something better!
            var params = this.getProperties();
            if (!this.client.isSecure()) {
                throw new jabberwerx.SASLMechanism.SASLAuthFailure("{urn:ietf:params:xml:ns:xmpp-sasl}mechanism-too-weak");
            }
            var nilChar = String.fromCharCode(0);
            var usr = (params && params.jid && params.jid.getNode()) || "";
            var pwd = (params && params.password) || "";
            return nilChar + usr + nilChar + pwd;
        },
        /**
         * <p>Called by {@link jabberwerx.SASLMechanism#evaluate} to process a challenge. This
         * implementation throws a SASLAuthFailure if {inb} is a non-empty
         * string, or if this mechanism is already complete.
         *
         * @throws  {jabberwerx.SASLMechanism.SASLAuthFailure} If the
         *          challenge is invalid (non-empty)
         */
        evaluateChallenge: function(inb) {
            if (inb || this.complete) {
                throw new jabberwerx.SASLMechanism.SASLAuthFailure();
            }
            this.complete = true;
        }
    }, "jabberwerx.SASLPlainMechanism", "PLAIN");

    jabberwerx.SASLDigestMd5Mechanism = jabberwerx.SASLMechanism.extend(
    /** @lends jabberwerx.SASLDigestMd5Mechanism.prototype */ {
        /**
         * @class
         * <p>Implements the DIGEST-MD5 SASL mechanism.</p>
         *
         * @description
         * Creates a new SASLDigestMd5Mechanism with the given client.
         *
         * @param   {jabberwerx.Client} client The client
         * @throws  {TypeError} If {client} is not valid
         * @constructs  jabberwerx.SASLDigestMd5Mechanism
         * @extends     jabberwerx.SASLMechanism
         * @minimal
         */
        init: function(client) {
            this._super(client);
        },

        /**
         * Called by {@link jabberwerx.SASLMechanism#evaluate} to generate initial data. This method
         * sets up the staging methods for subsequenct steps.</p>
         *
         * @returns {String} <tt>null</tt>
         */
        evaluateStart: function() {
            this._stage = this._generateResponse;

            return null;
        },
        /**
         * <p>Called by {@link jabberwerx.SASLMechanism#evaluate} to process a challenge. This
         * implementation follows RFC 2831's flow, which is two steps:</p>
         *
         * <ol>
         *  <li>DIGEST: Performs the actual digest calculations</li>
         *  <li>VERIFY: Verifies the auth response from the server</li>
         * </ol>
         *
         * @param   {String} inb The challenge data, decoded from Base64
         * @returns {String} The response data
         */
        evaluateChallenge: function(inb) {
            var inprops, outprops;

            if (this.complete && !this._stage) {
                return;
            }

            if (!this._stage) {
                jabberwerx.util.debug.log("DIGEST-MD5 in bad stage");
                throw new jabberwerx.SASLMechanism.SASLAuthFailure();
            }
            inprops = this._decodeProperties(inb);
            outprops = this._stage(inprops);

            return this._encodeProperties(outprops);
        },
        /**
         * @private
         */
        _generateResponse: function(inprops) {
            var params = this.getProperties();
            var user, pass, domain;
            user = (params.jid && params.jid.getNode()) || "";
            domain = (params.jid && params.jid.getDomain()) || "";
            pass = params.password || "";

            var realm = inprops.realm || domain;
            var nonce = inprops.nonce;
            var nc = inprops.nc || "00000001";
            var cnonce = this._cnonce((user + "@" + realm).length);
            var uri = "xmpp/" + domain;
            var qop = "auth";   //no integrity or confidentiality

            // calculate A1
            var A1;
            A1 = jabberwerx.util.crypto.rstr_md5(jabberwerx.util.crypto.utf8Encode(user + ":" + realm + ":" + pass));
            A1 = A1 + jabberwerx.util.crypto.utf8Encode(":" + nonce + ":" + cnonce);

            // calcuate A2
            var A2;
            A2 = jabberwerx.util.crypto.utf8Encode("AUTHENTICATE:" + uri);

            // calculate response
            var rsp = [ jabberwerx.util.crypto.str2hex(jabberwerx.util.crypto.rstr_md5(A1)),
                        nonce,
                        nc,
                        cnonce,
                        qop,
                        jabberwerx.util.crypto.str2hex(jabberwerx.util.crypto.rstr_md5(A2))
                ].join(":");
            rsp = jabberwerx.util.crypto.hex_md5(jabberwerx.util.crypto.utf8Encode(rsp));

            var outprops = {
                "charset" : "utf-8",
                "digest-uri" : uri,
                "cnonce": cnonce,
                "nonce": nonce,
                "nc" : nc,
                "qop" : qop,
                "username": user,
                "realm": realm,
                "response": rsp
            };

            this._authProps = outprops;
            this._stage = this._verifyRspAuth;

            return outprops;
        },
        /**
         * @private
         */
        _verifyRspAuth: function(inprops) {
            if (inprops) {
                inprops = jabberwerx.$.extend({}, inprops, this._authProps || {});
                var params = this.getProperties();
                var user, pass, domain;
                user = (params.jid && params.jid.getNode()) || "";
                domain = (params.jid && params.jid.getDomain()) || "";
                pass = params.password || "";

                var realm = inprops.realm || domain;
                var nonce = inprops.nonce;
                var nc = inprops.nc || "00000001";
                var cnonce = inprops.cnonce;
                var uri = "xmpp/" + domain;
                var qop = "auth";   //no integrity or confidentiality

                // calculate A1
                var A1;
                A1 = jabberwerx.util.crypto.rstr_md5(jabberwerx.util.crypto.utf8Encode(user + ":" + realm + ":" + pass));
                A1 = A1 + jabberwerx.util.crypto.utf8Encode(":" + nonce + ":" + cnonce);

                // calcuate A2
                var A2;
                A2 = jabberwerx.util.crypto.utf8Encode(":" + uri);

                // calculate response
                var rsp = [ jabberwerx.util.crypto.str2hex(jabberwerx.util.crypto.rstr_md5(A1)),
                            nonce,
                            nc,
                            cnonce,
                            qop,
                            jabberwerx.util.crypto.str2hex(jabberwerx.util.crypto.rstr_md5(A2))
                    ].join(":");
                rsp = jabberwerx.util.crypto.hex_md5(jabberwerx.util.crypto.utf8Encode(rsp));

                if (rsp != inprops.rspauth) {
                    jabberwerx.util.debug.log("response auth values do not match");
                    throw new jabberwerx.SASLMechanism.SASLAuthFailure();
                }
            }

            this.complete = true;
            this._stage = null;
        },

        /**
         * @private
         */
        _decodeProperties: function(str) {
            var ptn = /([^"()<>\{\}\[\]@,;:\\\/?= \t]+)=(?:([^"()<>\{\}\[\]@,;:\\\/?= \t]+)|(?:"([^"]+)"))/g;
            var props = {};
            var field;

            if (!str) {
                str = "";
            }
            while (field = ptn.exec(str)) {
                props[field[1]] = field[2] || field[3] || "";
            }

            return props;
        },
        /**
         * @private
         */
        _encodeProperties: function(props) {
            var quoted = {
                "username": true,
                "realm": true,
                "nonce": true,
                "cnonce": true,
                "digest-uri": true,
                "response": true
            };
            var tmp = [];

            for (var name in props) {
                var val = quoted[name] ?
                        '"' + props[name] + '"' :
                        props[name];
                tmp.push(name + "=" + val);
            }

            return tmp.join(",");
        },

        /**
         * @private
         */
        _stage: null,
        /**
         * @private
         */
        _cnonce: function(size) {
            var data = "";
            for (var idx = 0; idx < size; idx++) {
                data += String.fromCharCode(Math.random() * 256);
            }

            return jabberwerx.util.crypto.b64Encode(data);
        }
    }, "jabberwerx.SASLDigestMd5Mechanism", "DIGEST-MD5");
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/JID.js*/
/**
 * filename:        JID.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    var _jidCache = {};
    /** @private */
    var _lookupCache = function(val) {
        if (!val) {
            throw new jabberwerx.JID.InvalidJIDError();
        }

        val = val.toString();

        var jid = _jidCache[val];
        if (jid) {
            return jid;
        }

        // quick separation
        var resSep = val.lastIndexOf('/');
        val = (resSep != -1) ?
              val.substring(0, resSep).toLowerCase()
                    + "/" + val.substring(resSep + 1) :
              val.toLowerCase();
        jid = _jidCache[val];
        if (jid) {
            return jid;
        }

        return null;
    };

    jabberwerx.JID = jabberwerx.JWModel.extend(/** @lends jabberwerx.JID.prototype */{
        /**
         * @class
         * <p>Represents a JID identifier. A JID has the general string
         * form:</p>
         *
         * <pre class="code">node@domain/resource</pre>
         *
         * <p>Where {node} (and its trailing '@') and {resource} (and its
         * leading '/') are optional.</p>
         *
         * @description
         * <p>Creates a new JID.</p>
         *
         * <p>The value of {arg} must be one of the following:</p>
         * <ul>
         * <li>a string representation of a JID (e.g.
         * "username@hostname/resource")</li>
         * <li>An object with the following properties:
         * <pre class='code'>{
            // REQUIRED: domain portion of JID
            domain: "hostname",
            // OPTIONAL: node portion of JID
            node: "username",
            // OPTIONAL: resource portion of JID
            resource: "resource",
            // OPTIONAL: "true" if the node is unescaped, and should
            // be translated via {@link #.escapeNode}
            unescaped: true|false
         * }</pre></li>
         * </ul>
         *
         * <p><b>NOTE:</b> The preferred method of obtaining a JID is to use
         * {@link jabberwerx.JID.asJID}; it returns cached instances, which
         * can save considerable time.</p>
         *
         * @param   {String|Object} arg The string or parts for a JID
         * @throws  {jabberwerx.JID.InvalidJIDError} If a JID cannot be created from
         *          {arg}.
         * @constructs jabberwerx.JID
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function(arg) {
            if (arg instanceof jabberwerx.JID) {
                arg = {
                    "node": arg.getNode() || null,
                    "domain": arg.getDomain() || null,
                    "resource": arg.getResource() || null
                };
            } else if (typeof(arg) == "string") {
                //We'll parse this ourselves...
                var result = /^(?:([^\/]+)@)?([^@\/]+)(?:\/(.+))?$/.exec(arg);
                if (!result) {
                    throw new jabberwerx.JID.InvalidJIDError("JID did not match the form 'node@domain/resource'");
                }

                arg = {
                    "node": (result[1] || undefined),
                    "domain": result[2],
                    "resource": (result[3] || undefined)
                };
            } else if (!arg) {
                throw new jabberwerx.JID.InvalidJIDError("argument must be defined and not null");
            } else {
                // Clone argument
                arg = jabberwerx.$.extend({}, arg);
            }

            var prepFN = function(test) {
                if (/[ \t\n\r@\:\<\>\&'"\/]/.test(test)) {
                    throw new jabberwerx.JID.InvalidJIDError("invalid characters found");
                }

                return test.toLowerCase();
            };

            // prep domain
            if (!arg.domain) {
                throw new jabberwerx.JID.InvalidJIDError("'' or null or undefined domain not allowed");
            } else {
                arg.domain = prepFN(arg.domain, true);
            }

            // prep node
            if (arg.node == "") {
                throw new jabberwerx.JID.InvalidJIDError("'' node with @ not allowed");
            } else if (arg.node) {
                if (arg.unescaped) {
                    arg.node = jabberwerx.JID.escapeNode(arg.node);
                }
                arg.node = prepFN(arg.node, true);
            }

            // prep resource
            if (arg.resouce == "") {
                throw new jabberwerx.JID.InvalidJIDError("'' resource with / not allowed");
            }

            this._domain = arg.domain;
            this._node = arg.node || "";
            this._resource = arg.resource || "";
            this._full = "" +
                    (arg.node ? arg.node + "@" : "") +
                    arg.domain +
                    (arg.resource ? "/" + arg.resource : "");

            // cache it!
            if (!_jidCache[this.toString()]) {
                _jidCache[this.toString()] = this;
            }
        },

        /**
         * <p>Returns the bare JID form of this JID. A bare JID consists of
         * the node and domain, but not the resource. If this JID is already
         * a bare JID, this method returns the current JID. Otherwise, a new
         * JID object is created that contains only the node and domains.</p>
         *
         * @returns {jabberwerx.JID} The "bare" JID from this JID
         */
        getBareJID: function() {
            if (!this.getResource()) {
                return this;
            } else {
                return new jabberwerx.JID({
                    "node": this.getNode(),
                    "domain": this.getDomain()
                });
            }
        },
        /**
         * <p>Returns the bare JID form of this JID as a string. This method
         * is a convenience over calling getBareJID().toString().</p>
         *
         * @returns {String} The "bare" JID, as a string
         * @see #getBareJID
         * @see #toString
         */
        getBareJIDString: function() {
            return this.getBareJID().toString();
        },

        /**
         * <p>Retrieves the domain value for this JID.</p>
         *
         * @returns  {String} The JID's domain
         */
        getDomain: function() {
            return this._domain;
        },
        /**
         * <p>Retrieves the node value for this JID. If this
         * JID does not have a node, this method returns "".</p>
         *
         * @returns  {String} The JID's node
         */
        getNode: function() {
            return this._node;
        },
        /**
         * <p>Retrieves the resource value for this JID. If this
         * JID does not have a resource, this method returns "".</p>
         *
         * @returns  {String} The JID's resource
         */
        getResource: function() {
            return this._resource;
        },

        /**
         * <p>Retrieves the string respesenting this JID.</p>
         *
         * @returns  {String} The string representation
         */
        toString: function() {
            return this._full;
        },
        /**
         * <p>Retrieves the display string representing this JID.
         * This method returns a JID with the node portion unescaped
         * via {@link jabberwerx.JID#.unescapeNode}. As such, the returned string may
         * not be a valid JID.</p>
         *
         * @returns  {String} The display string representation
         */
        toDisplayString: function() {
            var result = this.getDomain();
            var part;

            part = this.getNode();
            if (part) {
                result = jabberwerx.JID.unescapeNode(part) + "@" + result;
            }

            part = this.getResource();
            if (part) {
                result = result + "/" + part;
            }

            return result;
        },

        /**
         * <p>Determines if this JID is equal to the given JID.</p>
         *
         * @param   {String|jabberwerx.JID} jid The JID (or string representing
         *          a JID) to compare to
         * @returns {Boolean} <tt>true</tt> if this JID and {jid} represent
         *          the same JID value
         */
        equals: function(jid) {
            try {
                jid = jabberwerx.JID.asJID(jid);
                return this.toString() == jid.toString();
            } catch (ex) {
                return false;
            }
        },
        /**
         * <p>Compares this JID to the given JID for ordering. The order of
         * two JIDs is determined by their parts as follows:</p>
         *
         * <ol>
         *  <li>domain (returns -1 or 1 if not equal)</li>
         *  <li>node (returns -1 or 1 if not equal)</li>
         *  <li>resource (returns -1 or 1 if not equal)</li>
         * </ol>
         *
         * @param   {String|jabberwerx.JID} jid The JID (or string represting
         *          a JID) to compare to
         * @returns {Number} -1, 0, or 1 if this JID is before, equal to, or
         *          after {jid}
         * @throws  {jabberwerx.JID.InvalidJIDError} If {jid} is not a valid JID
         */
        compareTo: function(jid) {
            jid = jabberwerx.JID.asJID(jid);
            var cmp = function(v1, v2) {
                if          (v1 < v2) {
                    return -1;
                } else if   (v1 > v2) {
                    return 1;
                }

                return 0;
            };
            //var     val1 = this.toString(), val2 = test.toString();
            var result;
            if ((result = cmp(this.getDomain(), jid.getDomain())) != 0) {
                return result;
            }
            if ((result = cmp(this.getNode(), jid.getNode())) != 0) {
                return result;
            }
            if ((result = cmp(this.getResource(), jid.getResource())) != 0) {
                return result;
            }

            return 0;
        },

        /**
         * <p>Determines if this type should be serialized inline with other
         * primitive (boolean, number, string) or inlinable types.</p>
         *
         * @returns  {Boolean}   Always <tt>true</tt>
         */
        shouldBeSerializedInline: function() {
            return false;
        },
        /**
         * <p>Called just after this JID is unserialized. This method recreates
         * the internal structures from the string representation.</p>
         */
        wasUnserialized: function() {
            // put it back in the cache
            _jidCache[this.toString()] = this;
        },

        /**
         * @private
         */
        _node: "",
        /**
         * @private
         */
        _domain: "",
        /**
         * @private
         */
        _resource: "",
        /**
         * @private
         */
        _full: ""
    }, 'jabberwerx.JID');

    /**
     * @class jabberwerx.JID.InvalidJIDError
     * <p>Error thrown when invalid JID strings are encountered.</p>
     *
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.JID.InvalidJIDError = jabberwerx.util.Error.extend.call(
            TypeError,
            "The JID is invalid");

    /**
     * <p>Converts an object into a jabberwerx.JID. This method
     * uses the following algorithm:</p>
     *
     * <ol>
     * <li>If {val} is an instance of jabberwerx.JID, return it</li>
     * <li>If a JID exists in the internal cache that matches the string value
     * of {val}, return it.</li>
     * <li>Create a new jabberwerx.JID from val, and cache it</li>
     * </ol>
     *
     * @param val The value to convert to a JID
     * @returns {jabberwerx.JID} The JID object from {val}
     * @throws {jabberwerx.JID.InvalidJIDError} If {val} could not be converted into a JID
     */
    jabberwerx.JID.asJID = function(val) {
        var jid = null;

        if (val instanceof jabberwerx.JID) {
            return val;
        }

        jid = _lookupCache(val);
        if (!jid) {
            // not found; create and (possibly) cache
            jid = new jabberwerx.JID(val);

            var lookup = jid.toString();
            if (_jidCache[lookup] && _jidCache[lookup] != jid) {
                // mixed-case input; return previously cached value
                jid = _jidCache[lookup];
            } else {
                _jidCache[lookup] = jid;
            }

            // always cache the original request
            _jidCache[val.toString()] = jid;
        }

        return jid;
    };
    /**
     * Clears the internal cache of JIDs.
     *
     * <b>NOTE:</b> This does not destroy existing JID instances.
     */
    jabberwerx.JID.clearCache = function() {
        _jidCache = {};
    },

    /**
     * <p>Translates the given input into a valid node for a JID. This method
     * performs the translation according to the escaping rules in XEP-0106:
     * JID Escaping.</p>
     *
     * @param   {String} input The string to translate
     * @returns {String} The translated string
     * @throws  {TypeError} if {input} is not a string; or if {input}
     *          starts or ends with ' '
     * @see     <a href='http://xmpp.org/extensions/xep-0106.html'>XEP-0106: JID Escaping</a>
     */
    jabberwerx.JID.escapeNode = function(input) {
        if (typeof(input) != "string") {
            throw new TypeError("input must be a string");
        }

        if (input.charAt(0) == ' ' || input.charAt(input.length - 1) == ' ') {
            throw new TypeError("input cannot start or end with ' '");
        }

        var ptn = /([ "&'\/:<>@])|(\\)(20|22|26|27|2f|3a|3c|3e|40|5c)/gi;
        var repFN = function(found, m1, m2, m3) {
            switch (m1 || m2) {
                case ' ':   return "\\20";
                case '"':   return "\\22";
                case '&':   return "\\26";
                case '\'':  return "\\27";
                case '/':   return "\\2f";
                case ':':   return "\\3a";
                case '<':   return "\\3c";
                case '>':   return "\\3e";
                case '@':   return "\\40";
                case '\\':  return "\\5c" + m3;
            }

            return found;
        };

        return input.replace(ptn, repFN);
    };
    /**
     * <p>Translates the given input from a valid node for a JID. This method
     * performs the translation according to the unescaping rules in XEP-0106:
     * JID Escaping.</p>
     *
     * @param   {String} input The string to translate
     * @returns {String} The translated string
     * @throws  {TypeError} if {input} is not a string
     * @see     <a href='http://xmpp.org/extensions/xep-0106.html'>XEP-0106: JID Escaping</a>
     */
    jabberwerx.JID.unescapeNode = function(input) {
        if (typeof(input) != "string") {
            throw new TypeError("input must be a string");
        }

        var ptn = /(\\20|\\22|\\26|\\27|\\2f|\\3a|\\3c|\\3e|\\40|\\5c)/gi;
        var repFN = function(found, m1) {
            switch (m1) {
                case "\\20":    return ' ';
                case "\\22":    return '"';
                case "\\26":    return '&';
                case "\\27":    return '\'';
                case "\\2f":    return '/';
                case "\\3a":    return ':';
                case "\\3c":    return '<';
                case "\\3e":    return '>';
                case "\\40":    return '@';
                case "\\5c":    return '\\';
            }

            return found;
        };

        return input.replace(ptn, repFN);
    };


    /**
     * @private
     *
     * Test JID.toString and ovrride prototypical tostring function if needed (IE8)
     */
    var tjid = jabberwerx.JID.asJID("foo");
    if ((tjid + "") !== "foo") {
        /*DEBUG-BEGIN*/
            jabberwerx.util.debug.log("Overriding jabberwerx.JID.toString");
        /*DEBUG-END*/
        jabberwerx.JID.prototype.toString = function() {
            return this._full || "";
        };
    }

})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Events.js*/
/**
 * filename:        Events.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx){

    /** @private */
    var _jwaNotifierBinding = function(dispatch, name, mode) {
        var key = 'on:' + name.toLowerCase();
        var notifier = dispatch[key];

        if (!notifier && (mode == 'create')) {
            notifier = new jabberwerx.EventNotifier(dispatch, name);
            dispatch[key] = notifier;
        } else if (notifier && (mode == 'destroy')) {
            delete dispatch[key];
        }

        return notifier;
    };
    /** @private */
    var _jwaDispatchBinding = function(src, name, mode) {
        var dispatch = (src instanceof jabberwerx.EventDispatcher) ?
                src :
                src._eventDispatch;
        if (!(dispatch && dispatch instanceof jabberwerx.EventDispatcher)) {
            if (mode != 'create') {
                return;
            }
            dispatch = new jabberwerx.EventDispatcher(src);
            src._eventDispatch = dispatch;
        }

        return _jwaNotifierBinding(dispatch, name, mode);
    };

    /**
     * @class
     * The object representation for an event.
     *
     * @property {String} name The event name
     * @property {jabberwerx.EventNotifier} notifier The triggering notifier
     * @property {Object} source The source of the event
     * @property data Event-specific data
     * @property selected The results of a selection. This value is set if
     *           the callback was registered with a selector, and the selector
     *           matched.
     *
     * @description
     * Constructs a new jabberwerx.EventObject from the given notifier and
     * event data.
     *
     * @param {jabberwerx.EventNotifier} notifier The triggered notifier
     * @param [data] The event data
     * @constructs jabberwerx.EventObject
     * @see jabberwerx.EventNotifier#bindWhen
     * @minimal
     */
    jabberwerx.EventObject = function(notifier, data) {
        this.notifier = notifier;
        this.name = notifier.name;
        this.source = notifier.dispatcher.source;
        this.data = data;
        this.selected = undefined;
    };

    jabberwerx.EventNotifier = jabberwerx.JWBase.extend(/** @lends jabberwerx.EventNotifier.prototype */{
        /**
         * @class
         * Manages notifying listeners for a given event name.
         *
         * @property {jabberwerx.EventDispatcher}  dispatcher The owning dispatcher
         * @property {String} name The event name
         *
         * @description
         * Constructs a new EventNotifier with the given dispatcher and
         * event name.
         *
         * This constructor should not be called directly.  Instead, it is
         * constructed by the {@link jabberwerx.EventDispatcher} as part of its
         * constructor, or internally as needed.
         *
         * @param {jabberwerx.EventDispatcher} dispatcher The owning dispatcher
         * @param {String} name The event name
         * @constructs jabberwerx.EventNotifier
         * @extends JWBase
         * @minimal
         */
        init: function(dispatcher, name) {
            this._super();

            this.dispatcher = dispatcher;
            this.name = name.toLowerCase();

            this._callbacks = [];
        },
        /**
         * Registers the given callback with this EventNotifier.
         *
         * <p>The callback is expected to have the following signature:</p>
         * <pre>
         *  cb = function(evt) {
         *      // evt is the jabberwerx.EventObject instance describing
         *      // the current triggering
         *
         *      // return true to indicate this event is "handled"
         *      // This return value may have special meaning for some
         *      // event notifiers
         *  }
         * </pre>
         *
         * <p>Callbacks are remember by their object reference, and are
         * considered to be unique. Registering the same function multiple
         * times removes any previous registration, and applies {cb} to the
         * current position and with the supplied additional arguments.</p>
         *
         * @param {Function} cb The callback to register or update
         * @throws {TypeError} If {cb} is not a function
         */
        bind: function(cb) {
            this.bindWhen(undefined, cb);
        },
        /**
         * Registers the given callback, filtering via the given selector. The
         * registered callback is only executed if the given selector indicates
         * the data passed to {@link #trigger} matches.
         *
         * <p>A selector may be either undefined, a jQuery selector string or a
         * function. If {selector} is undefined, then this method performs the
         * same registration as {@link #bind}.</p>
         *
         * <p>If {selector} is a string, it is used as the selector in
         * jabberwerx.$(), with data (coerced into a DOM Node) as the
         * context. If there are any results from the jQuery selection,
         * they are added to the event object's 'selected' property, and
         * {cb} is executed. Note that 'selected' is 'unwrapped' if the
         * selection is a single node; otherwise it is an array of the
         * selected nodes.</p>
         *
         * <p>If {selector} is a function, it is passed the event data, and is
         * expected to return a value (that does not evaluate as false) if the
         * data matches. For example, the following selector function would
         * match any events where the data is a Room:</p>
         *
         * <pre class="code">
         * var selector = function(data) {
         *     if (data instanceof jabberwerx.Room) {
         *         return data; //non-null object is "true"
         *     }
         *     return false; //prevents matching
         * }
         * </pre>
         *
         * <p>The result of {selector} is stored in the {@link
         * jabberwerx.EventObject#selected} property.</p>
         *
         * <pre>
         *  cb = function(evt) {
         *      // evt is the jabberwerx.EventObject instance describing
         *      // the current triggering
         *
         *      // return true to indicate this event is "handled"
         *      // This return value may have special meaning for some
         *      // event notifiers
         *  }
         * </pre>
         *
         * <p>Callbacks are remember by their object reference, and are
         * considered to be unique. Registering the same function multiple
         * times removes any previous registration, and applies {cb} to the
         * current position and with the supplied additional arguments.</p>
         *
         * @param {String|Function|undefined} selector The selector, as either a
         *        jQuery selector string or a function
         * @param {Function} cb The callback to register or update
         * @throws {TypeError} If {cb} is not a function, or if {selector} is
         *         not of the expected types
         */
        bindWhen: function(selector, cb) {
            if (!jabberwerx.$.isFunction(cb)) {
                new TypeError("callback must be a function");
            }

            this.unbind(cb);
            switch (typeof selector) {
                case 'undefined':
                    //nothing to do
                    break;
                case 'function':
                    //nothing to do
                    break;
                case 'string':
                    var filter = selector;
                    /** @private */
                    selector = function(data, evt) {
                        var node;
                        if (data instanceof jabberwerx.Stanza) {
                            node = data.getDoc();
                        } else {
                            //Hope for the best; although jQuery won't blow up
                            //if data isn't an acceptable context type
                            node = data;
                        }

                        var selected = jabberwerx.$(filter, node);

                        switch (selected.length) {
                            case 0:
                                //No results: fail
                                return false;
                            case 1:
                                //single result: return unwrapped
                                return selected[0];
                            default:
                                //any results: return as-is
                                return selected;
                        }

                        //If we've made it this far, we failed
                        return false;
                    };
                    break;
                default:
                    throw new TypeError("selector must be undefined or function or string");
            }

            this._callbacks.push({
                'filter': filter,
                'selector': selector,
                'cb': cb
            });
        },
        /**
         * Unregisters the given callback from this EventNotifier.
         *
         * @param {Function} cb The callbck to unregister
         */
        unbind: function(cb) {
            this._callbacks = jabberwerx.$.grep(this._callbacks, function(value) {
                return value['cb'] !== cb;
            });
        },
        /**
         * Fires an event on all registered callbacks, with the given data.
         * This method creates a {@link jabberwerx.EventObject}, then
         * calls all of the registered callbacks. Once all of this notifier's
         * callbacks have been notified, all callbacks registered on {@link
         * jabberwerx#.globalEvents} for this event are notified.
         *
         * If provided, the {cb} callback's signature is expected to be:
         *
         * <pre class='code'>
         *  cb = function(results) {
         *      // results is true if any event callback returned true,
         *      // false otherwise
         *  }
         * </pre>
         *
         * @param   [data] data specific to this event triggering
         * @param   {jabberwerx.EventNotifier} [delegated] the notifier to
         *          delegate event triggering to after calling this
         *          notifier's registered callbacks.
         * @param   {Function} [cb] function to execute when all of this
         *          event notifier's callbacks have been notified
         * @throws  {TypeError} If {delegated} is defined and is not an
         *          instance
         */
        trigger: function(data, delegated, cb) {
            var evt;

            if (data instanceof jabberwerx.EventObject) {
                //this is a delegation
                evt = data;
                //substitute notifier to the current one
                evt.notifier = this;
            } else {
                //this is an origination
                evt = new jabberwerx.EventObject(this, data);
            }

            if (!delegated) {
                delegated = _jwaNotifierBinding(jabberwerx.globalEvents, this.name);
            } else if (!(delegated instanceof jabberwerx.EventNotifier)) {
                throw new TypeError("delegated must be a EventNotifier");
            }

            if (cb && !jabberwerx.$.isFunction(cb)) {
                throw new TypeError("cb must be a function");
            }

            return this.dispatcher.process(this, evt, delegated, cb);
        },
        /**
         * @private
         */
        process: function(evt, delegated, cb) {
            var results = false;
            jabberwerx.reduce(this._callbacks, function(item) {
                var     cb = item['cb'];
                var     filter = item['selector'];
                var     retval;

                if (!cb || !jabberwerx.$.isFunction(cb)) {
                    return;
                }

                var selected = undefined;
                if (filter) {
                    selected = filter(evt.data);
                    if (!selected) { return; }
                }

                //try { have our own error catcher handle this instead of this try catch
                    //updated on each call, regardless of filtering
                    evt.selected = selected;
                    retval = cb.call(cb, evt);
                //} catch (ex) {
                    /*DEBUG-BEGIN*/
                //    jabberwerx.util.debug.error('callback on ' + evt.name + ' failed: ' + ex + " :: "  + (ex.toSource&& ex.toSource()) + " " + (ex.stack || ""));
                    /*DEBUG-END*/
                //}

                if (retval !== undefined) {
                    results = results || Boolean(retval);
                }
            });

            if (delegated && delegated !== this) {
                var fn = function(delegatedResults) {
                    results = results || delegatedResults;
                    if (cb) {
                        cb(results);
                    }
                };
                delegated.trigger(evt, null, fn);
            } else if (cb) {
                cb(results);
            }
        },

        /**
         * Marks this type for inline serialization.
         *
         * @returns {Boolean} always true
         */
        shouldBeSavedWithGraph: function() { return true; },

        /**
         * serialize the original string selectors passed to bindWhen.
         *
         * While callbacks are invocations, the selector functions created in bindWhen are anonymous and
         * are not serialized. Serialize original string as needed, selecgor functions to be recreated after
         * graph is restored.
         */
        wasUnserialized: function() {
            //rebuild anon selector functions as needed
            var callbacks = this._callbacks;
            callbacks = jabberwerx.$.map(callbacks, function(oneCB, oneKey) {
                if (jabberwerx.util.isJWInvocation(oneCB.cb)) {
                    var method = oneCB.cb.methodName, target = oneCB.cb.object;
                    if (!(target && method && target[method])) {
                        jabberwerx.util.debug.log("throwing out bad callback: " + target + "[" + method + "]");
                        return null;
                    }
                }

                if (oneCB.filter && !oneCB.selector && (typeof oneCB.filter == 'string')) {
                    var oneFilter = oneCB.filter;
                    oneCB.selector = function(data, evt) {
                        var node;
                        if (data instanceof jabberwerx.Stanza) {
                            node = data.getDoc();
                        } else {
                            //Hope for the best; although jQuery won't blow up
                            //if data isn't an acceptable context type
                            node = data;
                        }

                        var selected = jabberwerx.$(oneFilter, node);

                        switch (selected.length) {
                            case 0:
                                //No results: fail
                                return false;
                            case 1:
                                //single result: return unwrapped
                                return selected[0];
                            default:
                                //any results: return as-is
                                return selected;
                        }

                        //If we've made it this far, we failed
                        return false;
                    };
                }

                return oneCB;
            });

            this._callbacks = callbacks;
        }
    }, "jabberwerx.EventNotifier");

    jabberwerx.EventDispatcher = jabberwerx.JWBase.extend(/** @lends jabberwerx.EventDispatcher.prototype */{
        /**
         * @class
         * Manages a collection of events for a given source.
         *
         * <p>Each event for this dispatcher is represented by a
         * {@link jabberwerx.EventNotifier}, as a property of this dispatcher.
         * To access a specific notifier, use the following notation:</p>
         *
         * <pre class="code">dispatcher['on:&lt;name&gt;']</pre>
         *
         * <p>Where &lt;name&gt; is the name of the event (lower case).</p>
         *
         * @property source The source of events
         *
         * @description
         * Constructs new EventDispatcher with the given source.
         *
         * @param {Object} src The source for events
         * @constructs jabberwerx.EventDispatcher
         * @see jabberwerx.JWModel#event
         * @see jabberwerx.JWModel#applyEvent
         * @minimal
         */
        init: function(src) {
            this._super();

            this.source = src;
            if (src !== jabberwerx && jabberwerx.globalEvents) {
                this.globalEvents = jabberwerx.globalEvents;
            }
        },

        /**
         * @private
         */
        process: function(notifier, evt, delegated, cb) {
            var op = {
                notifier: notifier,
                event: evt,
                delegated: delegated,
                callback: cb
            };

            if (this._queue) {
                // processing another event
                // Defer this event until ready
                this._queue.push(op);
                return;
            }

            // setup a queue, to indicate we're processing events
            this._queue = [op];

            while (op = this._queue.shift()) {
                // process the next event
                op.notifier.process(op.event, op.delegated, op.callback);
            }

            // done with events; delete the queue
            delete this._queue;
        },

        /**
         * Marks this type for inline serialization.
         *
         * @returns {Boolean} always true
         */
        shouldBeSavedWithGraph: function() { return true; },
        /**
         * Called just after to unserializing. This method removes the global
         * dispatcher {@link jabberwerx.globalEvents} from being a property.
         *
         */
        wasUnserialized: function() {
            jabberwerx.globalEvents = this.globalEvents;
        }

    }, "jabberwerx.EventDispatcher");

    jabberwerx.GlobalEventDispatcher = jabberwerx.EventDispatcher.extend(/** @lends jabberwerx.GlobalEventDispatcher.prototype */{
        /**
         * @class
         * The type for the global event dispatcher, {@link jabberwerx.globalEvents}.
         *
         * @extends jabberwerx.EventDispatcher
         * @description
         *
         * Creates a new GlobalEventsDispatcher
         *
         * @throws {Error} if called after {jabberwerx.globalEvents} is already
         * defined.
         * @constructs jabberwerx.GlobalEventDispatcher
         * @minimal
         */
        init: function() {
            this._super(jabberwerx);

            if (jabberwerx.globalEvents && jabberwerx.globalEvents !== this) {
                throw new Error("only one global events dispatcher can exist!");
            }
        },

        /**
         * Registers a callback for the given event name. This method behaves
         * just as {@link jabberwerx.EventNotifier#bind}. This function also
         * ensures that a notifier exists for {name}.
         *
         * @param {String} name The event name to register on
         * @param {Function} cb The callback to register or update
         */
        bind: function(name, cb) {
            var notifier = _jwaNotifierBinding(this, name, 'create');
            notifier.bind(cb);
        },
        /**
         * Registers a callback for the given event name. This method behaves
         * just as {@link jabberwerx.EventNotifier#bindWhen}. This function
         * also ensures that a notifier exists for {name}.
         *
         * @param {String} name The event name to register on
         * @param {String|Function|undefined} selector The selector, as either
         *        a jQuery selector string or a function
         * @param {Function} cb The callback to register or update
         */
        bindWhen: function(name, selector, cb) {
            var notifier = _jwaNotifierBinding(this, name, 'create');
            notifier.bindWhen(selector, cb);
        },
        /**
         * Unregisters a callback for the given event name. This method behaves
         * just as {@link jabberwerx.EventNotifier#unbind}.
         *
         * @param {String} name The event name to unregister on
         * @param {Function} cb The callback to unregister
         */
        unbind: function(name, cb) {
            var notifier = _jwaNotifierBinding(this, name);

            if (notifier) {
                notifier.unbind(cb);
            }
        },

        /**
         * Prevents this type from inline serialization.
         *
         * @returns {Boolean} always false
         */
        shouldBeSerializedInline: function() { return false; },
        /**
         * Marks this type for general graph saving.
         *
         * @returns {Boolean} always true
         */
        shouldBeSavedWithGraph: function() { return true; },
        /**
         * Called just prior to the object being serialized. This method
         * "forgets" the source, to prevent the global "jabberwerx" namespace
         * from being serialized.
         */
        willBeSerialized: function() {
            this.source = undefined;
        },
        /**
         * Called after the object is deserialized and rehydrated. This method
         * "remembers" the source as the global "jabberwerx" namespace.
         */
        wasUnserialized: function() {
            this.source = jabberwerx;
        }
    }, "jabberwerx.GlobalEventDispatcher");

    if (!(  jabberwerx.globalEvents &&
            jabberwerx.globalEvents instanceof jabberwerx.GlobalEventDispatcher)) {
        /**
         * The global event dispatcher. Callbacks registered on this
         * dispatcher are executed when any event of a given name is
         * triggered.
         *
         * <p>The list of all known events are found in
         * <a href="../jabberwerxEvents.html">JabberWerx AJAX Events</a>.</p>
         *
         * @memberOf jabberwerx
         * @see jabberwerx.GlobalEventDispatcher#bind
         * @see jabberwerx.GlobalEventDispatcher#unbind
         * @type jabberwerx.GlobalEventDispatcher
         */
        jabberwerx.globalEvents = new jabberwerx.GlobalEventDispatcher();
    }

    /**
     * Locates the jabberwerx.EventNotifier for the given name.
     *
     * @returns {jabberwerx.EventNotifier} The notifier for {name}, or
     * {null} if not found
     */
    jabberwerx.JWModel.prototype.event = function(name) {
        return _jwaDispatchBinding(this, name);
    };
    /**
     * Establishes the event handling for a given event name. This
     * function ensures that a {@link jabberwerx.EventDispatcher} exists,
     * and that the dispatcher contains a {@link jabberwerx.EventNotifier}
     * for {name}.
     *
     * @param {String} name The event name
     * @returns {jabberwerx.EventNotifier} the notifier for {name}
     */
    jabberwerx.JWModel.prototype.applyEvent = function(name) {
        return _jwaDispatchBinding(this, name, 'create');
    };

})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Entity.js*/
/**
 * filename:        Entity.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx){
    /**
     * @private
     */
    var __jwesAsKey = function(jid, node) {
        return "[" + (jid || "") + "]:[" + (node || "") + "]";
    };

    jabberwerx.Entity = jabberwerx.JWModel.extend(/** @lends jabberwerx.Entity.prototype */{
        /**
         * @class
         * <p>
         * Something addressable by JID and/or node: user, server, room, etc. For this release, clients
         * are not considered entities; there's a single global client.
         * </p>
         *
         * <p>
         * This class provides the following events:
         * <ul>
         * <li><a href="../jabberwerxEvents.html#jabberwerx.Entity">jabberwerx.Entity</a></li>
         * </ul>
         *
         * To subscribe for a single entities primary presence updates use:<p><br>
         * <i>entity.event('primaryPresenceUpdated').bind......</i><br>
         * To subscribe for all entities primary presence updates use:<br>
         * <i>jabberwerx.globalEvents.bind('primaryPresenceChanged',......</i></p>
         *
         * @description
         * <p>Creates a new Entity with the given key and controller/cache.</p>
         *
         * <p>The value of key is expected to be an object with at least one of
         * the following properties:</p>
         *
         * <ul>
         * <li><b>jid:</b> The JID for this Entity (must either be undefined or
         * represent a valid JID)</li>
         * <li><b>node:</b> The sub node for this Entity (must either be
         * undefined or a non-empty string)</li>
         * </ul>
         *
         * <p>The value of {ctrl} may be undefined, a
         * {@link jabberwerx.Controller} or a
         * {@link jabberwerx.ClientEntityCache}. If it is a Controller,
         * its {@link jabberwerx.Controller#updateEntity} and
         * {@link jabberwerx.Controller#removeEntity} method will be called
         * as appropriate. If it is a ClientEntityCache, the event notifiers
         * for "entityCreated", "entityUpdated", and "entityDestroyed" are
         * retained and used as appropriate.</p>
         *
         * @param   {Object} key The JID and/or node identifying this entity
         * @param   {jabberwerx.Controller|jabberwerx.EntitySet} [ctrl] The
         *          controller or cache for this entity
         * @constructs jabberwerx.Entity
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function(key, ctrl) {
            this._super();

            if (!key && !(key.jid || key.node)) {
                throw new TypeError("key must contain a jid and/or a node");
            }

            // setup key
            if (key.jid) {
                this.jid = jabberwerx.JID.asJID(key.jid);
            }
            if (key.node) {
                this.node = key.node;
            }
            this._mapKey = __jwesAsKey(this.jid, this.node);

            var cache;
            if (ctrl instanceof jabberwerx.Controller) {
                this.controller = ctrl;
                cache = ctrl.client && ctrl.client.entitySet;
            } else if (ctrl && ctrl.register && ctrl.unregister && ctrl.entity) {
                cache = ctrl;
            }

            if (cache) {
                this.cache = cache;
                this._eventing = {
                    "added"   : cache.event("entityCreated"),
                    "updated" : cache.event("entityUpdated"),
                    "deleted" : cache.event("entityDestroyed")
                };
            } else {
                this._eventing = {
                    "added"   : null,
                    "updated" : null,
                    "deleted" : null
                };
            }

            // Set up event
            this.applyEvent('primaryPresenceChanged');
            this.applyEvent("resourcePresenceChanged");
        },

        /**
         * <p>Destroys this entity. In most cases, this method should not
         * be called directly. Instead, call {@link #remove}.</p>
         */
        destroy: function() {
            if (this.cache) {
                this.cache.unregister(this);
            }

            this._super();
        },

        /**
         * <p>Applies the values from the given entity to this one.
         * This method copies the groups, displayName, properties, features,
         * and identities from {entity} into this one. It then calls
         * {@link #update}, which may trigger an "entityUpdated" event.</p>
         *
         * @param   {jabberwerx.Entity} entity The entity to apply
         * @param   {Boolean} [noupdate] <tt>true</tt> to indicate that
         *          an update should NOT be triggered
         * @returns {jabberwerx.Entity} This entity
         * @throws  {TypeError} if {entity} is not an instance of Entity.
         */
        apply: function(entity, noupdate) {
            if (!(entity && entity instanceof jabberwerx.Entity)) {
                throw new TypeError("entity is not valid");
            }

            jabberwerx.$.extend(this, {
                _displayName: entity._displayName,
                _groups: jabberwerx.$.extend([], entity._groups),
                _presenceList: jabberwerx.$.extend([], entity._presenceList),
                properties: jabberwerx.$.extend(true, {}, entity.properties),
                features: jabberwerx.$.extend([], entity.features),
                identities: jabberwerx.$.extend([], entity.identities)
            });

            if (!noupdate) {
                this.update();
            }

            return this;
        },

        /**
         * @private
         */
        __toStringValue: function() {
            return "entity<" + this.getClassName() + ">[" +
                    this._mapKey + "]: " +
                    this.getDisplayName();
        },
        /**
         * <p>Determines if the given entity matches this Entity. This
         * method returns <tt>true</tt> if the jids and nodes of this Entity
         * are equal to {entity}'s.</p>
         *
         * @param {jabberwerx.Entity} entity The entity to match against
         * @returns {Boolean} <tt>true</tt> if {entity}'s identity matches
         *          this Entity.
         */
        matches: function(entity) {
            if (entity === this) {
                return true;
            }

            if (!entity) {
                return false;
            }

            return this._mapKey == entity._mapKey;
        },

        /**
         * <p>Determines if this entity is active. This method returns
         * <tt>true</tt> if the entity has at least one available presence
         * in its list.</p>
         *
         * <p>Subclasses may override this method to provide an alternative
         * means of determining its active state.</p>
         *
         * @returns {Boolean} <tt>true</tt> if the entity is active
         */
        isActive: function() {
            return (this._presenceList.length > 0 &&
                    this._presenceList[0].getType() != "unavailable");
        },

        /**
         * Gets the primary presence object of this entity. If the primary presence for this object
         * does not exist then null is returned.
         * @returns {jabberwerx.Presence} primary presence
         */
        getPrimaryPresence: function() {
            return this._presenceList[0] || null;
        },

        /**
         * Returns a sorted array of all presence objects for this entity
         * @returns {jabberwerx.Presence[]} an array of presence objects
         */
        getAllPresence: function() {
            return this._presenceList;
        },

        /**
         * Gets the presence object for a particular resource under this entity.
         * @param {String} resource The resource to get the presence object for
         * @returns {jabberwerx.Presence} The presence object for the resource. If the resource does not exist or does not have
         * a presence object associated with it then null is returned.
         */
        getResourcePresence: function(resource) {
            var fullJid = this.jid.getBareJIDString() + '/' + resource;
            var presence = null;
            jabberwerx.$.each(this._presenceList, function() {
                if (this.getFrom() == fullJid) {
                    // Assign value to return value and exit jabberwerx.$.each loop
                    presence = this;
                    return false;
                }
                return true;
            });
            return presence;
        },

        /**
         * <p>Update presence for this Entity.</p>
         *
         * <p>If {presence} results in a change of the primary resource for
         * this entity, a "primaryPresenceChanged" event is triggered. A
         * "resourcePresenceChanged" event is always triggered by this method,
         * before "primaryPresenceChanged" (if applicable).</p>
         *
         * <p><b>NOTE:</b> The {quiet} flag is used to suppress the normal
         * eventing for certain cases, such as during entity creation. It
         * should not be needed in most cases.
         *
         * @param   {jabberwerx.Presence} [presence] The presence used to
         *          update. If this parameter is null or undefined the
         *          presence list for this entity is cleared.
         * @param   {Boolean} [quiet] <tt>true</tt> to suppress firing
         *          "primaryPresenceChagned" and "resourcePresenceChanged"
         *          events
         * @returns  {Boolean} <tt>true</tt> if primary presence changed.
         * @throws  {TypeError} If {presence} exists but is not a valid availability or
         *          unavailability presence for this entity
         */
        updatePresence: function(presence, quiet) {
            var retVal = false;

            if (!presence) {
                if (this.getPrimaryPresence()) {
                    // Trigger a resourcePresenceChanged event and remove every presence object in
                    // the presence list
                    var len = this._presenceList.length;
                    for (var i=0; i<len; i++) {
                        var tpres = this._presenceList.pop();
                        !quiet && this.event("resourcePresenceChanged").trigger({
                            fullJid: tpres.getFromJID(),
                            presence: null,
                            nowAvailable: false
                        });
                    }

                    !quiet && this.event("primaryPresenceChanged").trigger({
                        presence: null,
                        fullJid: this.jid.getBareJID()
                    });

                    retVal = true;
                }
            } else {
                if (!(presence instanceof jabberwerx.Presence)) {
                    throw new TypeError("presence is not a valid type");
                }

                var jid = presence.getFromJID();
                if (jid.getBareJIDString() != this.jid.getBareJIDString()) {
                    throw new jabberwerx.Entity.InvalidPresenceError("presence is not for this entity: " + this);
                }

                if (presence.getType() && presence.getType() != "unavailable") {
                    throw new jabberwerx.Entity.InvalidPresenceError("presence is not the correct type");
                }
                //If the user resource presence went from unavailable to available, set nowAvailable to true
                var resPresence = this.getResourcePresence(jid.getResource());
                var nowAvailable;
                if (!resPresence || resPresence.getType() == "unavailable") {
                    nowAvailable = Boolean(!presence.getType());
                } else {
                    nowAvailable = false;
                }


                // Keep reference to primary presence before insert is made
                var primaryPresence = this._presenceList[0] || null;

                // Remove old presence object and add new presence object
                this._removePresenceFromList(jid.toString());
                if (presence.getType() != "unavailable") {
                    if (!this.isActive()) {
                        this._clearPresenceList();
                    }
                    this._insertPresence(presence);
                } else {
                    this._handleUnavailable(presence);
                }

                !quiet && this.event("resourcePresenceChanged").trigger({
                    fullJid: jid,
                    presence: presence,
                    nowAvailable: nowAvailable
                });
                if (primaryPresence !== this._presenceList[0]) {
                    var primaryJid;
                    primaryPresence = this._presenceList[0] || null;
                    primaryJid = primaryPresence ?
                        primaryPresence.getFromJID() :
                        jid.getBareJID();
                    !quiet && this.event("primaryPresenceChanged").trigger({
                        presence: primaryPresence,
                        fullJid: primaryJid
                    });
                    retVal = true;
                }
            }

            return retVal;
        },

        /**
         * @private
         * This function gets called when an unavailable presence get sent to
         * {@link jabberwerx.Entity#updatePresence}.
         */
        _handleUnavailable: function(presence) {
        },

        /**
         * @private
         */
        _insertPresence: function(presence) {
            var ipos;
            //latest inserted before dups
            for (ipos = 0;
                 (ipos < this._presenceList.length) &&
                 (presence.compareTo(this._presenceList[ipos]) < 0);
                 ++ipos);
            this._presenceList.splice(ipos, 0, presence);
        },

        /**
         * @private
         */
        _clearPresenceList: function() {
            this._presenceList = [];
        },

        /**
         * @private
         * Removes the presence object specified by the jid parameter from the _presenceList
         * @param {String} jid
         * @returns {Boolean} true if presence object was found and removed, false if could not be found
         */
        _removePresenceFromList: function(jid) {
            for(var i=0; i<this._presenceList.length; i++) {
                if (this._presenceList[i].getFrom() == jid) {
                    this._presenceList.splice(i,1);
                    return true;
                }
            }
            return false;
        },

        /**
         * <p>Retrieves the display name for this Entity. This method
         * returns the explicitly set value (if one is present), or a
         * string using the following format:</p>
         *
         * <div class="code">{&lt;node&gt;}&lt;jid&gt;</div>
         *
         * <p>Where &lt;jid&gt; is {@link #jid} (or "" if not defined), and
         * &lt;node&gt; is {@link #node} (or "" if not defined).</p>
         *
         * <p>Subclasses overriding this method SHOULD also override
         * {@link #setDisplayName}.</p>
         *
         * @returns {String} The display name
         */
        getDisplayName: function() {
            var name = this._displayName;
            if (!name) {
                var jid = (this.jid && this.jid.toDisplayString());
                name = (this.node ? "{" + this.node + "}" : "") + (jid || "");
            }

            return name;
        },
        /**
         * <p>Changes or removes the expclit display name for this Entity.
         * If the value of {name} is non-empty String, it is set as the
         * explicit display name. Otherwise any previous value is cleared.</p>
         *
         * <p>If this entity has a controller associated with it, its
         * {@link jabberwerx.Controller#updateEntity} is called, passing
         * in this Entity. Otherwise this method attempts to trigger a
         * "entityUpdated" event on the associated event cache.</p>
         *
         * <p>Subclasses overriding this method SHOULD also override
         * {@link #getDisplayName}.</p>
         *
         * @param {String} name The new display name
         */
        setDisplayName: function(name) {
            var nval = (String(name) || "");
            var oval = this._displayName;

            if (oval != nval) {
                this._displayName = nval;
                this.update();
            }
        },
        /**
         * @private
         */
        _displayName: "",

        /**
         * <p>Retrieves the groups for this Entity. The returned
         * array is never {null} or {undefined}.</p>
         *
         * @returns {String[]} The array of groups (as strings)
         */
        getGroups: function() {
            return this._groups;
        },
        /**
         * <p>Changes or removes the groups for this Entity. This method
         * uses the following algorithm:</p>
         *
         * <ol>
         * <li>If {groups} is an array, it is cloned (with duplicate values
         * removed) and replaces any previous groups.</li>
         * <li>If {groups} is a single string, all previous groups are replaced
         * with an array containing this value.</li>
         * <li>Otherwise, the previous groups are replaced with an empty
         * array.</li>
         * </ol>
         * @param {String[]|String} [groups] The name of groups
         */
        setGroups: function(groups) {
            if (jabberwerx.$.isArray(groups)) {
                groups = jabberwerx.unique(groups.concat([]));
            } else if (groups) {
                groups = [ groups.toString() ];
            } else {
                groups = [];
            }

            this._groups = groups;
            this.update();
        },
        /**
         *
         */
        _groups : [],

        /**
         * <p>Triggers an update of this entity. If the entity has a
         * controller, then {@link jabberwerx.Controller#updateEntity} is
         * called. Otherwise if this entity has an owning cache, an
         * "entityUpdated" event is fired on that cache for this
         * entity.</p>
         *
         */
        update: function() {
            if (this.controller && this.controller.updateEntity) {
                this.controller.updateEntity(this);
            } else if (this._eventing["updated"]) {
                this._eventing["updated"].trigger(this);
            }
        },
        /**
         * <p>Removes this entity. If the entity has a controller, then
         * {@link jabberwerx.Controller#removeEntity} is called. Otherwise
         * {@link #destroy} is called.</p>
         */
        remove: function() {
            if (this.controller && this.controller.removeEntity) {
                this.controller.removeEntity(this);
            } else {
                this.destroy();
            }
        },

        /**
         * <p>Determines if this Entity supports the given feature.</p>
         *
         * @param   {String} feat The feature to check for
         * @returns  {Boolean} <tt>true</tt> if {feat} is supported
         */
        hasFeature: function(feat) {
            if (!feat) {
                return false;
            }

            var result = false;
            jabberwerx.$.each(this.features, function() {
                result = String(this) == feat;
                return !result; //return false to break the loop if we found it
            });

            return result;
        },
        /**
         * <p>Determines if this Entity supports the given identity (as a
         * single "category/type" string).</p>
         *
         * @param   {String} id The identity to check for as a "category/type"
         *          string
         * @return  {Boolean} <tt>true</tt> if {id} is supported
         */
        hasIdentity: function(id) {
            if (!id) {
                return false;
            }

            var result = false;
            jabberwerx.$.each(this.identities, function() {
                result = String(this) == id;
                return !result; //return false to break the loop if we found it
            });

            return result;
        },

        /**
         * <p>Retrieves the string value of this Entity.</p>
         *
         * @return  {String} The string value
         */
        toString: function() {
            return this.__toStringValue();
        },

        /**
         * <p>The JID for this Entity. This property may be null if the entity
         * is not JID-addressable.</p>
         *
         * @type jabberwerx.JID
         */
        jid: null,
        /**
         * <p>The node ID for this Entity. This property may be "" if the entity
         * is not node-addressable.</p>
         *
         * @type String
         */
        node: "",

        /**
         * <p>The properties for this Entity. This is an open-ended hashtable,
         * with the specifics defined by subclasses.</p>
         *
         */
        properties: {},

        /**
         * <p>The set of features for this Entity. This is a unique array of
         * Service Discovery feature strings.</p>
         *
         * @type    {String[]}
         */
        features: [],
        /**
         * <p>The set of identities for this Entity. This is a unique array of
         * Service Discovery category/type strings.</p>
         *
         * @type    {String[]}
         */
        identities: [],

        /**
         * @private
         * Stores a list of jabberwerx.Presence objects for each resource of this entity. Do not directory modify this
         * but instead use the getPrimaryPresence, getAllPresence, getResourcePresence, addPresence and removePresence methods
         * @type [jabberwerx.Presence]
         */
        _presenceList: []
    }, 'jabberwerx.Entity');

    jabberwerx.Entity.InvalidPresenceError = jabberwerx.util.Error.extend("The provided presence is not valid for this entity");

    jabberwerx.EntitySet = jabberwerx.JWModel.extend(/** @lends jabberwerx.EntitySet */{
        /**
         * @class
         * <p>A repository for Entity objects, based on JID and/or node.</p>
         *
         * <p>
         * This class provides the following events:
         * <ul>
         * <li><a href="../jabberwerxEvents.html#jabberwerx.EntitySet">jabberwerx.EntitySet</a></li>
         * </ul>
         *
         * @description Create a new EntitySet.
         *
         *
         * @constructs jabberwerx.EntitySet
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function() {
            this._super();

            this.applyEvent("entityCreated");
            this.applyEvent("entityDestroyed");
            this.applyEvent("entityUpdated");
            this.applyEvent("entityRenamed");
            this.applyEvent("entityAdded");
            this.applyEvent("entityRemoved");
            this.applyEvent("batchUpdateStarted");
            this.applyEvent("batchUpdateEnded");
        },

        /**
         * Fetch method for any known-existing {@link jabberwerx.Entity} object.
         * If the object does not already exist, `undefined` is returned.
         *
         * @param {jabberwerx.JID|String} [jid] The JID of an entity to fetch.
         * @param {String} [node] The node of an entity to fetch.
         * @type jabberwerx.Entity
         */
        entity: function(jid, node) {
            return this._map[__jwesAsKey(jid, node)];
        },

        /**
         * Registers the given entity to this EntitySet.
         *
         * @param {jabberwerx.Entity} entity The entity to register.
         * @returns {Boolean} <tt>true</tt> if this EntitySet's data was
         *          changed by this call.
         * @throws  {TypeError} if {entity} is not a valid Entity.
         */
        register: function(entity) {
            if (!(entity && entity instanceof jabberwerx.Entity)) {
                throw new TypeError("entity is not an Entity");
            }

            var prev = this.entity(entity.jid, entity.node);
            if (prev === entity) {
                return false;
            }

            if (prev) {
                this.unregister(prev);
            }
            this._updateToMap(entity);
            this.event("entityAdded").trigger(entity);

            return true;
        },
        /**
         * Unregister the given entity from this EntitySet.
         *
         * @param {jabberwerx.Entity} entity The entity to unregister.
         * @returns {Boolean} <tt>true</tt> if the EntitySet's data was
         *          changed by this call.
         */
        unregister: function(entity) {
            var present = (this.entity(entity.jid, entity.node) !== undefined);
            this._removeFromMap(entity);
            if (present) {
                this.event("entityRemoved").trigger(entity);
            }

            return present;
        },

        /**
         * @private
         */
         _renameEntity: function(entity, njid, nnode) {
            var ojid = entity.jid;
            var onode = entity.node;
            this._removeFromMap(entity);

            if (njid) {
                njid = jabberwerx.JID.asJID(njid);
            } else {
                njid = undefined;
            }
            entity.jid = njid;
            if (nnode) {
                nnode = String(nnode);
            } else {
                nnode = undefined;
            }
            entity.node = nnode;
            this._updateToMap(entity);

            var data = {
                entity: entity,
                jid: ojid,
                node: nnode
            };
            this.event("entityRenamed").trigger(data);
         },

        /**
         * Visits each entity in this EntitySet. The given function is executed
         * as op(entity). For each execution of &lt;op&gt;, the sole argument
         * is the current entity. The given function can return false to cancel the iteration.
         *
         * @param {function} op The function called for each entity
         * @param {Object} [entityClass=jabberwerx.Entity] The class of entity to filter
         */
        each: function(op, entityClass) {
            if (!jabberwerx.$.isFunction(op)) {
                throw new TypeError('operator must be a function');
            }

            var     that = this;

            jabberwerx.$.each(this._map, function() {
                var     retcode;

                if (this instanceof (entityClass || jabberwerx.Entity)) {
                    retcode = op(this);
                }

                return (retcode != false);
            });
        },

        /**
         * Returns an array of the entities registered on this EntitySet.
         * @returns {jabberwerx.Entity[]} An array of the entities registered on this EntitySet
         */
        toArray: function() {
            var     arr = [];

            this.each(function(entity) {
                arr.push(entity);
            });

            return arr;
        },

        /**
         * <p>Gets a set of all the groups to which the entities in this entity set belong. The
         * contents of the group are unique (i.e. no copies of group names within the array).</p>
         * @returns {String[]} A string array of the group names
         */
        getAllGroups: function() {
            var groups = [];
            this.each(function(entity) {
                jabberwerx.$.merge(groups, entity.getGroups());
            });
            return jabberwerx.unique(groups);
        },

        /**
         * The map of keys (jid/node) to entities
         *
         * @private
         */
        _map: {},

        /**
         * Updates the map of entities to include the given entity.
         */
        _updateToMap: function (ent) {
            var key = __jwesAsKey(ent.jid, ent.node);
            ent._mapKey = key;
            this._map[key] = ent;
        },
        _removeFromMap: function(ent) {
            delete this._map[__jwesAsKey(ent.jid, ent.node)];
        },

        /**
         * @private # of batch starts this set has received. batch reference count, keep
         * batching until we receive expected batch end.
         */
        _batchCount: 0,
        /**
         * @private
         */
        _batchQueue: [],

        /**
         * Indicates that a batch process is starting. This method increments
         * an internal counter of batch processing requests. If there are no
         * other batch processing requests pending, this method triggers a
         * "batchUpdateStarted" event.
         *
         * @returns {Boolean} <tt>true</tt> if a batch is already in
         *          progress prior to this call
         */
        startBatch: function() {
            var count = this._batchCount;

            this._batchCount++;
            if (count == 0) {
                this._enableBatchTriggers(true);
                this._batchQueue = [];
                this.event("batchUpdateStarted").trigger();
            }

            return (count != 0);
        },
        /**
         * Indicates that a batch process is ending. This method decrements
         * an internal counter of batch processing requests. If this call
         * ends all other batch processing requests, this method triggers a
         * "batchUpdatedEnded" event and passes it an array of
         * {event name, event data} pairs as its data.
         *
         * ClientEntityCache will batch the following events:
         * entityCreated, entityDestroyed, entityAdded, entityRemoved,
         * entityRenamed and entityUpdated.
         *
         * @returns {Boolean} <tt>true</tt> if a batch is still in
         *          progress after this call.
         */
        endBatch: function() {
            var running = true;

            switch (this._batchCount) {
                case 0:
                    running = false;
                    break;
                 case 1:
                    running = false;
                    this._enableBatchTriggers(false);

                    var bq = this._batchQueue;
                    this._batchQueue = [];
                    this.event("batchUpdateEnded").trigger(bq);
                    //fall through
                default:
                    this._batchCount--;
                    break;
            }

            return running;
        },

        /**
         * @private data manipulation before adding to the queue
         */
        _addBatchedEvent: function(notifier, edata) {
            this._batchQueue.push({name: notifier.name, data: edata});
        },
        /**
         * @private
         * override interesting entityset event
         *  notifier's trigger method so that every trigger call from
         *  anywhere will be caught.
         *
         *  This function overrides the trigger method of all
         *  EntitySet events except batch related ones. Also used
         *  to clear (disable) the override.
         *
         *  triggers are overriden when batches start and cleared
         *  when the batch stops.
         */
        _enableBatchTriggers: function(enable) {
            var that = this;
            //walk each EntitySet event and modify its trigger method
            jabberwerx.$.each(
                ["entityCreated", "entityDestroyed", "entityRenamed",
                 "entityUpdated", "entityAdded", "entityRemoved"],
                function() {
                    var notifier = that.event(this);
                    //disable as needed
                    if (!enable && notifier._superTrigger) {
                        notifier.trigger = notifier._superTrigger;
                        delete notifier._superTrigger;
                    //enable the override if it does not already exist.
                    } else if (enable && !notifier._superTrigger) {
                        notifier._superTrigger = notifier.trigger;
                        //Override of notifier.trigger, calls the original
                        //(super) trigger as needed. returns false if not
                        //firing original trigger, else returns the
                        //original trigger result.
                        notifier.trigger = function(data) {
                            that._addBatchedEvent(notifier, data);
                            return (!that.suppressBatchedEvents
                                    && notifier._superTrigger.apply(notifier, arguments));
                        }
                    }
            });
        },

        /**
         * Should EntitySet events not be fired when running a batch? The
         * default behavior (false) is to add the EntitySet event to the
         * list of events passed through the batchUpdateEnded event AND
         * fire the event normally as well.
         *
         * This should only be set to true (do not fire events normally) if
         * your application only has batch aware EntitySet listeners.
         */
        suppressBatchedEvents: false
    }, 'jabberwerx.EntitySet');

    /**
     * <p>Error when attempting to add an entity already contained by an EntitySet.</p>
     *
     * @constructs  jabberwerx.EntitySet.EntityAlreadyExistsError
     * @extends     jabberwerx.util.Error
     */
    jabberwerx.EntitySet.EntityAlreadyExistsError = jabberwerx.util.Error.extend('That JID is already taken!.');
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/TemporaryEntity.js*/
/**
 * filename:        TemporaryEntity.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.TemporaryEntity = jabberwerx.Entity.extend(/** @lends jabberwerx.TemporaryEntity.prototype */ {
        /**
         * @class
         * <p>An empty extension of jabberwerx.Entity. Used when storing presence status for user's who
         * would otherwise not be in the entity set.</p>
         *
         *
         * @description
         * <p>An empty extension of jabberwerx.Entity</p>
         * @param   {String|jabberwerx.JID} [jid] The identifying JID
         * @param   {jabberwerx.Controller|jabberwerx.EntitySet} [cache] The
         *          controller or cache for this entity
         * @extends jabberwerx.Entity
         * @constructs jabberwerx.TemporaryEntity
         * @minimal
         */
        init: function(jid, cache) {
        this._super({jid: jid}, cache);
        }
    }, 'jabberwerx.TemporaryEntity');
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Stanza.js*/
/**
 * filename:        Stanza.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx){
    /** @private */
    jabberwerx.Stanza = jabberwerx.JWModel.extend(/** @lends jabberwerx.Stanza.prototype */{
        /**
         * @class
         * <p>A representation of an XMPP stanza.</p>
         *
         * @description
         * <p>Creates a new Stanza with the given root element or root name.</p>
         *
         * @param   {Element|String} root The element name of the stanza
         * @throws  {TypeError} If {root} is not a valid Element or String
         * @constructs jabberwerx.Stanza
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function(root) {
            this._super();

            var builder = new jabberwerx.NodeBuilder();
            if (jabberwerx.isElement(root)) {
                builder = builder.node(root);
            } else if (typeof(root) == "string") {
                // If root does not contain a namespace, assume "{jabber:client}"
                if (!(/^\{[^\}]*\}/.test(root))) {
                    root = "{jabber:client}" + root;
                }
                builder = builder.element(root);
            } else {
                throw new TypeError("root must be an element or expanded-name");
            }
            this._DOM = builder.data;

            // Check for timestamp and populate date variable accordinaly if present
            var date = new Date();
            var dateString = jabberwerx.$(builder.data).
                  find("delay[xmlns='urn:xmpp:delay'][stamp]").
                  attr("stamp");
            if (!dateString) {
                dateString = jabberwerx.$(builder.data).
                    find("x[xmlns='jabber:x:delay'][stamp]").
                    attr("stamp");
            }
            if (dateString) {
                try {
                    date = jabberwerx.parseTimestamp(dateString);
                } catch (ex) {
                    //DEBUG-BEGIN
                    jabberwerx.util.debug.log("could not parse delay: " + ex);
                    //DEBUG-END
                }
            }
            this.timestamp = date;
        },

        /**
         * <p>Retrieves the XML element representing this Stanza.</p>
         *
         * @returns  {Element} The Stanza's element
         */
        getNode: function() {
            return this._DOM;
        },
        /**
         * <p>Retrieves the document that owns this Stanza's XML element.</p>
         *
         * @returns  {Document} The owning document for the Stanza's element
         */
        getDoc: function() {
            return this.getNode().ownerDocument;
        },
        /**
         * <p>Generates the XML string representation of this Stanza.</p>
         *
         * @returns {String} The XML
         */
        xml: function() {
            return jabberwerx.util.serializeXML(this._DOM);
        },
        /**
         * <p>Retrieves the stanza-type for this Stanza. This is equivalent to
         * retrieving the node name from {@link #getNode}.</p>
         *
         * @returns  {String} The type of stanza (e.g. "message")
         */
        pType: function() {
            return this.getNode().nodeName;
        },

        /**
         * @private
         */
        _getAttrValue: function(name) {
            return this.getNode().getAttribute(name);
        },
        /**
         * @private
         */
        _setAttrValue: function(name, val) {
            if (val === undefined || val === null) {
                this.getNode().removeAttribute(name);
            } else {
                // allows for an empty attribute (defined with no value)
                this.getNode().setAttribute(name, val);
            }
        },

        /**
         * @private
         * get text from matching child nodes. name may be expanded name
         */
        _getChildText: function(name) {
            var nnode = new jabberwerx.NodeBuilder(name).data;
            var nodens = (nnode.namespaceURI) ?
                            nnode.namespaceURI : this.getNode().namespaceURI;
            var matches = jabberwerx.$(this.getNode()).children(nnode.nodeName).
                            map(function (idx, child) {
                                return child.namespaceURI==nodens ? child:null;
                            });
            return matches.length ? jabberwerx.$(matches[0]).text() : null;
        },
        /**
         * @private
         * <p>Changes or removes the child lement text for the given name.</p>
         *
         * @param   {String} name The name of the child element
         * @param   {String} [val] The new value for {name}
         */
        _setChildText: function(name, val) {
            var n = jabberwerx.$(this.getNode()).children(name);
            if (val === undefined || val === null) {
                n.remove();
            } else {
                if (!n.length) {
                    n = jabberwerx.$(new jabberwerx.NodeBuilder(this.getNode()).
                        element(name).
                        data);
                }
                n.text(val);
            }
        },

        /**
         * <p>Retrieves the type for this Stanza. This is equivalent to
         * retrieving the "type" attribute from {@link #getNode}.</p>
         *
         * @returns  {String} The type
         */
        getType: function() {
            return this._getAttrValue("type");
        },
        /**
         * <p>Changes or removes the type for this Stanza.</p>
         *
         * <p>If {type} is "", undefined, or null, any current value is
         * removed.</p>
         *
         * @param   {String} [type] The new type
         */
        setType: function(type) {
            this._setAttrValue("type", type || undefined);
        },

        /**
         * <p>Retrieves the ID for this Stanza.</p>
         *
         * @return  {String} The ID
         */
        getID: function() {
            return this._getAttrValue("id");
        },
        /**
         * <p>Changes or removes the ID for this Stanza.</p>
         *
         * <p>If {id} is "", undefined, or null, any current value is
         * removed.</p>
         *
         * @param   {String} [id] The new ID
         */
        setID: function(id) {
            this._setAttrValue("id", id || undefined);
        },

        /**
         * <p>Retrieves the "from" address for this Stanza.</p>
         *
         * @returns  {String} The address this Stanza is from
         */
        getFrom: function() {
            return this._getAttrValue("from") || null;
        },
        /**
         * <p>Retrieves the "from" address for this Stanza as a JID.
         * This method will attempt to convert the "from" address
         * string into a JID, or return <tt>null</tt> if unable to.</p>
         *
         * @returns  {jabberwerx.JID} The JID this Stanza is from
         */
        getFromJID: function() {
            var addr = this.getFrom();

            if (addr) {
                try {
                    addr = jabberwerx.JID.asJID(addr);
                } catch (ex) {
                    //DEBUG-BEGIN
                    jabberwerx.util.debug.log("could not parse 'from' address: " + ex);
                    //DEBUG-END
                    addr = null;
                }
            }

            return addr;
        },
        /**
         * <p>Changes or removes the "from" address for this Stanza.</p>
         *
         * @param   {String|jabberwerx.JID} [addr] The new from address
         */
        setFrom: function(addr) {
            addr = (addr) ?
                   jabberwerx.JID.asJID(addr) :
                   undefined;

            this._setAttrValue("from", addr);
        },

        /**
         * <p>Retrieves the "to" address for this Stanza.</p>
         *
         * @returns  {String} The address this Stanza is to
         */
        getTo: function() {
            return this._getAttrValue("to") || null;
        },
        /**
         * <p>Retrieves the "to" address for this Stanza as a JID.
         * This method will attempt to convert the "to" address
         * string into a JID, or return <tt>null</tt> if unable to.</p>
         *
         * @returns  {jabberwerx.JID} The JID this Stanza is to
         */
        getToJID: function() {
            var addr = this.getTo();

            if (addr) {
                try {
                    addr = jabberwerx.JID.asJID(addr);
                } catch (ex) {
                    //DEBUG-BEGIN
                    jabberwerx.util.debug.log("could not parse 'to' address: " + ex);
                    //DEBUG-END
                    addr = null;
                }
            }

            return addr;
        },
        /**
         * <p>Changes or removes the "to" address for this Stanza.</p>
         *
         * @param   {String|jabberwerx.JID} [addr] The new to address
         */
        setTo: function(addr) {
            addr = (addr) ?
                   jabberwerx.JID.asJID(addr) :
                   undefined;

            this._setAttrValue("to", addr);
        },

        /**
         * <p>Determines if this Stanza is reporting an error.</p>
         *
         * @returns  {Boolean} <tt>true</tt> if this is a Stanza of type error
         */
        isError: function() {
            return this.getType() == "error";
        },
        /**
         * <p>Returns an ErrorInfo object containing the error information
         * of this stanza if there is any. Otherwise it returns null.</p>
         * @returns {jabberwerx.Stanza.ErrorInfo} The ErrorInfo object
         */
        getErrorInfo: function() {
            var err = jabberwerx.$(this.getNode()).children("error");

            if (this.isError() && err.length) {
                err = jabberwerx.Stanza.ErrorInfo.createWithNode(err.get(0));
            } else {
                err = null;
            }

            return err;
        },

        /**
         * Creates a duplicate of this stanza. This method performs a deep
         * copy of the DOM.
         *
         * @returns  {jabberwerx.Stanza} The cloned stanza
         */
        clone: function() {
            var cpy = jabberwerx.Stanza.createWithNode(this.getNode());
            cpy.timestamp = this.timestamp;

            return cpy;
        },
        /**
         * Creates a stanza with the addresses reversed. This method
         * clones this Stanza, sets the "to" address to be the original
         * "from" address, then (optionally) sets the "from" address to be
         * the original "to" address.
         *
         * @param   {Boolean} [include_from] <tt>true</tt> if the new
         *          stanza should include a "from" address (default is
         *          <tt>false</tt>)
         * @returns  {jabberwerx.Stanza} The cloned stanza, with addresses
         *          swapped.
         */
        swap: function(include_from) {
            var cpy = this.clone();
            cpy.setTo(this.getFromJID());
            cpy.setFrom(include_from ? this.getToJID() : null);

            return cpy;
        },
        /**
         * <p>Creates an error stanza based on this Stanza. This method
         * calls {@link #swap}, sets the type to "error", and appends an
         * &lt;error/&gt; element with the data from {err}.</p>
         *
         * @param   {jabberwerx.Stanza.ErrorInfo} err The error information
         * @return  {jabberwerx.Stanza} The error stanza
         * @throws  {TypeError} If {err} is not a ErrorInfo
         */
        errorReply: function(err) {
            if (!(err && err instanceof jabberwerx.Stanza.ErrorInfo)) {
                throw new TypeError("err must be an ErrorInfo");
            }

            var retval = this.swap();
            retval.setType("error");

            // TODO: better namespace handling for node??
            var builder = new jabberwerx.NodeBuilder(retval.getNode()).
                    xml(err.getNode().xml);

            return retval;
        },

        /**
         * Called before this Stanza is serialized for persistence. This
         * method saves a string representation of the XMPP stanza and
         * converts the timestamp from a Date object into a number.
         */
        willBeSerialized: function() {
            this.timestamp = this.timestamp.getTime();
            this._serializedXML = this._DOM.xml;
            delete this._DOM;
        },
        /**
         * Called after this Stanza is deserialized from persistence. This
         * method rebuilds the DOM structure from the saved XML string and
         * converts the timestamp from a number into a Date object.
         */
        wasUnserialized: function() {
            if (this._serializedXML && this._serializedXML.length) {
                this._DOM = jabberwerx.util.unserializeXML(this._serializedXML);
                delete this._serializedXML;
            }

            this.timestamp = this.timestamp ? new Date(this.timestamp) : new Date();
        },

        /**
         * The timestamp of this Stanza. If this stanza contains a
         * "{urn:xmpp:time}delay" or "{jabber:x:delay}x" child element, this
         * value reflects the date specified by that element. Otherwise, it is
         * the timestamp at which this stanza was created.
         *
         * @type    Date
         */
        timestamp: null,

        /**
         * @private
         */
        _DOM: null
    }, "jabberwerx.Stanza");
    /**
     * Generate a secure stanza ID
     *
     * Result will be a string suitable for any stanza id attribute.
     * Default implementation will return a b64 encoded sha1 hashed sufficiently
     * randomized value.
     *
     * @returns {String} The 'secure' stanza Identifier.
     */
    jabberwerx.Stanza.generateID = function() {
        return jabberwerx.util.crypto.b64_sha1(jabberwerx.util.crypto.generateUUID());
    };

    jabberwerx.Stanza.ErrorInfo = jabberwerx.JWModel.extend(/** @lends jabberwerx.Stanza.ErrorInfo.prototype */{
        /**
         * @class
         * <p>Representation of stanza error information.</p>
         *
         * @description
         * <p>Creates a new ErrorInfo with the given information.</p>
         *
         * @param   {String} [type] The error type ("cancel", "auth", etc)
         * @param   {String} [cond] The error condition
         * @param   {String} [text] The error text description
         * @constructs jabberwerx.Stanza.ErrorInfo
         * @extends JWModel
         * @minimal
         */
        init: function(type, cond, text) {
            this._super();

            this.type = type || "wait";
            this.condition = cond || "{urn:ietf:params:xml:ns:xmpp-stanzas}internal-server-error";
            this.text = text || "";

            // IE work-around
            this.toString = this._toErrString;
        },

        /**
         * <p>Retrieves the element for this ErrorInfo. The returned element
         * is as follows:</p>
         *
         * <pre class="code">
         *  &lt;error type="{type}"&gt;
         *      &lt;{condition-local-name} xmlns="urn:ietf:params>xml:ns:xmpp-stanzas"/&gt;
         *      &lt;text xmlns="urn:ietf:params>xml:ns:xmpp-stanzas"&gt;{text}&lt;/text&gt;
         *  &lt;/error&gt;
         * </pre>
         *
         * @returns  {Element} The DOM representation
         */
        getNode: function() {
            var builder = new jabberwerx.NodeBuilder("error");

            builder.attribute("type", this.type);
            builder.element(this.condition);
            if (this.text) {
                builder.element("{urn:ietf:params:xml:ns:xmpp-stanzas}text").
                        text(this.text);
            }

            return builder.data;
        },

        /**
         * <p>Called after this object is rehydrated. This method sets the toString
         * method as expected.</p>
         */
        wasUnserialized: function() {
            // IE work-around
            this.toString = this._toErrString;
        },

        /**
         * @private
         */
        _toErrString: function() {
            return this.condition;
        },

        /**
         * <p>The type of error info.</p>
         *
         * @type    String
         */
        type: "",
        /**
         * <p>The condition of the error info. This is the expanded-name of
         * the predefined condition for the ErrorInfo.</p>
         *
         * @type    String
         */
        condition: "",
        /**
         * <p>The optional text description for the error info.</p>
         *
         * @type    String
         */
        text: ""
    }, "jabberwerx.Stanza.ErrorInfo");
    /**
     * <p>Creates an ErrorInfo based on the given node.</p>
     *
     * @param   {Element} node The XML &lt;error/&gt;
     * @return  {jabberwerx.Stanza.ErrorInfo} The ErrorInfo
     * @throws  {TypeError} If {node} is not an element
     */
    jabberwerx.Stanza.ErrorInfo.createWithNode = function(node) {
        if (!jabberwerx.isElement(node)) {
            throw new TypeError("node must be an Element");
        }
        node = jabberwerx.$(node);
        var type = node.attr("type");
        var cond = node.
                children("[xmlns='urn:ietf:params:xml:ns:xmpp-stanzas']:not(text)").
                map(function() {
                    return "{urn:ietf:params:xml:ns:xmpp-stanzas}" + this.nodeName;
                }).get(0);
        var text = node.
                children("text[xmlns='urn:ietf:params:xml:ns:xmpp-stanzas']").
                text();

        // TODO: search for known errors first?
        return new jabberwerx.Stanza.ErrorInfo(type, cond, text);
    };

    /**
     * <p>ErrorInfo for a bad request error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_BAD_REQUEST = new jabberwerx.Stanza.ErrorInfo(
            "modify",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}bad-request");
    /**
     * <p>ErrorInfo for a conflict error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_CONFLICT = new jabberwerx.Stanza.ErrorInfo(
            "modify",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}conflict");
    /**
     * <p>ErrorInfo for a feature not implemented error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_FEATURE_NOT_IMPLEMENTED = new jabberwerx.Stanza.ErrorInfo(
            "cancel",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}feature-not-implemented");
    /**
     * <p>ErrorInfo for a forbidden error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_FORBIDDEN = new jabberwerx.Stanza.ErrorInfo(
            "auth",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}forbidden");
    /**
     * <p>ErrorInfo for an internal server error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_INTERNAL_SERVER_ERROR = new jabberwerx.Stanza.ErrorInfo(
            "wait",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}internal-server-error");
    /**
     * <p>ErrorInfo for a non-existent item.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_ITEM_NOT_FOUND = new jabberwerx.Stanza.ErrorInfo(
            "cancel",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}item-not-found");
    /**
     * <p>ErrorInfo for a malformed JID error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_JID_MALFORMED = new jabberwerx.Stanza.ErrorInfo(
            "modify",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}jid-malformed");
    /**
     * <p>ErrorInfo for a not acceptable error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_NOT_ACCEPTABLE = new jabberwerx.Stanza.ErrorInfo(
            "modify",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}not-acceptable");
    /**
     * <p>ErrorInfo for a not allowed error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_NOT_ALLOWED = new jabberwerx.Stanza.ErrorInfo(
            "cancel",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}not-allowed");
    /**
     * <p>ErrorInfo for a not authorized error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_NOT_AUTHORIZED = new jabberwerx.Stanza.ErrorInfo(
            "auth",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}not-authorized");
    /**
     * <p>ErrorInfo for a service unavailable error.</p>
     *
     * @type    jabberwerx.Stanza.ErrorInfo
     */
    jabberwerx.Stanza.ERR_SERVICE_UNAVAILABLE = new jabberwerx.Stanza.ErrorInfo(
            "wait",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}service-unavailable");

    /**
     * <p>ErrorInfo for a remote server timeout error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stanza.ERR_REMOTE_SERVER_TIMEOUT = new jabberwerx.Stanza.ErrorInfo(
            "wait",
            "{urn:ietf:params:xml:ns:xmpp-stanzas}remote-server-timeout");

    /**
     * Factory method for creating a stanza from an XML node.
     *
     * @static
     * @param   {Element} node An XML node.
     * @return  {jabberwerx.Stanza} The Stanza object wrapping the given
     *          node
     */
    jabberwerx.Stanza.createWithNode = function(node) {
        if (!jabberwerx.isElement(node)) {
            throw new TypeError("node must be an element");
        }

        var stanza;
        switch(node.nodeName) {
            case "iq":
                stanza = new jabberwerx.IQ(node);
                break;
            case "message":
                stanza = new jabberwerx.Message(node);
                break;
            case "presence":
                stanza = new jabberwerx.Presence(node);
                break;
            default:
                stanza = new jabberwerx.Stanza(node);
                break;
        }

        return stanza;
    };

    jabberwerx.IQ = jabberwerx.Stanza.extend(/** @lends jabberwerx.IQ.prototype */ {
        /**
         * @class
         * <p>Represents an &lt;iq/&gt; stanza.</p>
         *
         * @description
         * <p>Creates a new IQ object.</p>
         *
         * @param   {Element} [packet] The &lt;iq/&gt; element, or <tt>null</tt>
         *          for an empty IQ
         * @throws  {TypeError} If {packet} is not an &lt;iq/&gt; element
         * @constructs jabberwerx.IQ
         * @extends jabberwerx.Stanza
         * @minimal
         */
        init: function(packet) {
            if (packet) {
                if (!jabberwerx.isElement(packet)) {
                    throw new TypeError("packet must be an &lt;iq/&gt; Element");
                }
                if (packet.nodeName != "iq") {
                    throw new TypeError("packet must be an &lt;iq/&gt; Element");
                }
            }
            this._super(packet || "{jabber:client}iq");
        },

        /**
         * <p>Retrieves the payload for this IQ.</p>
         *
         * @returns  {Element} The payload for this IQ, or {null} if none
         */
        getQuery: function() {
            return jabberwerx.$(this.getNode()).children(":not(error)").get(0);
        },
        /**
         * <p>Changes or removes the payload for this IQ.</p>
         *
         * @returns  {Element} The payload for this IQ, or {null} if none
         * @throws {TypeError} If {payload} is not an Element
         */
        setQuery: function(payload) {
            if (payload && !jabberwerx.isElement(payload)) {
                throw new TypeError("Node must be an element");
            }

            var q = jabberwerx.$(this.getNode()).children(":not(error)");
            q.remove();

            if (payload) {
                new jabberwerx.NodeBuilder(this.getNode()).node(payload);
            }
        },
        /**
         * <p>Generates a reply IQ from this IQ. This method clones this
         * IQ and sets the type to "result". If {payload} is specified,
         * it is added, otherwise the IQ is empty.</p>
         *
         * @param   {Element|String} payload The payload for this IQ
         * @return  {jabberwerx.IQ} The reply for this IQ
         * @throws  {TypeError} If {payload} is not an XML Element
         */
        reply: function(payload) {
            var retval = this.swap();

            try {
                jabberwerx.$(retval.getNode()).empty();
            } catch (ex) {
                var n = retval.getNode();
                for (var idx = 0; idx < n.childNodes.length; idx++) {
                    n.removeChild(n.childNodes[idx]);
                }
            }
            if (payload) {
                var builder = new jabberwerx.NodeBuilder(retval.getNode());

                if (jabberwerx.isElement(payload)) {
                    builder.node(payload);
                } else if (typeof(payload) == "string") {
                    builder.xml(payload);
                } else {
                    throw new TypeError("payload must be an Element or XML representation of an Element");
                }
            }
            retval.setType("result");

            return retval;
        }
    }, "jabberwerx.IQ");

    jabberwerx.Message = jabberwerx.Stanza.extend(/** @lends jabberwerx.Message.prototype */ {
        /**
         * @class
         * <p>Represents a &lt;message/&gt; stanza.</p>
         *
         * @description
         * <p>Creates a new Message object.</p>
         *
         * @param   {Element} [packet] The &lt;message/&gt; element, or
         *          <tt>null</tt> for an empty Message
         * @throws  {TypeError} If {packet} is not a &lt;message/&gt; element
         * @constructs jabberwerx.Message
         * @extends jabberwerx.Stanza
         * @minimal
         */
        init: function(packet) {
            if (packet) {
                if (!jabberwerx.isElement(packet)) {
                    throw new TypeError("Must be a <message/> element");
                }
                if (packet.nodeName != "message") {
                    throw new TypeError("Must be a <message/> element");
                }
            }

            this._super(packet || "{jabber:client}message");
        },

        /**
         * <p>Retrieves the plaintext body for this Message.</p>
         *
         * @returns  {String} The body
         */
        getBody: function() {
            return this._getChildText("body");
        },
        /**
         * <p>Changes or removes the body for this Message.</p>
         * <p>Changes to the plaintext body will automatically clear the
         *  XHTML-IM body (XEP-71 8#2). In practice <tt>setBody</tt> and
         *  {@link #setHTML} are mutually exclusively, using both
         *  within the same message is not recommended.</p>
         * @param   {String} [body] The new message body
         */
        setBody: function(body) {
            this.setHTML();
            this._setChildText("body", body || undefined);
        },

        /**
         * <p>Retrieves the XHTML-IM body element for this Message.
         *  The first body contained within an html element (xep-71 namespaces) or null
         *   if the element does not exist. Returned element will be cleaned using xep-71
         *   Recommended  Profile. See {@link jabberwerx.xhtmlim#.sanitize}.
         *  NOTE the entire body element is returned, not just its contents. </p>
         * @returns  {DOM} The XHTML body element or null
         */
        getHTML: function() {
            var ret = jabberwerx.$(this.getNode()).find("html[xmlns='http://jabber.org/protocol/xhtml-im']>body[xmlns='http://www.w3.org/1999/xhtml']:first");
            if (ret.length && !this._isSanitized) { //most likely a received message
                this.setHTML(ret.children().get()); //setHTML will sanitize and set state as needed.
                return this.getHTML();
            }
            return ret.length ? ret.get(0) : null;
        },
        /**
         * <p>Changes or removes both the HTML and plaintext bodies for this Message.</p>
         * <p>XHTML-IM and plaintext must have the same text value (xep-71 8#2). See {@link #setBody}.
         *  HTML is cleaned using xep-71 Recommended Profile (See {@link jabberwerx.xhtmlim#.sanitize}).
         *  <tt>html</tt> may be a string that will parse into a root tag, a single root HTML tag or an array of
         *  HTML tags (must not be body elements). <tt>setHTML</tt> adds a body wrapper as needed.
         *  If <tt>html</tt> is <tt>null</tt> the XHTML-IM html element is removed and the plaintext body is cleared.</p>
         * @param   {DOM|Array|String} [html] The new message
         * @throws {TypeError} If html is defined and not a parsable string,  DOM or a non empty Array of DOM
         */
        setHTML: function(html) {
            var htmlNode;
            if (html && !jabberwerx.util.isString(html) && !jabberwerx.isElement(html) &&
               (!jabberwerx.$.isArray(html) || !html.length)) {
                throw new TypeError("html must be a string, DOM or an array");
            }
            this._isSanitized = false;
            var htmlNode = jabberwerx.$(this.getNode()).find("html[xmlns='http://jabber.org/protocol/xhtml-im']");
            if (htmlNode) {
                htmlNode.remove();
            }

            this._setChildText("body", null);
            if (html) {
                htmlNode = html;
                if (jabberwerx.util.isString(html)) {
                    try {
                        htmlNode = jabberwerx.util.unserializeXML(html);
                    } catch (ex) {
                        jabberwerx.util.debug.log("setHTML could not parse: '" + html + "'");
                        throw ex;
                    }
                }
                if (jabberwerx.$.isArray(html) || htmlNode.nodeName != "body")
                {
                    var newBodyBuilder = new jabberwerx.NodeBuilder("{http://www.w3.org/1999/xhtml}body");
                    if (jabberwerx.$.isArray(html)) {
                        jabberwerx.$.each(html, function (index, item) {
                            newBodyBuilder.node(item);
                        });
                    } else if (jabberwerx.util.isString(html)) {
                        newBodyBuilder.xml(html); //NodeBuilder will handle NS correctly
                    } else {
                        newBodyBuilder.node(html);
                    }
                    html = newBodyBuilder.data;
                }
                jabberwerx.xhtmlim.sanitize(html);
                html = new jabberwerx.NodeBuilder("{http://jabber.org/protocol/xhtml-im}html").node(html).parent.data;
                this._setChildText("body", jabberwerx.$(html).text());
                jabberwerx.$(this.getNode()).append(html);
                this._isSanitized = true;
            }
        },

        /**
         * <p>Retrieves the subject for this Message.</p>
         *
         * @returns  {String} The subject
         */
        getSubject: function() {
            return this._getChildText("subject");
        },
        /**
         * <p>Changes or removes the subject for this Message.</p>
         *
         * @param   {String} [subject] The new message subject
         */
        setSubject: function(subject) {
            this._setChildText("subject", subject || undefined);
        },

        /**
         * <p>Retrieves the thread for this Message.</p>
         *
         * @returns  {String} The thread
         */
        getThread: function() {
            return this._getChildText("thread") || null;
        },
        /**
         * <p>Changes or removes the thread for this Message.</p>
         *
         * @param   {String} [thread] The new message thread
         */
        setThread: function(thread) {
            this._setChildText("thread", thread || undefined);
        },

        /**
         * @private
         * xhtml has been santized flag
         * @type  {Boolean}
         */
        _isSanitized: false
    }, "jabberwerx.Message");

    /**
     * Takes a String or an Element and substitutes in the user name, nickname or handle of the sender, where the string begins with '/me '.<br>
     * Example: translate('/me laughs', 'foo') returns ['* foo laughs']
     * @param   {String|Element} content The message content.
     * @param   {String} displayName The displayName of the sender
     * @return {jQueryCollection|null} The translated Message if content contained a XEP-0245 '/me ' command, otherwise null
     * @throws {jabberwerx.Message.InvalidContentFormat} if content is not a string or a Element.
     */
    jabberwerx.Message.translate = function(content, displayName) {
        var xep0245Found = false;
        var textNodeFound = false;
        var translatedContent = null;

        var findTextNodes = function(element, displayName) {
            if (!xep0245Found && !textNodeFound) {
                if (jabberwerx.isText(element)) {
                    var replace = translateSlashMe(jabberwerx.$(element).text(), displayName);
                    if (xep0245Found) {
                        jabberwerx.$(element).replaceWith(replace);
                    } else {
                        textNodeFound = true;
                    }
                } else if (element.hasChildNodes()) {
                    for (var i = 0; i < element.childNodes.length; i++) {
                        findTextNodes(element.childNodes[i], displayName);
                    }
                }
            }
        };


        var translateSlashMe = function(rawText, displayName) {
            var slashMe = "/me ";
            if (rawText.substring(0,slashMe.length).toLowerCase() == slashMe) {
                xep0245Found = true;
                return ("* " + displayName + " " + rawText.substring(slashMe.length));
            }
            return rawText;
        };

        if (typeof content == "string") {
            content = translateSlashMe(content, displayName);
        } else if (jabberwerx.isElement(content)) {
            // traverse nodes looking for text nodes
            for (var i = 0; i < content.childNodes.length; i++) {
                if (!xep0245Found && !textNodeFound) {
                    findTextNodes(content.childNodes[i], displayName);
                } else {
                    break;
                }
            }
        } else {
           throw new jabberwerx.Message.InvalidContentFormat();
        }

        if (xep0245Found) {
            translatedContent = content;
        }
        return translatedContent;
    };
    /**
     * @class jabberwerx.Message.InvalidContentFormat
     * <p>Error to indicate the content is not type of string or a jQuery object.</p>
     * @description
     * <p>Creates a new InvalidContentFormat with the given message.</p>
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Message.InvalidContentFormat = jabberwerx.util.Error.extend('The content parameter must be of type string or a jQuery object.');

    jabberwerx.Presence = jabberwerx.Stanza.extend(/** @lends jabberwerx.Presence.prototype */ {
        /**
         * @class
         * <p>Represents a &lt;presence/&gt; stanza.</p>
         *
         * @description
         * <p>Creates a new Presence object.</p>
         *
         * @param   {Element} [packet] The &lt;presence/&gt; element, or
         *          <tt>null</tt> for an empty Presence
         * @throws  {TypeError} If {packet} is not an &lt;presence/&gt; element
         * @constructs jabberwerx.Presence
         * @extends jabberwerx.Stanza
         * @minimal
         */
        init: function(packet) {
            if (packet) {
                if (!jabberwerx.isElement(packet)) {
                    throw new TypeError("packet must be a &lt;presence/&gt; Element");
                }
                if (packet.nodeName != "presence") {
                    throw new TypeError("packet must be a &lt;presence/&gt; Element");
                }
            }
            this._super(packet || "{jabber:client}presence");
        },

        /**
         * <p>Retrieves the priority for this Presence. This method
         * returns the integer value for the &lt;priority/&gt; child
         * element's text content, or 0 if none is available.</p>
         *
         * @returns  {Number} The priority
         */
        getPriority: function() {
            var pri = this._getChildText("priority");
            pri = (pri) ? parseInt(pri) : 0;
            return !isNaN(pri) ? pri : 0;
        },
        /**
         * <p>Changes or removes the priority for this Presence.</p>
         *
         * @param   {Number} [pri] The new priority
         * @throws  {TypeError} If {pri} is defined and not a number.
         */
        setPriority: function(pri) {
            // NOTE: 0 evaluates to false, so need to check
            if (pri !== undefined && pri !== null && typeof(pri) != "number") {
                throw new TypeError("new priority must be a number or undefined");
            }
            this._setChildText("priority", pri);
        },

        /**
         * <p>Retrieves the show value for this Presence. This method
         * returns the text content of the &lt;show/&gt; child eleemnt,
         * or {@link #.SHOW_NORMAL} if none is available.</p>
         *
         * @returns  {String} The show value
         */
        getShow: function() {
            return this._getChildText("show") || jabberwerx.Presence.SHOW_NORMAL;
        },
        /**
         * <p>Changes or removes the show value for this Presence.</p>
         *
         * @param   {String} [show] The new show value
         * @throws  {TypeError} If {show} is defined and not one of
         *          "away", "chat", "dnd", or "xa".
         */
        setShow: function(show) {
            if (show && (show != jabberwerx.Presence.SHOW_AWAY &&
                        show != jabberwerx.Presence.SHOW_CHAT &&
                        show != jabberwerx.Presence.SHOW_DND  &&
                        show != jabberwerx.Presence.SHOW_XA)) {
                throw new TypeError("show must be undefined or one of 'away', 'chat', 'dnd', or 'xa'");
            }

            this._setChildText("show", show || undefined);
        },

        /**
         * <p>Retrieves the status value for this Presence. This method
         * returns the text content of the &lt;status/&gt; child element,
         * or <tt>null</tt> if none is available.</p>
         *
         * @returns  {String} The show value
         */
        getStatus: function() {
            return this._getChildText("status") || null;
        },
        /**
         * <p>Changes or removes the status value for this Presence.</p>
         *
         * @param   {String} [status] The new status value
         */
        setStatus: function(status) {
            this._setChildText("status", status || undefined);
        },

        /**
         * <p>Compares this Presence to the given presence object for
         * natural ordering. The order is determined via:</p>
         * <ol>
         * <li>The &lt;priority/&gt; values</li>
         * <li>The timestamps</li>
         * </ol>
         *
         * <p>A missing &lt;priority/&gt; value is equal to "0".</p>
         *
         * @param   {jabberwerx.Presence} presence Object to compare against
         * @returns  {Integer} -1, 1, or 0 if this Presence is before, after,
         *          or in the same position as {presence}
         */
        compareTo: function(presence) {
            if (!(presence && presence instanceof jabberwerx.Presence)) {
                throw new TypeError("presence must be an instanceof jabberwerx.Presence");
            }

            var p1, p2;

            p1 = this.getPriority() || 0;
            p2 = presence.getPriority() || 0;
            if (p1 > p2) {
                return 1;
            } else if (p1 < p2) {
                return -1;
            }

            p1 = this.timestamp;
            p2 = presence.timestamp;
            if (p1 > p2) {
                return 1;
            } else if (p1 < p2) {
                return -1;
            }

            return 0;
        },

        /**
         * Sets show, status and priority via a single method call
         * @param {String} [show] A status message
         * @param {String} [status] A status indicator
         * @param {Integer} [priority] A priority for this resource
         * @returns {jabberwerx.Presence} This updated presence stanza
         */
        setPresence: function(show, status, priority) {
            if (show) {
                this.setShow(show);
            }
            if (status) {
                this.setStatus(status);
            }
            if (priority !== undefined && priority !== null) {
                this.setPriority(priority);
            }
            return this;
        }
    }, "jabberwerx.Presence");

    /**
     * The "away" status.
     * @constant
     * @type String
     */
    jabberwerx.Presence.SHOW_AWAY = "away";
    /**
     * The "chat" status.
     * @constant
     * @type String
     */
    jabberwerx.Presence.SHOW_CHAT = "chat";
    /**
     * The "dnd" status.
     * @constant
     * @type String
     */
    jabberwerx.Presence.SHOW_DND = "dnd";
    /**
     * The "normal" status.
     * @constant
     * @type String
     */
    jabberwerx.Presence.SHOW_NORMAL = "";
    /**
     * The "xa" status.
     * @constant
     * @type String
     */
    jabberwerx.Presence.SHOW_XA = "xa";
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/User.js*/
/**
 * filename:        User.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.User = jabberwerx.Entity.extend(/** @lends jabberwerx.User.prototype */ {
        /**
         * @class
         * <p>The general User representation. Do not construct users by hand
         * with the new operator. See {@link jabberwerx.ClientEntityCache#localUser}.<p>
         *
         * @description
         * Creates a new User with the given JID and cache location
         *
         * @param   {String|jabberwerx.JID} jid The user's JID
         * @param   {jabberwerx.ClientEntityCache} [cache] The owning cache
         * @abstract
         * @constructs jabberwerx.User
         * @extends jabberwerx.Entity
         * @minimal
         */
        init: function(jid, cache) {
            this._super({jid: jid}, cache);
        }
    }, 'jabberwerx.User');

    /**
     * @class
     * <p>The LocalUser representation.
     *
     * @description
     * Creates a new LocalUser with the given JID and cache location
     * <p><b>NOTE:</b> This type should not be created directly </p>
     * <p>Use {@link jabberwerx.ClientEntityCache#localUser} instead.</p></p>
     * @param   {String|jabberwerx.JID} jid The user's JID
     * @param   {jabberwerx.ClientEntityCache} [cache] The owning cache
     * @constructs jabberwerx.User
     * @extends jabberwerx.Entity
     * @minimal
     */
    jabberwerx.LocalUser = jabberwerx.User.extend(/** @lends jabberwerx.LocalUser.prototype */ {
        /**
         * Retrieves the user's display name. This method simply returns the
         * node portion of the user's JID.
         *
         * @return  {String} The display name
         */
        getDisplayName: function() {
            return this._displayName || jabberwerx.JID.unescapeNode(this.jid.getNode());
        }
    }, 'jabberwerx.LocalUser');
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Server.js*/
/**
 * filename:        Server.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.Server = jabberwerx.Entity.extend(/** @lends jabberwerx.Server.prototype */{
        /**
         * @class
         * <p>Represents the server to connect a {@link jabberwerx.Client} to.</p>
         *
         * @description
         * Creates a new Server with the given domain and owning
         * cache.
         *
         * @param   {String} serverDomain The domain to connect to
         * @param   {jabberwerx.ClientEntityCache} [cache] The owning cache
         * @constructs jabberwerx.Server
         * @extends jabberwerx.Entity
         * @minimal
         */
        init: function(serverDomain, cache) {
            this._super({jid: serverDomain}, cache);
        }
    }, 'jabberwerx.Server');
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Stream.js*/
/**
 * filename:        Stream.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx) {
    /** @private */
    jabberwerx.Stream = jabberwerx.JWModel.extend(/** @lends jabberwerx.Stream.prototype */{
        /**
         * @private
         * @class
         * <p>Manages a stream of elements into and out of a server. This
         * class provides the BOSH layer implementation.</p>
         *
         * @description
         * <p>Creates a new jabberwerx.Stream.</p>
         *
         * @extends JWModel
         * @constructs jabberwerx.Stream
         */
        init: function() {
            this.applyEvent("streamOpened");
            this.applyEvent("streamClosed");
            this.applyEvent("streamElementsReceived");
            this.applyEvent("streamElementsSent");

            // initialize the queues
            this._recvQ = new jabberwerx.Stream.Queue();
            this._sendQ = new jabberwerx.Stream.Queue();
            this._xhrs = new jabberwerx.Stream.Queue();

            // setup values for all XMLHttpRequests
            this._xhrSetup = {
                cache: false,
                xhr: this.invocation("_createXHR", jabberwerx.$.ajaxSettings.xhr),
                beforeSend: this.invocation("_prepareXHR"),
                complete: this.invocation("_handleXHR"),
                contentType: "text/xml",
                dataType: "text",
                global: false,
                processData: false,
                type: "POST"
            };
        },

        /**
         * @private
         * <p>Retrieves the properties of this Stream. This method
         * returns a snapshot of the properties at the time it is called;
         * updates to the returned properties are not reflected into this
         * Stream, nor vice-versa.</p>
         *
         * <p>The specifics of the returned properties object are implemention
         * dependent.</p>
         *
         * @return  {Object} A hashtable of the current stream properties
         */
        getProperties: function() {
            return jabberwerx.$.extend(true, {}, this._boshProps);
        },

        /**
         * <p>Determines if this stream is already open.</p>
         *
         * @return  {Boolean} <tt>true</tt> if open.
         */
        isOpen: function() {
            return this._opened;
        },

        /**
         * <p>Determines if this stream is connected in a secure or trusted
         * manner.</p>
         *
         * @return  {Boolean} <tt>true</tt> If the stream is considered secure
         */
        isSecure: function() {
            return this._boshProps.secure || false;
        },

        /**
         * <p>Retrieves the domain for this stream.</p>
         *
         * @return  {String} The domain, or <tt>null</tt> if not known.
         */
        getDomain: function() {
            return this._boshProps.domain || null;
        },
        /**
         * <p>Retrieves the session ID for this stream. For BOSH,
         * this value is the "sid".</p>
         *
         * @return  {String} The current session ID, or <tt>null</tt> if not
         *          known
         */
        getSessionID: function() {
            return this._boshProps.sid || null;
        },
        /**
         * <p>Retrieves the timeout for this stream.</p>
         *
         * @return  {Number} The timeout in seconds
         */
        getTimeout: function() {
            return this._boshProps.timeout || 60;
        },

        /**
         * <p>Connects this stream to the remote endpoint. This method
         * prepares the BOSH request queue, and sends the initial
         * &lt;body/&gt;.</p>
         *
         * <p>The value of {params} is expected to be an object containing
         * the following properties:</p
         * <pre class="code">{
         *      // domain of remote service (REQUIRED)
         *      domain: "example.com",
         *      // URL to connect to remote service (OPTIONAL)
         *      httpBindingURL: "/httpbinding",
         *      // preferred connection/request timeout in seconds (OPTIONAL)
         *      timeout: 30
         * }</pre>
         *
         * @param   {Object} params The connection parameters
         * @throws  {TypeError} if {params} does not contain a valid domain
         * @throws  {jabberwerx.Stream.AlreadyOpenError} If this stream is already
         *          open
         */
        open: function(params) {
            if (this.isOpen()) {
                throw new jabberwerx.Stream.AlreadyOpenError();
            }

            // make sure we're cleared out...
            this._reset();

            // copy and validate/default
            this._boshProps = jabberwerx.$.extend({}, params || {});
            if (!this._boshProps.domain) {
                throw new TypeError("domain must be specified");
            }
            if (!this._boshProps.timeout) {
                this._boshProps.timeout = jabberwerx.Stream.DEFAULT_TIMEOUT;
            }
            if (!this._boshProps.wait) {
                this._boshProps.wait = jabberwerx.Stream.DEFAULT_WAIT;
            }

            // setup binding URL
            var url = jabberwerx.Stream.URL_PARSER.exec(this._boshProps.httpBindingURL || "");
            if (!url) {
                throw new TypeError("httpBindingURL not specified correctly");
            }

            // setup protocol
            var myProto = jabberwerx.system.getLocation().protocol;
            if (!url[1]) {
                url[1] = myProto || "";
            //IE 7,8,9 issue with CORS scheme different from served
            } else if (myProto && url[1] != myProto) {
                /* I don't want to see this message again */
                /*jabberwerx.util.debug.warn("BOSH URL has different protocol than webserver: " + url[1] + " != " + myProto);*/
            }

            // setup host and port
            if (!url[2]) {
                url[2] = jabberwerx.system.getLocation().host || "";
            }

            // setup path
            if (!url[3]) {
                url[3] = "";
            }

            this._boshProps.networkAttempts = 0;

            this._storeConnectionInfo(url[1], url[2], url[3]);
            /*DEBUG-BEGIN*/
            jabberwerx.util.debug.log("jabberwerx.Stream.open request made with httpBindingURL: " + this._boshProps.httpBindingURL + ", crosssite: " + this._boshProps.crossSite + ", secure: " + this._boshProps.secure);
            /*DEBUG-END*/
            this._boshProps.operation = "open";
            this._sendRequest();

            this._boshProps.heartbeat = jabberwerx.system.setInterval(
                    this.invocation("_heartbeat"),
                    jabberwerx.Stream.HEARTBEAT_INTERVAL);
        },

        /**
         * @private
         */
        _storeConnectionInfo: function(protocol, hostPort, resource) {
            this._boshProps.httpBindingURL = protocol + "//" +
                                             hostPort + "/" +
                                             resource;
            this._boshProps.secure = this._boshProps.secure || (protocol == "https:");
            this._boshProps.crossSite =
                        (jabberwerx.system.getLocation().protocol != protocol) ||
                        (jabberwerx.system.getLocation().host != hostPort);
        },

        /**
         * <p>Reopens this Stream. this method sends the stream restart request
         * to the server, and awaits a proper response.</p>
         *
         * <p>If the server does not immediately respond to the restart with a
         * new stream:features, his method generates a &lt;stream:features/&gt;
         * containing &lt;bind/&gt; and &lt;session/&gt;.</p>
         *
         * @throws  {jabberwerx.Stream.NotOpenError} If this Stream is not
         *          currently open.
         */
        reopen: function() {
            if (!this.isOpen()) {
                throw new jabberwerx.Stream.NotOpenError();
            }

            // do a timeout in case the server doesn't actually support
            // xmpp:restart=true
            this._boshProps.opening = jabberwerx.system.setTimeout(
                    this.invocation("_handleOpen"),
                    2000);
            // hard-coded with a reasonably acceptable delay for now
            // This timeout will be removed when all supported server
            // platforms implement XEP-206 version 1.2
            this._boshProps.operation = "reopen";
            this._sendRequest({restart: true});
        },
        /**
         * <p>Disconnects this stream from the remote endpoint. This method
         * signals to the server to terminate the HTTP session.</p>
         */
        close: function() {
            //don't send teminate if not actually connected (in the middle of a restart attempt)
            if (this.isOpen() && this._boshProps && !this._boshProps.networkBackoff) {
                // clear out any pending network failure resends, otherwise the
                // attempted terminate will be ignored in favor of the resend
                delete this._boshProps.resend;
                //though not strictly needed, we don't really care if terminate
                //fails, don't need to wait for network recon attempts
                delete this._boshProps.networkBackoff;
                this._boshProps.networkAttempts = 0;

                this._sendRequest({type: "terminate"}, this._sendQ.empty());
            } else {
                this._reset();
            }
        },

        /**
         * <p>Sends the given element to the remote endpoint. This method
         * enques the element to send, which gets processed during the
         * heartbeat.</p>
         *
         * @param   {Element} elem The element to send
         * @throws  {TypeError} is {elem} is not a DOM element
         * @throws  {jabberwerx.Stream.NotOpenError} If this Stream is not open
         */
        send: function(elem) {
            if (!jabberwerx.isElement(elem)) {
                throw new TypeError("elem must be a DOM element");
            }

            if (!this.isOpen()) {
                throw new jabberwerx.Stream.NotOpenError();
            }

            this._sendQ.enque(elem);
        },

        /**
         * @private
         */
        _sendRequest: function(props, data) {
            props = jabberwerx.$.extend({}, this._boshProps, props);
            data = data || [];

            var rid = 0, body;
            var resend = false;
            if (props.resend) {
                try {
                    body = jabberwerx.util.unserializeXML(props.resend.body);
                    resend = true;
                } catch (ex) {
                    jabberwerx.util.debug.log("Exception: " + ex.message + " trying to parse resend body: " + props.resend.body);
                    delete props.resend; //don't try this again
                    return; //nothng to do really, probably unrecoverable
                }
                rid = props.resend.id;
                data = jabberwerx.$(body).children();
                props.rid = rid + 1;
                delete props.resend;
            } else {
                if (this._xhrs.size() > 1 && data.length) {
                    this._sendQ.enque(data);
                    return;
                }

                if (!props.rid) {
                    // make sure initial RID is "large"
                    var initial;
                    initial = Math.floor(Math.random() * 4294967296);
                    initial = (initial <= 32768) ?
                              initial + 32768 :
                              initial;
                    props.rid = initial;
                } else if (this._boshProps.rid >= 9007199254740991) {
                    // make sure RID does not exceed limit!
                    var err = new jabberwerx.Stream.ErrorInfo(
                            "{urn:ietf:params:xml:ns:xmpp-streams}policy-violation",
                            "BOSH maximum rid exceeded");
                    this._handleClose(err.getNode());
                    return;
                }
                rid = props.rid++;

                body = new jabberwerx.NodeBuilder("{http://jabber.org/protocol/httpbind}body");
                if (props.type) {
                    body.attribute("type", props.type);
                }

                // make a best attempt at determining the user's locale
                let locale = jabberwerx.system.getLocale();

                if (!props.sid) {
                    if (data.length) {
                        // enque until session is established...
                        this._sendQ.enque(data);
                        data = [];
                    }

                    if (locale) {
                        body.attribute("xml:lang", locale);
                    }
                    body.attribute("xmlns:xmpp", "urn:xmpp:xbosh").
                         attribute("hold", "1").
                         attribute("ver", "1.9").
                         attribute("to", props.domain).
                         attribute("wait", props.wait || 30).
                         attribute("{urn:xmpp:xbosh}xmpp:version", "1.0");
                    if (props.jid) {
                         body.attribute("from", jabberwerx.JID.asJID(props.jid).getBareJIDString());
                    }
                } else {
                    body.attribute("sid", props.sid);
                    if (props.restart) {
                        if (locale) {
                            body.attribute("xml:lang", locale);
                        }
                        body.attribute("{urn:xmpp:xbosh}xmpp:restart", "true").
                             attribute("to", props.domain);
                        this._boshProps.restart = true;
                    }
                }
                body.attribute("rid", rid);

                if (data.length) {
                    for (var idx = 0; idx < data.length; idx++) {
                        body.node(data[idx]);
                    }
                }
                body = body.data;
            }

            if (!props.requests) {
                props.requests = new jabberwerx.Stream.Queue();
            }
            props.requests.enque({
                id: rid,
                body: jabberwerx.util.serializeXML(body)
            });
            var setup = {
                async: true,
                data: props.requests.tail().body,
                timeout: props.wait * 1000 + 5000,
                url: props.httpBindingURL
            };

            setup = jabberwerx.$.extend(setup, this._xhrSetup);
            if (    this._boshProps.crossSite &&
                    !jabberwerx.$.support.cors &&
                    typeof(XDomainRequest) != "undefined") {
                // have jQuery pretend we're not cross-domain in this case
                setup.crossDomain = false;
            }
            if (this._boshProps) {
                this._boshProps = props;
            }
            if (!resend && data.length) {
                this.event("streamElementsSent").trigger(jabberwerx.$(data));
            }
            var xhr = jabberwerx.$.ajax(setup);
        },
        /**
         * @private
         */
        _createXHR: function(xhrFn) {
            xhrFn = jabberwerx.$.ajaxSettings.xhr;
            var xhr = null;

            if (    this._boshProps.crossSite &&
                    !jabberwerx.$.support.cors &&
                    typeof(XDomainRequest) !== "undefined") {
                var that = this;
                var done = this._boshProps.type == "terminate";
                var xdr = new XDomainRequest();

                // Enough of a XMLHttpRequest-like object for $.ajax
                // to function; proxy to XDomainRequest where we can,
                // no-op where we can't
                var xhr = {
                    readyState: 0,
                    abort: function() {
                        xdr.abort();
                        this.readyState = 0;
                    },
                    open: function() {
                        xdr.open.apply(xdr, arguments);
                        this.readyState = 1;
                        this.onreadystatechange && this.onreadystatechange.call(this);
                        this.async = arguments[2] || true;
                    },
                    send: function() {
                        this.readyState = 2;
                        this.onreadystatechange && this.onreadystatechange.call(this);
                        xdr.send.apply(xdr, arguments);
                    },
                    setRequestHeader: function() {
                        // NOOP
                    },
                    getResponseHeader: function() {
                        // NOOP
                    },
                    getAllResponseHeaders: function() {
                        // NOOP
                    }
                };

                /**
                 * @private
                 */
                var onreadyCB = function(status) {
                    xhr.onreadystatechange && xhr.onreadystatechange.call(this, status);
                };

                // XDomainRequest callbacks - map back to onreadystatechange
                xdr.onload = function() {
                    xhr.responseText = xdr.responseText;
                    xhr.status = 200;
                    xhr.readyState = 4;
                    onreadyCB();
                };
                xdr.onprogress = function() {
                    xhr.readyState = 3;
                    onreadyCB();
                };
                xdr.onerror = function() {
                    xhr.readyState = 4;
                    xhr.status = 500;   // some sort of server error
                    onreadyCB("error");
                };
                xdr.ontimeout = function() {
                    xhr.readyState = 4;
                    xhr.status = 408;   // timeout
                    onreadyCB("timeout");
                };
            } else {
                xhr = xhrFn();
            }

            return xhr;
        },

        /**
         * @private
         */
        _heartbeat: function() {
            var elems = this._recvQ.empty();
            if (elems.length) {
                elems = jabberwerx.$(elems);
                this.event("streamElementsReceived").trigger(elems);
            }

            // work through backoff first
            if (this._boshProps.networkBackoff) {
                this._boshProps.networkBackoff--;
                return;
            }
            // ensure connection is expected
            if (!this.isOpen() && !this._boshProps.operation) {
                return;
            }
            // ensure we have something to send
            if (!this._sendQ.size() &&
                this._xhrs.size() &&
                !this._boshProps.resend) {
                return;
            }

            this._sendRequest({}, this._sendQ.empty());
        },
        /**
         * @private
         *
         * Called by jQuery when the XHR object is created, but before
         * open() and send() are called.
         */
        _prepareXHR: function(xhr, settings) {
            this._xhrs.enque(xhr);
        },
        /**
         * @private
         */
        _handleXHR: function(xhr, status) {
            // check for dehydration, make sure there is an outstandiong xhr to handle
            if (this._dehydrated || !this._xhrs || (this._xhrs.size() === 0)) {
                // console.warn('Jabberwerx response was not handled', this._dehydrated, !this._xhrs, this._xhrs.size());
                window.jabberwerxHasFuckedUp('library');
                // this._handleClose('Jabberwerx response was not properly handled, so we do not have new connection');
                return;
            }
            this._xhrs.deque(xhr);

            var failFn = function(err, resend) {
                var boshProps = this._boshProps;
                if (!boshProps) {
                    // no BOSH props, nothing to do
                    return;
                }
                if (boshProps.type == "terminate") {
                    // should be finished, nothing to do
                    this._handleClose();
                    return;
                }
                if (boshProps.networkAttempts++ < 0) {
                    jabberwerx.util.debug.log("network timeout retry " +
                            boshProps.networkAttempts);
                    if (resend) {
                        // assume the last request failed...
                        // ...so we need to resend it (not the first!)
                        resend = boshProps.requests.pop();
                    }
                    if (resend) {
                        boshProps.resend = resend;
                    }

                    // wait for normal heartbeat, with increasing delay
                    boshProps.networkBackoff = jabberwerx.Stream.NETWORK_BACKOFF_COUNT *
                                               Math.pow(boshProps.networkAttempts, 2);
                    return;
                }

                // getting this far means we really did fail
                this._handleClose(err && err.getNode());
            };

            if (status != "success") {
                // network level error!
                var err;

                switch (status) {
                    case "timeout":
                        // server unresponsive...
                        err = jabberwerx.Stream.ERR_REMOTE_SERVER_TIMEOUT;
                        break;
                    case "error":
                        // http error...
                        err = jabberwerx.Stream.ERR_SERVICE_UNAVAILABLE;
                        break;
                    case "parseerror":
                        // not XML...
                        err = jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED;
                        break;
                    default:
                        // really bad...
                        err = jabberwerx.Stream.ERR_UNDEFINED_CONDITION;
                        break;
                }

                failFn.call(this, err, true);
                return;
            }

            // parse the response
            var dom = xhr.responseText;
            if (!dom) {
                // no data == malformed XML
                failFn.call(this, jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED);
                return;
            }
            try {
                dom = jabberwerx.util.unserializeXML(dom);
            } catch (ex) {
                //parse error
                failFn.call(this, jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED);
                return;
            }
            if (!dom) {
                // no data == malformed XML
                failFn.call(this, jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED);
                return;
            }
            dom = jabberwerx.$(dom);
            if (!dom.is("body[xmlns='http://jabber.org/protocol/httpbind']")) {
                failFn.call(this, jabberwerx.Stream.ERR_SERVICE_UNAVAILABLE);
                return;
            }
            this._boshProps.networkAttempts = 0;

            if (this._boshProps && this._boshProps.requests) {
                this._boshProps.requests.deque();
            }

            var content = dom.children();
            if (!this._boshProps.sid) {
                // expecting an initial BOSH body
                var attr;

                attr = dom.attr("sid");
                if (attr) {
                    this._boshProps.sid = attr;
                }

                attr = dom.attr("wait");
                if (attr) {
                    this._boshProps.wait = parseInt(attr);
                }

                attr = dom.attr("inactivity");
                if (attr) {
                    this._boshProps.timeout = parseInt(attr);
                }
            }

            if (content.length) {
                var feats = null, err = null;

                // filter features and error
                content = content.map(function() {
                    switch (this.nodeName) {
                        case "stream:features":
                            feats = this;
                            break;
                        case "stream:error":
                            err = this;
                            break;
                        default:
                            // retain "sent"
                            return this;
                    }

                    return null;
                });

                if (feats) {
                    // report open, but continue...
                    this._handleOpen(feats);
                }

                if (content.length) {
                    this._recvQ.enque(content.get());
                }

                if (err) {
                    // close and report
                    this._handleClose(err);
                    return;
                }
            }

            var err;
            switch (dom.attr("type") || this._boshProps.type) {
                case "terminate":
                    // should be closed now...
                    if (!this._boshProps.type) {
                        // server-side terminate, probably has an error...
                        switch (dom.attr("condition") || "") {
                            case "":
                                //no error...
                                err = null;
                                break;
                            case "bad-request":
                                err = jabberwerx.Stream.ERR_BAD_REQUEST;
                                break;
                            case "host-gone":
                                err = jabberwerx.Stream.ERR_SERVICE_UNAVAILABLE;
                                break;
                            case "other-request":
                                err = jabberwerx.Stream.ERR_CONFLICT;
                                break;
                            case "policy-violation":
                                err = jabberwerx.Stream.ERR_POLICY_VIOLATION;
                                break;
                            case "system-shutdown":
                                err = jabberwerx.Stream.ERR_SYSTEM_SHUTDOWN;
                                break;
                            case "see-other-uri":
                                // Grab new URI.
                                var uri = dom.children("uri").text();

                                // Validate URI.
                                if (!uri || uri == "")
                                {
                                    err = jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED;
                                    break;
                                }

                                var uriParts = jabberwerx.Stream.URL_PARSER.exec(uri);

                                var protocol = uriParts[1];
                                var hostPort = uriParts[2];
                                var resource = uriParts[3];

                                var origParts = jabberwerx.Stream.URL_PARSER.
                                                 exec(this._boshProps.httpBindingURL);

                                var origProtocol = origParts[1];
                                var origHostPort = origParts[2];

                                if (origProtocol == "http:") {
                                    // if 'http', 'protocol' and 'port' must be the same and
                                    // the new host must be the same or a subdomain of the
                                    // original.
                                    var tmpOrigHostPort = "." + origHostPort;
                                    var tmpHostPort = "." + hostPort;

                                    var diff = tmpHostPort.length - tmpOrigHostPort.length;
                                    var validDomain = diff >= 0 &&
                                        tmpHostPort.lastIndexOf(tmpOrigHostPort) === diff;

                                    if (!((protocol == origProtocol) &&
                                          (validDomain))) {
                                        err = jabberwerx.Stream.ERR_POLICY_VIOLATION;
                                        break;
                                    }
                                } else if (origProtocol == "https:") {
                                    // if 'https', ensure new 'protocol','host' and 'port' are valid.
                                    if ((!protocol || protocol == "") ||
                                        (!hostPort || hostPort == "")) {
                                        err = jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED;
                                        break;
                                    }
                                } else {
                                    err = jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED;
                                    break;
                                }

                                this._storeConnectionInfo(protocol, hostPort, resource);
                                return;
                            default:
                                // blanket error...
                                err = jabberwerx.Stream.ERR_UNDEFINED_CONDITION;
                                break;
                        }
                    }
                    this._handleClose(err && err.getNode());
                    return;
                case "error":
                    break;
            }
        },

        /**
         * @private
         */
        _handleOpen: function(feats) {
            if (this._boshProps.opening) {
                // cancel any pending timeout
                jabberwerx.system.clearTimeout(this._boshProps.opening);
                delete this._boshProps.opening;
            }

            // assume we need to clear the restart flag
            delete this._boshProps.restart;
            // assume the operation completed
            delete this._boshProps.operation;

            if (!jabberwerx.isElement(feats)) {
                // called from timeout...
                // fake stream:features with bind & session-start
                feats = new jabberwerx.NodeBuilder("{http://etherx.jabber.org/streams}stream:features");
                feats.element("{urn:ietf:params:xml:ns:xmpp-bind}bind");
                feats.element("{urn:ietf:params:xml:ns:xmpp-session}session");
                feats = feats.data;
            }

            // flag and report open
            var that = this;
            jabberwerx.system.setTimeout(function() {
                that._opened = true;
                that.event("streamOpened").trigger(feats);
            }, 1);
        },
        /**
         * @private
         * Called to handle the stream closing. This method may be called
         * multiple times, as each pending request completes.
         *
         * It's possible the recvQ is non empty when this mehod is called.
         * An open question is should those queued stanzas be evented before
         * the streamClosed event is triggered? Would stanza listeners then have
         * to check if stream state before responding to a stanza?
         */
        _handleClose: function(err) {
            // Check to see if we were open before...
            var open = this.isOpen();
            var oper = this._boshProps.operation;

            // clean up (marking stream as !open)
            this._reset();
            if (open || oper) {
                // flag and report !open
                var that = this;
                jabberwerx.system.setTimeout(function() {
                    // trigger event if initially open
                    that.event("streamClosed").trigger(err);
                }, 10);
            }
        },

        /**
         * @private
         */
        _reset: function() {
            // cancel heartbeat
            jabberwerx.system.clearInterval(this._boshProps.heartbeat);

            // reset state
            this._opened = false;
            this._boshProps = {};
            this._sendQ.empty();
            this._xhrs.empty();
            this._recvQ.empty();
        },

        /**
         * <p>Called just prior to this stream being serialized. This method
         * converts any pending elements into their XML equivalents, and aborts
         * all pending BOSH requests.</p>
         */
        willBeSerialized: function() {
            this._dehydrated = true;

            if (this.isOpen()) {
                //pause!
                jabberwerx.system.clearInterval(this._boshProps.heartbeat);
            }

            if (this._boshProps) {
                if (this._boshProps.networkAttempts) {
                    // browsers occassionally kill a connection just before dehydration
                    this._boshProps.networkAttempts--;
                }
                //save a backoff to let things settle on rehydrate...
                this._boshProps.networkBackoff = jabberwerx.Stream.NETWORK_BACKOFF_COUNT;
            }
            var elems;

            // convert all queued sent elements to XML
            elems = this._sendQ.empty();
            elems = jabberwerx.$.map(elems, function() {
                return jabberwerx.util.serializeXML(this);
            });
            this._sendQ.enque(elems);

            // convert all queued received elements to XML
            elems = this._recvQ.empty();
            elems = jabberwerx.$.map(elems, function() {
                return jabberwerx.util.serializeXML(this);
            });
            this._recvQ.empty();

            // forget all pending requests
            delete this._xhrs;
        },
        /**
         * <p>Called just after this stream is unserialized. This method
         * converts any pending XML into their DOM equivalents, and
         * resumes the BOSH request loop if the stream was previously
         * opened.</p>
         */
        wasUnserialized: function() {
            // re-initialize request queue
            this._xhrs = new jabberwerx.Stream.Queue();

            // convert all queued XML to elements
            var elems;
            elems = this._sendQ.empty();
            elems = jabberwerx.$.map(elems, function() {
                return jabberwerx.util.unserializeXML(String(this));
            });
            this._sendQ.enque(elems);

            delete this._dehydrated;

            // TODO: should be moved to "graphUnserialized"??
            if (this.isOpen()) {
                // resume!
                this._boshProps.resend = this._boshProps.requests.deque();
                this._boshProps.heartbeat = jabberwerx.system.setInterval(
                        this.invocation("_heartbeat"),
                        jabberwerx.Stream.HEARTBEAT_INTERVAL);
            }
        },

        /**
         * @private
         */
        _opened: false,
        /**
         * @private
         */
        _boshProps: {},
        /**
         * @private
         */
        _xhrSetup: {},
        /**
         * @private
         */
        _xhrs: null,
        /**
         * @private
         */
        _sendQ: null,
        /**
         * @private
         */
        _recvQ: null
    }, "jabberwerx.Stream");

    jabberwerx.Stream.Queue = jabberwerx.JWModel.extend(/** @lends jabberwerx.Stream.Queue.prototype */{
        /**
         * @private
         * @class
         * <p>Implementation of a data queue. This class provides convenience
         * methods around a JavaScript array object to better support enquing
         * and dequing items.</p>
         *
         * @description
         * <p>Creates a new Queue.</p>
         *
         * @constructs  jabberwerx.Stream.Queue
         * @extends     JWModel
         */
        init: function() {
            this._super();
        },

        /**
         * Retrieves the first item in this queue, if any.
         *
         * @returns  The first item, or <tt>null</tt> if empty
         */
        head: function() {
            return this._q || null;
        },
        /**
         * Retrieves the last item in this queue, if any.
         *
         * @returns  The last item, or <tt>null</tt> if empty
         */
        tail: function() {
            return this._q[this._q.length - 1] || null;
        },

        /**
         * <p>Adds one or more items to the end of this queue. This method
         * supports a variable number of arguments; each argument provided
         * is appended to the queue.</p>
         *
         * <p>If {item} (or subsequent arguments) is an Array, the elements
         * in that array are appended directly. If an actually array needs
         * to be appended, it must be wrapped with another array:</p>
         *
         * <pre class="code">queue.enque([ anotherArray ]);</pre>
         *
         * @parm    item The item to add to this Queue
         * @returns  {Number} The size of this Queue
         */
        enque: function(item) {
            // NOTE: item is treated as a placeholder
            for (var idx = 0; idx < arguments.length; idx++) {
                item = arguments[idx];
                var tmp = [this._q.length, 0].concat(item);
                this._q.splice.apply(this._q, tmp);
            }

            return this.size();
        },
        /**
         * <p>Removes an item from this queue. If {item} is provided,
         * this method attempts to find and remove it from this Queue.</p>
         *
         * @param   [item] The item to remove from this Queue
         * returns   The removed item, or <tt>null</tt> if this Queue is
         *          unchanged.
         */
        deque: function(item) {
            if (item !== undefined) {
                var idx = jabberwerx.$.inArray(item, this._q);
                if (idx != -1) {
                    this._q.splice(idx, 1);
                } else {
                    item = null;
                }
            } else {
                item = this._q.shift() || null;
            }

            return item;
        },
        /**
         * <p>Removes the *first* item from this queue.</p>
         *
         * @returns The removed item, or <tt>null</tt> if this Queue is
         *          unchanged.
         */
        pop: function() {
            return this._q.pop() || null;
        },
        /**
         * <p>Locates the first matching item within this Queue.</p>
         *
         * <p>The signature of {cmp} must be the following:</p>
         * <pre class='code'>
         * var cmp = function(item) {
         *      // the current item to determine matches
         *      item;
         *      // return the item that matches
         * }
         * </pre>
         *
         * @param   {Function} cmp The comparison function
         * @returns The matching item, or <tt>null</tt> if none
         */
        find: function(cmp) {
            if (!jabberwerx.$.isFunction(cmp)) {
                throw new TypeError("comparator must be a function");
            }
            var result = null;
            jabberwerx.$.each(this._q, function() {
                result = cmp(this);
                return (result !== undefined);
            });

            return result;
        },
        /**
         * <p>Removes all items from this Queue.</p>
         *
         * @return  {Array} The previous contents of this Queue
         */
        empty: function() {
            var q = this._q;
            this._q = [];

            return q;
        },

        /**
         * <p>Retrieves the current size of this Queue.</p>
         *
         * @return  {Number} The size
         */
        size: function() {
            return this._q.length;
        },

        /**
         * @private
         */
        _q: []
    }, "jabberwerx.Stream.Queue");

    /**
     * @private
     *
     * Pattern to separate URI into protocol, authority and path parts
     * @type {RegExp}
     */
    jabberwerx.Stream.URL_PARSER = /^(?:([0-9a-zA-Z]+\:)\/\/)?(?:([^\/]+))?(?:\/(.*))?$/;

    /**
     * @private
     * The default session timeout in seconds (5 minutes).
     *
     * @type    Number
     */
    jabberwerx.Stream.DEFAULT_TIMEOUT = 300;
    /**
     * @private
     * The default polling wait in seconds (30 seconds).
     *
     * @type    Number
     */
    jabberwerx.Stream.DEFAULT_WAIT = 30;

    /**
     * @private
     * The heartbeat interval in milliseconds (10 milliseconds)
     */
    jabberwerx.Stream.HEARTBEAT_INTERVAL = 10;
    /**
     * @private
     * The number of intervals to delay in case of network trouble.
     * The total delay is HEARTBEAT_INTERVAL * NETWORK_BACKOFF_COUNT
     */
    jabberwerx.Stream.NETWORK_BACKOFF_COUNT = 50;

    /**
     * @class jabberwerx.Stream.NotOpenError
     * <p>Error thrown if the Stream must be open for the method to
     * complete.</p>
     * @description
     * <p>Creates a new NotOpenError with the given message.</p>
     * @constructs jabberwerx.Stream.NotOpenError
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Stream.NotOpenError = jabberwerx.util.Error.extend("Stream not open");
    /**
     * @class jabberwerx.Stream.AlreadyOpenError
     * <p>Error thrown if the Stream must NOT be open for the method to
     * complete.</p>
     * @description
     * <p>Creates a new AlreadyOpenError with the given message.</p>
     * @constructs jabberwerx.Stream.AlreadyOpenError
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Stream.AlreadyOpenError = jabberwerx.util.Error.extend("Stream is already open");

    jabberwerx.Stream.ErrorInfo = jabberwerx.JWModel.extend(/** @lends jabberwerx.Stream.ErrorInfo.prototype */{
        /**
         * @class
         * <p>Representation of stream error information.</p>
         *
         * @description
         * <p>Creates a new ErrorInfo with the given information.</p>
         * @extends JWModel
         * @constructs jabberwerx.Stream.ErrorInfo
         * @param   {String} [cond] The error condition
         * @param   {String} [text] The error text description
         * @minimal
         */
        init: function(cond, text) {
           this._super();

           this.condition = cond || "{urn:ietf:params:xml:ns:xmpp-streams}undefined-condition";
           this.text = text || "";

           this.toString = this._toErrString;
        },

        /**
         * <p>Retrieves the element for this ErrorInfo. The returned element
         * is as follows:</p>
         *
         * <pre class="code">
         *  &lt;stream:error xmlns:stream="http://etherx.jabber.org/streams"&gt;
         *      &lt;{condition-local-name} xmlns="urn:ietf:params:xml:ns:xmpp-streams"/&gt;
         *      &lt;text xmlns="urn:ietf:params:xml:ns:xmpp-streams"&gt;{text}&lt;/text&gt;
         *  &lt;/error&gt;
         * </pre>
         *
         * @returns  {Element} The DOM representation
         */
        getNode: function() {
            var builder = new jabberwerx.NodeBuilder("{http://etherx.jabber.org/streams}stream:error");
            builder.element(this.condition);
            if (this.text) {
                builder.element("{urn:ietf:params:xml:ns:xmpp-streams}text").
                        text(this.text);
            }

            return builder.data;
        },

        /**
         * <p>Called after this object is rehydrated. This method sets the toString
         * method as expected.</p>
         */
        wasUnserialized: function() {
            // IE work-around
            this.toString = this._toErrString;
        },

        /**
         * @private
         */
        _toErrString: function() {
            return this.condition;
        },

        /**
         * <p>The condition of this ErrorInfo.</p>
         * @type   String
         */
        condition: "",
        /**
         * <p>The descriptive text for this ErrorInfo.</p>
         * @type   String
         */
        text: ""
    }, "jabberwerx.Stream.ErrorInfo");

    /**
     * <p>Creates a ErrorInfo based on the given node.</p>
     *
     * @param   {Element} node The XML &lt;error/&gt;
     * @returns  {jabberwerx.Stream.ErrorInfo} The ErrorInfo
     * @throws  {TypeError} If {node} is not an element
     */
    jabberwerx.Stream.ErrorInfo.createWithNode = function(node) {
        if (!jabberwerx.isElement(node)) {
            throw new TypeError("node must be an Element");
        }
        node = jabberwerx.$(node);
        var cond = node.
                children("[xmlns='urn:ietf:params:xml:ns:xmpp-streams']:not(text)").
                map(function() {
                    return "{urn:ietf:params:xml:ns:xmpp-streams}" + this.nodeName;
                }).get(0);
        var text = node.
                children("text[xmlns='urn:ietf:params:xml:ns:xmpp-streams']").
                text();

        // TODO: search for known errors first?
        return new jabberwerx.Stream.ErrorInfo(cond, text);
    };

    /**
     * <p>ErrorInfo for a bad request error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_BAD_REQUEST = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}bad-request");
    /**
     * <p>ErrorInfo for a conflict error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_CONFLICT = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}conflict");
    /**
     * <p>ErrorInfo for a policy violation error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_POLICY_VIOLATION = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}policy-violation");
    /**
     * <p>ErrorInfo for a remote connection error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_REMOTE_CONNECTION_FAILED = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}remote-connection-failed");
    /**
     * <p>ErrorInfo for a remote server timeout error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_REMOTE_SERVER_TIMEOUT = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}remote-server-timeout");

    /**
     * <p>ErrorInfo for a service unavailable error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_SERVICE_UNAVAILABLE = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}service-unavailable");
    /**
     * <p>ErrorInfo for a system shutdown error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_SYSTEM_SHUTDOWN = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}system-shutdown");
    /**
     * <p>ErrorInfo for a service unavailable error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_UNDEFINED_CONDITION = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}undefined-condition");
    /**
     * <p>ErrorInfo for a malformed xml error.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_XML_NOT_WELL_FORMED = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}xml-not-well-formed");
    /**
     * <p>ErrorInfo for a policy violation.</p>
     *
     * @type    jabberwerx.Stream.ErrorInfo
     */
    jabberwerx.Stream.ERR_POLICY_VIOLATION = new jabberwerx.Stream.ErrorInfo(
            "{urn:ietf:params:xml:ns:xmpp-streams}policy-violation");
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/model/Client.js*/
/**
 * filename:        Client.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */
;(function(jabberwerx){
    /** @private */
    jabberwerx.ClientEntityCache = jabberwerx.EntitySet.extend(/** @lends jabberwerx.ClientEntityCache.prototype */ {
        /**
         * @class
         * <p>The client's collection of entities. This is the central
         * repositories for entities within a client.</p>
         *
         * <p>
         * This class provides the following events:
         * <ul>
         * <li><a href="../jabberwerxEvents.html#jabberwerx.EntitySet">jabberwerx.EntitySet</a></li>
         * <li><a href="../jabberwerxEvents.html#jabberwerx.EntitySet_Cache">jabberwerx.EntitySet Cache</a></li>
         * </ul>
         *
         * @description
         *
         * @extends jabberwerx.EntitySet
         * @constructs jabberwerx.GlobalEntityCache
         * @minimal
         */
        init: function() {
            this._super();
        },

        /**
         * Registers the given entity to this cache. This method
         * overrides the base class to:</p>
         *
         * <ol>
         * <li>Validate that another entity matching {entity} is not
         * already registered (throwing a
         * {@link jabberwerx.EntitySet.EntityAlreadyExistsError}).</li>
         * <li>trigger the "entityCreated" event if this cache was changed
         * as a result of this call</li>
         * </ol>
         * @param {jabberwerx.Entity} entity The entity to register
         *
         */
        register: function(entity) {
            if (!(entity && entity instanceof jabberwerx.Entity)) {
                throw new TypeError("entity is not an Entity");
            }

            var prev = this.entity(entity.jid, entity.node);
            if (prev && prev !== entity) {
                throw new jabberwerx.EntitySet.EntityAlreadyExistsError();
            } else if (!prev) {
                this.event("entityCreated").trigger(entity);
            }

            return this._super(entity);
        },
        /**
         * Unregisters the given entity from this cache. This method
         * overrides the base class to trigger the "entityDestroyed" event.
         *
         * @param {jabberwerx.Entity} entity The entity to unregister
         */
        unregister: function(entity) {
            var result = this._super(entity);
            if (result) {
                this.event("entityDestroyed").trigger(entity);
            }

            return result;
        },

        /**
         * Factory method for {@link jabberwerx.LocalUser} objects. If a local object for
         * the passed JID already exists, that object is returned instead of a new object.
         *
         * @param {jabberwerx.JID|String} jid The JID for this user.
         * @returns {jabberwerx.LocalUser} A LocalUser for the given arguments
         * @throws  {TypeError} if {jid} is not a valid JID
         * @throws  {jabberwerx.EntitySet.EntityAlreadyExistsError} if an
         *          entity for {jid} already exists, but is not a LocalUser
         */
        localUser: function(jid) {
            var ent = this.entity(jid);
            if (!(ent && ent instanceof jabberwerx.LocalUser)) {
                ent = new jabberwerx.LocalUser(jid, this);
                this.register(ent);
            }

            return ent;
        },
        /**
         * Factory method for {@link jabberwerx.Server} objects. If a local object for
         * the passed JID already exists, that object is returned instead of a new object.
         *
         * @param {String} serverDomain The domain for this server, eg, "jabber.com".
         * @returns {jabberwerx.Server} A Server for the given arguments
         * @throws  {TypeError} if serverDomain is not a valid JID
         * @throws  {jabberwerx.EntitySet.EntityAlreadyExistsError} if an
         *          entity for {serverDomain} already exists, but is not a
         *          Server.
         */
        server: function(serverDomain) {
            var ent = this.entity(serverDomain);
            if (!ent || !(ent instanceof jabberwerx.Server)) {
                ent = new jabberwerx.Server(serverDomain, this);
                this.register(ent);
            }

            return ent;
        },
        /**
         * Factory method for {@link jabberwerx.TemporaryEntity} objects. If a local object for
         * the passed JID already exists, that object is returned instead of a new object.
         *
         * @param {jabberwerx.JID|String} jid The JID of the temporary entity object to get or create.
         * @returns {jabberwerx.TemporaryEntity} A TemporaryEntity for the
         *          given JID
         * @throws  {TypeError} if {jid} is not a valid JID
         * @throws  {jabberwerx.EntitySet.EntityAlreadyExistsError} if an
         *          entity for {jid} already exists, but is not a
         *          TemporaryEntity
         */
        temporaryEntity: function(jid) {
            var ent = this.entity(jid);
            if (!(ent && ent instanceof jabberwerx.TemporaryEntity)) {
                ent = new jabberwerx.TemporaryEntity(jid, this);
                this.register(ent);
            }

            return ent;
        }
    }, "jabberwerx.ClientEntityCache");

    jabberwerx.Client = jabberwerx.JWModel.extend(/** @lends jabberwerx.Client.prototype */{
        /**
         * @class
         * <p>The role of the Client is to provide an interface to the XMPP protocol.
         * It sends and recieves communication over its connection on behalf of any
         * other model objects.</p>
         *
         * <p>
         * This class provides the following events:
         * <ul>
         * <li><a href="../jabberwerxEvents.html#jabberwerx.Client">jabberwerx.Client</a></li>
         * </ul>
         *
         * @description
         * <p>Creates a new Client with the given (optional) resource. If
         * {resourceName} is omitted, the client will rely on the XMPP/BOSH
         * service to provide an appropriate value upon connection.</p>
         *
         * @param {String} [resourceName] the client resource name to use.
         *
         * @constructs jabberwerx.Client
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function(resourceName) {
            this._super();

            //Events
            this.applyEvent('clientStatusChanged');

            this.applyEvent('beforeIqSent');
            this.applyEvent('iqSent');
            this.applyEvent('beforeIqReceived');
            this.applyEvent('iqReceived');
            this.applyEvent('afterIqReceived');

            this.applyEvent('beforeMessageSent');
            this.applyEvent('messageSent');
            this.applyEvent('beforeMessageReceived');
            this.applyEvent('messageReceived');
            this.applyEvent('afterMessageReceived');

            this.applyEvent('beforePresenceSent');
            this.applyEvent('presenceSent');
            this.applyEvent('beforePresenceReceived');
            this.applyEvent('presenceReceived');
            this.applyEvent('afterPresenceReceived');

            this.applyEvent('reconnectCountdownStarted');
            this.applyEvent('reconnectCancelled');

            this.applyEvent('clientConnected');
            this.applyEvent('clientDisconnected');

            this.entitySet = new jabberwerx.ClientEntityCache();

            if (resourceName && typeof resourceName == 'string') {
                this.resourceName = resourceName;
            }
            else{
                this._autoResourceName = true;
            }

            this._stream = new jabberwerx.Stream();

            //handle iq:version, time
            this.event('afterIqReceived').bindWhen('iq[type="get"] *[xmlns="urn:xmpp:time"]',
                     this.invocation('_handleEntityTime'));
            this.event('afterIqReceived').bindWhen('iq[type="get"] *[xmlns="jabber:iq:time"]',
                     this.invocation('_handleIqTime'));

            // _handlePresenceIn will be called for all presence stanzas with no type or type unavailable
            this.event('presenceReceived').bind(this.invocation('_handlePresenceIn'));
            //this.event("presenceSent").bind(this.invocation("_handlePresenceOut"));
        },
        /**
         * Destroys this client. This method walks through all of the controllers,
         * destroying them.
         */
         destroy: function() {
            jabberwerx.$.each(this.controllers, function() {
                this.destroy();
            });
            this._super();
         },

        /**
         * @private
         */
        _setStreamHandler: function(evt, funcName) {
            this._clearStreamHandler(evt);
            this._streamHandlers[evt] = funcName;
            this._stream.event(evt).bind(this.invocation(this._streamHandlers[evt]));
        },

        /**
         * @private
         */
        _clearStreamHandler: function(evt) {
            if (this._streamHandlers[evt] !== undefined) {
                this._stream.event(evt).unbind(this.invocation(this._streamHandlers[evt]));
                delete this._streamHandlers[evt];
            }
        },

        /**
         * @private
         */
        _clearStreamHandlers: function() {
            this._clearStreamHandler('streamOpened');
            this._clearStreamHandler('streamClosed');
            this._clearStreamHandler('streamElementsReceived');
            this._clearStreamHandler('streamElementsSent');
            this._streamHandlers = {};
        },

        /**
         * @private
         * Return a new connection parameters object populated from
         * given jid, password and connection argument
         *
         * This method allows subsclasses and mixins to modify connection
         * parameters being used during a connection attempt. This method is
         * called late in the connection process; after parameter validation and
         * state changes. This method is called immediately before a stream open
         * is attempted.
         *
         * The connection parameters returned by this method are further
         * filtered and finally passed to the BOSH stream as stream options
         * {@link jabberwerx.Client._filterStreamOpts}
         *
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {String|jabberwerx.JID} jid full or bare connection JID
         * @param {String} password The associated password
         * @param {Object} Additional connection and stream configuration opts
         * @returns {Object} A simple object containing stream open and connection
         *                   configuration options suitable for use in
         *                   {@link jabberwerx.Client.connect}.
         */
        _newConnectParams: function(cjid, password, arg) {
            cjid = jabberwerx.JID.asJID(cjid);
            return {
                jid: cjid,
                password: password,
                username: cjid.getNode(),
                domain: cjid.getDomain(),
                resource: this.resourceName,
                // be sure to remember the correct httpBindingURL
                httpBindingURL: arg.httpBindingURL || jabberwerx._config.httpBindingURL,
                secure: arg.unsecureAllowed || jabberwerx._config.unsecureAllowed || false,
                timeout: arg.timeout || null,
                wait: arg.wait || null,
                arg: arg
            };
        },

        /**
         * <p>Connect to the XMPP server. the value of {arg} is expected to
         * be an object with any of the following properties:</p>
         *
         * <table>
         * <tr><th>Name</th><th>Type</th><th>Description</th></tr>
         * <tr><td>httpBindingURL</td><td>String</td><td>URL for BOSH
         * connection</td></tr>
         * <tr><td>successCallback</td><td>Function</td><td>Called when
         * the client successfully connects. It is expected to have the
         * following signature:
         * <div><pre class="code">
         * function success() {
         *    this; //The client
         * }
         * </pre></div></td></tr>
         * <tr><td>errorCallback</td><td>Function</td><td>Called when
         * the client fails to connect. It is expected to have the
         * following signature:
         * <div><pre class="code">
         * function failed(err) {
         *    this; //The client
         *    err;  //An object describing the error
         * }
         * </pre></div></td></tr>
         * <tr><td>unsecureAllowed</td><td>Boolean</td><td>true if plaintext
         * authentication is allowed over unencrypted or unsecured HTTP
         * channels (defaults to false)</td></tr>
         * </table>
         *
         * <p><strong>NOTE:</strong> it is <strong>NOT RECOMMENDED</strong> to
         * set "unsecureAllowed" to "true" outside of prototype code. Instead,
         * The httpBindingURL should point to an HTTPS service and/or the origin
         * page loaded over HTTPS.</p>
         *
         * @param {jabberwerx.JID|String} jid The JID to connect to the
         *        XMPP server. If anonymous connect is required, only specify
         *        the domain as the jid i.e. "example.com"
         * @param {String} [password] The password for the given JID. If using anonymous connect
         *        (i.e. the domain is passed as the jid value) the password argument is optional.
         * @param {Object} arg Object containing the arguments to connect with.
         */
        connect: function(jid, password, arg) {
            //helper function to create user/server entites as needed, maintains entitycache
            //integrety by deleting invalid refs
            var __createEntities = function(client) {
                var user;
                jabberwerx.$.each(client.entitySet.toArray(), function() {
                    if (this instanceof jabberwerx.LocalUser) {
                        if (client._connectParams.jid.equals(this.jid)) {
                            user = this;
                        } else {
                            this.remove();
                        }
                    }
                });
                client.connectedUser = user ||
                                     client.entitySet.localUser(client._connectParams.jid);
                //client._setFullJid();
                // Locate server for {domain}, clearing all others
                var server;
                jabberwerx.$.each(client.entitySet.toArray(), function() {
                    if (this instanceof jabberwerx.Server) {
                        if (client._connectParams.jid.getDomain() == this.jid.getDomain()) {
                            server = this;
                        } else {
                            this.remove();
                        }
                    }
                });
                client.connectedServer = server ||
                    client.entitySet.server(client._connectParams.jid.getDomain());
            }

            //bind connect success and error callbacks to approriate events
            var __bindCallbacks = function(client) {
                var successCB = client._connectParams.arg.successCallback;
                var errorCB = client._connectParams.arg.errorCallback;
                if (successCB || errorCB) {
                    var fn = function(evt) {
                        var evtCon = (evt.data.next == jabberwerx.Client.status_connected);
                        var evtDiscon = (evt.data.next == jabberwerx.Client.status_disconnected);
                        if (evtCon || evtDiscon) {
                            client.event('clientStatusChanged').unbind(fn);
                            if (successCB && evtCon) {
                                successCB(client);
                            } else if (errorCB && evt.data.error && evtDiscon) {
                                errorCB(evt.data.error);
                            }
                        }
                    };
                    client.event('clientStatusChanged').bind(fn);
                }
            }

            //bail if not disconnected.
            if (this.clientStatus != jabberwerx.Client.status_disconnected) {
                // DEBUG-BEGIN
                jabberwerx.util.debug.log("client not disconnected!");
                // DEBUG-END
                return;
            }

            if (!arg) { arg = {}; }

            // Cancel a reconnect countdown if one was in progress
            this.cancelReconnect();
            this._clearStreamHandlers(); //there can be only one... set of handlers
            this._stream.close();        //make sure it's really really closed!

            // Store parameters for reconnect if required
            try {
                var cjid = jabberwerx.JID.asJID(jid);

                // No jid nodename provided ... anonymous connect required
                if ( !cjid.getNode() ) {

                    // set flag for in-band registration
                    arg.register = true;

                    // create a new jid using a random node name
                    cjid = new jabberwerx.JID({
                                                domain: cjid.getDomain(),
                                                node: "CAXL_" + jabberwerx.util.crypto.generateUUID()
                    });

                    // create a random password if required
                    if ( !password ) {
                        password = jabberwerx.util.crypto.b64_sha1(jabberwerx.util.crypto.generateUUID());
                    }
                }
                this._connectParams = this._newConnectParams(cjid, password, arg);

                this._openStream();
                //create entities, callback bindings after stream open request
                //auth/unknown stream exceptions will be handled through status_disconnected from here
                //ensure exactly one localuser and server are in entity cache
                //create entities, callback bindings
                __createEntities(this);
                //bind any callbacks to appropriate client events
                __bindCallbacks(this);
                //finally change staus to reconnecting/connecting
                if (this._connectParams.arg.reconnecting) {
                    this.setClientStatus(jabberwerx.Client.status_reconnecting);
                    this._connectParams.arg.reconnecting = false;
                } else {
                    this.setClientStatus(jabberwerx.Client.status_connecting);
                }

                this._connectionAttempts++;
            } catch (ex) {
                // configuration problem
                this._connectParams = {}; //clear apparently bad connect info
                throw new jabberwerx.Client.ConnectionError(ex.message || 'invalid connection information');
            }
        },

        /**
         * @private
         * Return a new configuration suitable for stream open.
         *
         * Constructs a new object from the given connection parameters, copying
         * any stream relevent properties and ignoring all others.
         * Allows password to be kept hidden from stream for example.
         *
         * This method allows subsclasses and mixins to modify
         * the parameters passed to {@link jabberwerx.Stream.open}.
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {Object} cparams connection parameters.
         * @returns {Object} Stream open configuration
         */
        _filterStreamOpts: function(cparams) {
            cparams = cparams || {};
            return {
                jid: cparams.jid,
                domain: cparams.domain,
                timeout: cparams.timeout,
                wait: cparams.wait,
                secure: cparams.secure,
                httpBindingURL: cparams.httpBindingURL
            };
        },

        /**
         * @private
         */
        _openStream: function() {
            //if in-band registration is required, do that before authorization
            if (this._connectParams.arg.register) {
                this._setStreamHandler('streamOpened','_handleRegistrationOpened');
            } else {
                this._setStreamHandler('streamOpened','_handleAuthOpened');
            }

            this._setStreamHandler('streamClosed','_handleClosed');

            //pass only what stream needs to open, ie not password
            var streamOpts = this._filterStreamOpts(this._connectParams);
            try {
                this._stream.open(streamOpts);
            } catch (ex) {
                //need to cleanup here, nothing else will
                this._clearStreamHandlers();
                throw ex;
            }
        },

        /**
         * @private
         */
        _handleRegistrationOpened: function()  {
            try {
                //remove this handler one time stream open event handler
                this._clearStreamHandler('streamOpened');

                // build iq stanza to register
                var registerIQ = new jabberwerx.IQ();
                registerIQ.setType("set");
                registerIQ.setID(jabberwerx.Stanza.generateID());

                var builder = new jabberwerx.NodeBuilder('{jabber:iq:register}query');
                builder = builder.element("username").
                    text(this._connectParams.username).
                    parent;
                builder = builder.element("password").
                    text(this._connectParams.password).
                    parent;
                registerIQ.setQuery(builder .data);

                //bind inband registration handler to stream element received event
                this._setStreamHandler('streamElementsReceived', '_handleRegisterElements');
                this._stream.send(registerIQ.getNode());
            } catch (ex) {
                this._handleConnectionException(ex);
            }
        },

        /**
         * @private
         */
        _handleRegisterElements: function(elem) {
            try{
                //remove this handler
                this._clearStreamHandler('streamElementsReceived');

                //check for errors
                var errNode = jabberwerx.$(elem.data).find("error");
                if (errNode && errNode.length != 0) {
                    //clear the in-band registration flag
                    this._connectParams.arg.register = false;
                    //handle any errors found
                    this._handleConnectionException(errNode);
                }
                else{
                    //in-band registartion successful ... reset the stream
                    this._stream.close();
                }

            } catch (ex) {
                this._handleConnectionException(ex);
            }
        },

        /**
         * @private
         *
         * Method called when stream is opened for SASL negotiation.
         *
         * jabberwerx.Client._handleConnectionException will be called on
         * mechanism-too-weak or any unhandled exceptions. Ulitimately the
         * error stanza will be passed through a call to
         * jabberwerx.Client._disconnected.
         *
         * Starts SASL negotiation by calling
         * jabberwerx.Client._handleAuthElements(), passing no elements.
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {jabberwerx.NodeBuilder} feats The stream features for this open attempt
         */
        _handleAuthOpened: function(feats) {
            try {
                //remove this handler one time stream open event handler
                this._clearStreamHandler('streamOpened');

                //setup our sasl client
                this._connectParams.feats = jabberwerx.$(feats.data);

                //check for sasl auth support
                var supportedMechs = []
                //""
                jabberwerx.$(feats.data).find("mechanisms[xmlns='urn:ietf:params:xml:ns:xmpp-sasl']>mechanism").each(
                    function() {
                        supportedMechs.push(jabberwerx.$(this).text().toUpperCase());
                    });

                //match mech
                this._authMech = jabberwerx.sasl.createMechanismFor(this, supportedMechs);
                if (!this._authMech) {
                    throw new jabberwerx.Client.ConnectionError("{urn:ietf:params:xml:ns:xmpp-sasl}mechanism-too-weak");
                }
                //bind sasl auth handler stream element received event
                this._setStreamHandler('streamElementsReceived', '_handleAuthElements');
                this._handleAuthElements(); //start sasl
            } catch (ex) {
                this._handleConnectionException(ex);
            }
        },

        /**
         * @private
         */
        _handleAuthElements: function(elem) {
            try {
                elem = elem && jabberwerx.$(elem.data).get(0); //node as saslmech and stream expect a node
                elem = this._authMech.evaluate(elem);
                if (elem) {
                    this._stream.send(elem);
                } else {
                    var authComplete = this._authMech.complete;
                    this._authMech = undefined;
                    delete this._authMech;

                    if (!authComplete) {
                        throw new jabberwerx.SASLMechanism.SASLAuthFailure();
                    } else {
                        //reopen for binding
                        this._setStreamHandler('streamOpened', '_handleBindOpened');
                        this._stream.reopen();
                    }
                }
            } catch (ex) {
                this._handleConnectionException(ex);
            }
            return true;
        },

        /**
         * @private
         *
         * Method called when stream opening is ready to start JID binding.
         *
         * Method is invoked from the client's streamOpened event handler.
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {jabberwerx.NodeBuilder} feats Stream features
         */
        _handleBindOpened: function(feats) {
            try {
                //remove this one time stream open event handler
                this._clearStreamHandler('streamOpened');
                this._connectParams.bindJID = null;
                feats = jabberwerx.$(feats.data);//cheesy copy
                this._connectParams.feats = feats; //keep these around for extensions

                if (feats.find("bind[xmlns='urn:ietf:params:xml:ns:xmpp-bind']").length > 0) {
                    var bindIQ = new jabberwerx.IQ();
                    bindIQ.setType("set");
                    bindIQ.setID(jabberwerx.Stanza.generateID());

                    var builder = new jabberwerx.NodeBuilder('{urn:ietf:params:xml:ns:xmpp-bind}bind');
                    // resourceName exists ... use it for binding
                    if (this.resourceName) {
                        builder = builder.element("resource").
                                text(this._connectParams.resource).
                                parent;
                    }
                    bindIQ.setQuery(builder.data);

                    this._setStreamHandler("streamElementsReceived", "_handleBindElements");
                    this._stream.send(bindIQ.getNode());
                } else {
                    this._handleConnected();
                }
            } catch (ex) {
                this._handleConnectionException(ex);
            }
        },

        /**
         * @private
         *
         * Method called when elements are received after the stream has been
         * opened for bind.
         *
         * Method is the client's streamElementsReceived event handler and is
         * invoked when elements are received after a bind open.
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {Array} elements array of NodeBuilder representing xmpp stanzas
         */
        _handleBindElements: function(elements) {
            try {
                var ele = jabberwerx.$(elements.data);
                var newjid = ele.find("bind>jid");
                if (newjid.length > 0) {
                    this._connectParams.bindJID = jabberwerx.$(newjid).text();
                    // resourceName MUST always be whatever the server has specified
                    // extract the resource name of the new jid ... store resource name
                    var jid = jabberwerx.JID.asJID(this._connectParams.bindJID);
                    this.resourceName = jid.getResource();
                    // finish connection by remapping stream event handlers and
                    // starting rendezvous controllers
                    this._handleConnected();
                } else {
                    this._handleConnectionException(ele.children("error").get(0));
                }
            } catch (ex) {
                // just in case
                this._handleConnectionException(ex);
            }
        },

        /**
         * @private
         * close received while opening a stream
         */
        _handleClosed: function(err) {
            var msg = 'closed: ' + (err&&err.data?jabberwerx.util.serializeXML(err.data):'no error');
            jabberwerx.util.debug.log(msg);

            // stream close is due to in-band registration ... do not do normal disconnect logic
            if (this._connectParams.arg.register) {
                // clear the in-band registration flag
                this._connectParams.arg.register = false;

                // re-open the stream, giving the server some cool down time
                jabberwerx.system.setTimeout(this.invocation("_openStream"), 500);
            } else {
                this._disconnected(err.data);
            }

        },

        /**
         * @private
         */
        _handleConnectionException: function(ex) {
            this._clearStreamHandlers(); //ignore any streamClosed events, to us it's already closed
            try {
                this._stream.close();
            } catch (e) {}; //ignore stream state exceptions, can't really handle them
            //make an error node and fire through disconnected
            var n = this._exceptionToErrorNode(ex);
            jabberwerx.util.debug.log("Exception during connection: " + jabberwerx.util.serializeXML(n));
            this._disconnected(n);
        },

        /**
         * @private
         */
        _exceptionToErrorNode: function(ex) {
            if (jabberwerx.isElement(ex)) {
                return ex;
            }

            var err = new jabberwerx.NodeBuilder("error");
            if (ex instanceof jabberwerx.SASLMechanism.SASLAuthFailure) {
                err.element(ex.message);
            } else if (ex instanceof TypeError) {
                err.element("{urn:ietf:params:xml:ns:xmpp-stanzas}bad-request");
                if (ex.message) {
                    err.element("text").text(ex.message);
                }
            } else {
                //If this is a conflict exception, add the namespace to err data
                //This allows ErrorReporter to provide a useful message for the conflict exception
                var errNode = jabberwerx.$(ex).find("conflict");
                if (errNode && errNode.length != 0) {
                    //Get the namespace
                    var ns = jabberwerx.$(errNode).attr("xmlns");
                    //Appended message key to error node
                    err.element("{" + ns + "}conflict");
                } else {
                    var emsg =( ex && ex.message) ? ex.message : "{urn:ietf:params:xml:ns:xmpp-stanzas}internal-server-error";
                    try {
                        err.element(emsg);
                    } catch (e) {
                        err.element("{urn:ietf:params:xml:ns:xmpp-stanzas}internal-server-error");
                        //add element message as text
                        err.element("text").text(emsg);
                    }
                }
            }
            return err.data;
        },

        /**
         * Disconnect from the server.
         */
        disconnect: function() {
            if (this.isConnected()) {
                // if the resourceName was server generated ... clear it on disconnect
                if (this._autoResourceName) {
                    this.resourceName = null;
                }
                this.setClientStatus(jabberwerx.Client.status_disconnecting);
                this._stream.close();
                this._connectionAttempts = 0;
            }
        },

        /**
         * @type Boolean
         * @return Whether the client is currently connected
         */
        isConnected: function() {
            // check flag and client state, to allow "lifecycle" controllers
            // to do their work
            if (this._connectedRendezvous) {
                return true;
            }

            return (this.clientStatus == jabberwerx.Client.status_connected && this._stream.isOpen());
        },

       /**
        * @private
        * Set client status
        * @param {Number} status A Client.status_... constant
        * @param {Error} [error] An error object
        * @param {Function} [cb] callback to be executed when the change
        *        (and event) is done
        */
        setClientStatus: function(status, error, cb) {
            var prev = this.clientStatus;
            this.clientStatus = status;

            if (prev && (prev != status)) {
                var data = {
                    previous: prev,
                    next: status,
                    error: error
                };
                this.event('clientStatusChanged').trigger(data, null, cb);
            } else if (cb != null) {
                cb();
            }

            /* DEBUG-BEGIN */
            jabberwerx.util.debug.log('client status: ' + this.getClientStatusString(status),
                    'clientStatus');
            /* DEBUG-END */
        },

        /**
         * @param {Number} status A Client.status_... constant
         * @returns A string version of the status.
         * @type String
         */
        getClientStatusString: function(status) {
            switch (status) {
                case jabberwerx.Client.status_connected:
                    return jabberwerx._("Connected to {0} as {1}.",
                            (this.connectedServer ? this.connectedServer.jid : jabberwerx._("(unknown)")),
                            (this.connectedUser ? this.connectedUser.jid : jabberwerx._("(unknown)")));
                case jabberwerx.Client.status_connecting:
                    return jabberwerx._("Attempting to connect");
                case jabberwerx.Client.status_error:
                    return jabberwerx._("Connection error");
                case jabberwerx.Client.status_disconnecting:
                    return jabberwerx._("Disconnecting");
                case jabberwerx.Client.status_reconnecting:
                    return jabberwerx._("Reconnecting");
                default:
                    return jabberwerx._("Disconnected");
            }
        },

        /**
         * <p>Retrieves the current presence for this client. If not
         * connected, this method returns <tt>null</tt>.</p>
         *
         * @param   {Boolean} [primary] Optional flag which, if true, this method will return
         *          the primary presence for this client. If false or not specified, the
         *          resource presence is retrieved.
         * @return  {jabberwerx.Presence} The current presence, or
         *          <tt>null</tt> if none
         */
        getCurrentPresence: function(primary) {
            var me = this.connectedUser;
            return (me &&
                (primary ? me.getPrimaryPresence() : me.getResourcePresence(this.resourceName)))
                || null;
        },

        /**
         * Send an XMPP stanza.
         *
         * <p>If {rootName} is an instance of {@link jabberwerx.Stanza}, this method ignores
         * all other properties and sends the stanza directly. Otherwise, it is
         * expected to be the name of the root node (e.g. presence, iq, message).</p>
         *
         * @param {jabberwerx.Stanza|Element|String} rootName The name of the root node (presence, iq, etc), or the object
         *                 representation of the stanza.
         * @param {String} type The type attribute to set on the root, if any. (Set to '' or null to not set a type).
         * @param {String} to The to attribute to set on the root, if any. (Set to '' or null to not set a type).
         * @param {String} content XML content of the stanza.
         */
        sendStanza: function(rootName, type, to, content) {
            var s;

            if (rootName instanceof jabberwerx.Stanza) {
                s = rootName.clone();
            } else if (jabberwerx.isElement(rootName)) {
                s = jabberwerx.Stanza.createWithNode(rootName);
            } else {
                s = new jabberwerx.Stanza(rootName);
                if (to) {
                    s.setTo(to.toString());
                }
                if (type) {
                    s.setType(type.toString());
                }

                if (content) {
                    if (typeof content == 'string') {
                        try {
                            content = jabberwerx.util.unserializeXML(content);
                        } catch (ex) {
                            jabberwerx.util.debug.log("sendStanza could not parse: '" + content + "'");
                            throw ex;
                        }
                    }

                    new jabberwerx.NodeBuilder(s.getNode()).node(content);
                }

                s = jabberwerx.Stanza.createWithNode(s.getNode());
            }

            type = s.pType();
            this.event('before' + type + 'Sent').trigger(s);
            this._stream.send(s.getNode());

            // deal with presence special
            if (s instanceof jabberwerx.Presence) {
                var presence = s;
                type = presence.getType();
                if ((!type || (type == "unavailable")) && !presence.getTo()) {
                    presence = presence.clone();
                    presence.setFrom(this.fullJid.toString());

                    this.connectedUser.updatePresence(presence);
                }
            }
        },
        /**
         * Send an XMPP message. Assumes chat-type content with a body.
         *
         * @param {String} to The to attribute to set on the message.
         * @param {String} body The body of the message.
         * @param {String} [subject] The subject of the message
         * @param {String} [type] The type attribute to set on the message.
         * @param {String} [thread] A thread identifier, if any.
         */
        sendMessage: function(to, body, subject, type, thread) {
            this._assertConnected();
            var m = new jabberwerx.Message();
            if (to instanceof jabberwerx.Entity) {
                to = to.jid;
            } else {
                to = jabberwerx.JID.asJID(to);
            }
            m.setTo(to);
            m.setBody(body);
            if (subject) {
                m.setSubject(subject);
            }
            if (thread) {
                m.setThread(thread);
            }
            if (type) {
                m.setType(type);
            }

            // a bit hackish: in chat messages, add an XHTML-IM body,
            // even if they don't have any special markup in them.
            if (type === undefined || type == 'chat') {
                new jabberwerx.NodeBuilder(m.getNode()).element('{http://jabber.org/protocol/xhtml-im}html').
                        element('{http://www.w3.org/1999/xhtml}body').text(body);
            }

            this.sendStanza(m);
        },
        /**
         * Alias for {@link jabberwerx.Client#sendIq}.
         */
        sendIQ: function(type, to, content, callback, timeout) {
            return this.sendIq.apply(this, arguments);
        },
        /**
         * Send an XMPP IQ stanza.
         *
         * @param {String} type The type attribute to set on the iq.
         * @param {String} to The to attribute to set on the iq.
         * @param {String} content XML content of the iq stanza.
         * @param {Function} [callback] A callback to be invoked when
         *                   an IQ is recieved with a matching id.
         *                   This includes error stanzas.
         *                   If {timeout} is reached, a remote-server-timeout
         *                   error is used.
         * @param {Number} [timeout] A timeout (in seconds) wait on
                           a result or error IQ with a matching id
         * @type String
         * @returns The id set on the outgoing stanza.
         * @throws TypeError If {callback} is defined and is not a
         *         function; or if {timeout} is defined and not a
         *         number
         */
        sendIq: function(type, to, content, callback, timeout) {
            if (callback !== undefined && !jabberwerx.$.isFunction(callback)) {
                throw new TypeError("callback must be a function");
            }
            if (    timeout !== undefined &&
                    typeof(timeout) != "number" &&
                    !(timeout instanceof Number)) {
                throw new TypeError("timeout must be a number");
            }

            var i = new jabberwerx.IQ();

            if (type) {
                i.setType(type);
            }
            if (to) {
                i.setTo(to);
            }
            var id = jabberwerx.Stanza.generateID();
            i.setID(id);
            if (content) {
                if (typeof(content) == 'string') {
                    try {
                        content = jabberwerx.util.unserializeXML(content);
                    } catch (ex) {
                        jabberwerx.util.debug.log("sendIQ could not parse: '" + content + "'");
                        throw ex;
                    }
                }

                new jabberwerx.NodeBuilder(i.getNode()).node(content);
            }

            if (callback) {
                var that = this;
                var tid = undefined;
                var fn = function(evt) {
                    var elem = evt.data;

                    if (jabberwerx.isDocument(elem)) {
                        elem = elem.documentElement;
                    } else if (elem instanceof jabberwerx.Stanza) {
                        elem = elem.getNode();
                    }
                    // IQ tracking matching
                    elem = jabberwerx.$(elem);
                    if (elem.attr("type") != "result" && elem.attr("type") != "error") {
                        return;
                    }
                    if (elem.attr("id") != id) {
                        return;
                    }
                    //if no to was given compare full or bare jid against
                    //client's jid to ensure IQ came from server
                    var iqto = to; //recompute with each inbound IQ in case several outstanding server IQs
                    if (!iqto) {
                        iqto = (jabberwerx.JID.asJID(elem.attr("from")).getResource() === "")
                                ? that.fullJid.getBareJIDString()
                                : that.fullJid.toString();
                    }
                    if (elem.attr("from") != iqto) {
                        return;
                    }

                    try {
                        // make sure callback doesn't cause other problems
                        callback(elem.get()[0]);
                    } catch (ex) {
                        jabberwerx.util.debug.log("sendIq callback threw exception: " + ex);
                    }
                    evt.notifier.unbind(this.sendIq);

                    if (tid) {
                        jabberwerx.system.clearTimeout(tid);
                        tid = undefined;
                    }

                    // mark as handled
                    return true;
                };
                timeout = Number(timeout || 0);
                if (timeout > 0) {
                    var tfn = function() {
                        if (tid) {
                            that.event('beforeIqReceived').unbind(fn);

                            var iq = i.errorReply(jabberwerx.Stanza.ERR_REMOTE_SERVER_TIMEOUT);
                            iq.setFrom(to);
                            callback(iq.getNode());
                        }
                    }
                    tid = jabberwerx.system.setTimeout(tfn, timeout * 1000);
                }

                var idSel = '[id="' + id + '"]';
                this.event('beforeIqReceived').bind(fn);
            }
            this.sendStanza(i);

            return id;
        },
        /**
         * Send an XMPP presence stanza
         *
         * @param {String} [show] Optional show value: 'away', 'available', 'dnd', etc.
         * @param {String} [status] Optional status message.
         * @param {String} [to] Optional `to` attribute to set on the outgoing stanza.
         */
        sendPresence: function(show, status, to) {
            var p = new jabberwerx.Presence();
            if (typeof show == 'string') {
                p.setShow(show);
            }
            if (typeof status == 'string') {
                p.setStatus(status);
            }
            if (to !== undefined) {
                p.setTo(to);
            }

            this.sendStanza(p);
        },

        /**
         * Runs the passed jQuery selector string against the passed stanza.
         * @param {String} stanzaDoc XML of stanza
         * @param {String} selector jQuery selector
         * @returns A bare array (not jQuery-enhanced) of matching nodes, or a single node if only one matches.
         * @type Array|Node
         */
        selectNodes: function(stanzaDoc, selector) {
            var filteredDoc = stanzaDoc;
            jabberwerx.util.debug.log('running jquery with selector: ' + selector + " on doc:\n\n" + filteredDoc.xml, 'stanzaSelectors');
            var result = jabberwerx.$(selector, filteredDoc);
            var nodes = [];
            result.each(function(){ nodes.push(this); });
            if (nodes.length == 1) {
                return nodes[0];
            }
            if (nodes.length == 0) {
                return null;
            }
            return nodes;
        },

        /**
         * Gets all presence objects for the jid specified. Usual usage would be for bare jids. If a full jid is passed through
         * then only one presence object will be returned in the array.
         * @param {String|jabberwerx.JID} jid The jid to get all presence for
         * @returns An array of {@link jabberwerx.Presence} objects. Note that this array may be empty if no presence objects
         * are attached to this jid's entity
         * @type jabberwerx.Presence[]
         */
        getAllPresenceForEntity: function(jid) {
            var retVal = [];

            jid = jabberwerx.JID.asJID(jid);
            var entity = this.entitySet.entity(jid.getBareJIDString());
            if (entity) {
                if (!jid.getResource()) {
                    // This is a bare jid
                    retVal = entity.getAllPresence();
                } else {
                    retVal = [entity.getResourcePresence(jid.getResource())];
                }
            }
            return retVal;
        },

        /**
         * Gets the primary presence for the jid specified. If the jid is in bare jid format (ex. 'user@host') then the
         * highest priority presence for that entity will be returned. If the jid is in full jid format (ex. 'user@host/resource')
         * then the presence object for that resource only will be returned.
         * @param {String|jabberwerx.JID} jid The jid to get the primary presence of
         * @returns The primary presence or null if the entity / resource for this jid does not exist
         * @type jabberwerx.Presence
         */
        getPrimaryPresenceForEntity: function(jid) {
            jid = jabberwerx.JID.asJID(jid);

            var entity = this.entitySet.entity(jid.getBareJIDString());
            if (entity) {
                if (jid.getResource()) {
                    return entity.getResourcePresence(jid.getResource());
                } else {
                    return entity.getPrimaryPresence();
                }
            }
            return null;
        },

        /**
         * Handles presence stanzas with either no type or a type value of unavailable. Is invoked when the presenceReceived
         * event is fired and the presence has no type or a type of unavailable.
         * @private
         * @param {jabberwerx.EventObject} eventObj The eventObj passed through on the event trigger
         */
        _handlePresenceIn: function(eventObj) {
            var entity;
            var presence = eventObj.data;
            var type = presence.getType();
            if (!type || type == 'unavailable') {
                var bareJidStr = presence.getFromJID().getBareJIDString();
                if (bareJidStr) {
                    if (presence.getType() == 'unavailable') {
                        // If the type of the presence stanza is unavailabe then we want
                        // to remove the corresponding entity presence property (if the
                        // entity for the bare jid exists)
                        entity = this.entitySet.entity(bareJidStr);
                        if (entity) {
                            entity.updatePresence(presence);
                        }
                    } else {
                        entity = this._findOrCreateEntity(bareJidStr);
                        entity.updatePresence(presence);
                    }
                }
            }
        },

        /**
         * Checks for an entity corresponding to the jid in the entitySet. If none found then create a new one.
         * @private
         * @param {String} jid The jid for which the entity should be found or created.
         * @returns The found or created entity object.
         * @type jabberwerx.Entity
         */
        _findOrCreateEntity: function(jid) {
            var entity = this.entitySet.entity(jid);
            if (!entity) {
                // Create new jabberwerx.TemporaryEntity
                entity = this.entitySet.temporaryEntity(jid);
            }
            return entity;
        },

        /**
         * @private
         * clear the entity cache by destroying any temp entities client
         *  added, any entities added on behalf of the cache, or allow
         *  controllers to destroy their entities.
         */
        _cleanupEntityCache: function() {
            this.entitySet.startBatch();
            var that = this;
            this.entitySet.each(function(entity) {
                if (entity.controller && entity.controller.cleanupEntity)
                {
                    entity.controller.cleanupEntity(entity);
                }
                /* client added TempEnts so it should clean them as well */
                else if ((entity.controller === that.entitySet) ||
                           (entity instanceof jabberwerx.TemporaryEntity))
                {
                    entity.destroy();
                }
            });
            this.entitySet.endBatch();
        },

        /**
         * @private
         */
        willBeSerialized: function () {
            //obfuscate our password for store
            if (this._connectParams && this._connectParams.password) {
                //this persist may have come mid authentication (and unit testing)
                //clearing password here may cause persisted authentication attempt to fail (mid SASL for instance) but chances are this code will never execute
                if (jabberwerx._config.baseReconnectCountdown == 0) {
                    this._connectParams.password = "";
                } else {
                    this._connectParams.password = jabberwerx.util.encodeSerialization(this._connectParams.password);
                }
            }

            //stop processing received stanzas
            this._stopReceiveQueue(false);
            this._stanzaRecvQ = jabberwerx.$.map(
                    this._stanzaRecvQ,
                    function() {
                        return this.xml;
                    });
        },

        /**
         * @private
         */
        wasUnserialized: function () {
            //unobfuscate our password
            if (this._connectParams && this._connectParams.password) {
                this._connectParams.password = jabberwerx.util.decodeSerialization(this._connectParams.password);
            }
        },
        /**
         * @private
         */
        graphUnserialized: function() {
            //start processing received stanzas...
            //...AFTER all other objects have rehydrated
            if (this._stanzaRecvQ.length) {
                this._stanzaRecvQ = jabberwerx.$.map(
                        this._stanzaRecvQ,
                        function() {
                            return jabberwerx.util.unserializeXML(this);
                        });
                this._startReceiveQueue(true);
            }
        },

        /**
         * @private
         * @throws {jabberwerx.Client.NotConnectedError}
         */
        _assertConnected: function() {
            if (!this.isConnected()) {
                throw new jabberwerx.Client.NotConnectedError();
            }
        },

        /**
         * @private
         */
        _handleConnected: function() {
            //clear password from memory
            if (jabberwerx._config.baseReconnectCountdown == 0) {
                this._connectParams.password = "";
            }
            //setup running element handlers
            this._clearStreamHandler("streamOpened");
            this._setStreamHandler("streamElementsReceived", "_handleElementsReceived");
            this._setStreamHandler("streamElementsSent", "_handleElementsSent");

            //set our new jid
            if (this._connectParams.bindJID) {
                var jid = jabberwerx.JID.asJID(this._connectParams.bindJID);
                if (!jid.getBareJID().equals(this.connectedUser.jid)) {
                    // username/domain changed...
                    this.entitySet._renameEntity(this.connectedUser,
                                                 jid.getBareJID());
                    if (this.connectedServer.jid.getDomain() != jid.getDomain()) {
                        this.entitySet._renameEntity(this.connectedServer,
                                                     jid.getDomain());
                    }
                }
                // assume resource changed...
                this.resourceName = jid.getResource();
                //this._setFullJid();
            }

            this._connectParams.bindJID = null;

            // start the connected batch, all connect rendezvous run under a batch
            this.entitySet.startBatch();
            // fake the status change
            var rnz = new jabberwerx.Rendezvous(this.invocation("_completeConnected"));
            this._connectedRendezvous = rnz;
            var that = this;
            var delayed = jabberwerx.reduce(this.controllers,
                                            function(ctrl, value) {
                                                return rnz.start(ctrl) || value;
                                            });

            if (!delayed) {
                this._completeConnected();
            }
        },

        /**
         * @private
         */
        _connected: function() {
            // in place for internal extensibility

            // Trigger the 'clientConnected' event for all bound listeners
            this.event('clientConnected').trigger();
        },

        /**
        * @private
        *
        * Cleanup after disconnect. This method may be called during a
        * connection attempt, as part of a user requested disconnect or when the
        * server severs connection.
        *_reconnectAttempts
        * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
        *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
        *
        * @param {DOM} [err] error that forced this disconnection. May be NULL
        *                    or undefined indicating a user equested disconnect.
        */
        _disconnected: function(err) {
            //clear password from memory, could be overkill
            if (jabberwerx._config.baseReconnectCountdown == 0) {
                this._connectParams.password = "";
                delete this._connectParams.password;
            }

            // Check err condition and schedule reconnect attempt as needed.
            // status_disconnecting -> user disconnect, never reconnect.
            // status_connecting, reconnection during a connection failure
            // is not supported (reconnection only allowed after being connected)
            // note clientStatus will be status_reconnecting during recon attempt
            if ((this.clientStatus != jabberwerx.Client.status_disconnecting) &&
                (this.clientStatus != jabberwerx.Client.status_connecting) &&
                this._shouldReconnect(err))
            {
                this._startReconnectCountdown();
            }

            //cleanup
            this._clearStreamHandlers();
            if (this.connectedUser) {
                // clear presence!
                this.connectedUser.updatePresence();
            }
            this.connectedUser = null;
            //this._setFullJid();

            this.connectedServer = null;
            this._authMech = undefined;
            delete this._authMech;

            this._cleanupEntityCache();

            // if the resourceName was server generated and not a reconnection ... clear it
            if (this._autoResourceName && (this._countDownOn == 0)) {
                this.resourceName = null;
            }

            // clear rendezvous!
            delete this._connectedRendezvous;

            // clear out received pendings
            this._stopReceiveQueue(true);

            //event to every one else
            this.setClientStatus(jabberwerx.Client.status_disconnected, err);

            // Trigger the 'clientDisconnected' event for all bound listeners
            this.event('clientDisconnected').trigger(err);
       },

        /**
         * @private
         */
        _handleElementsReceived: function(evt) {
            //for each element, pump through _handleStanzaIn
            var elements = jabberwerx.$(evt.data).get();

            // store the current batch away
            this._stanzaRecvQ = this._stanzaRecvQ.concat(elements);
            /*DEBUG-BEGIN*/
            jabberwerx.util.debug.log("client RECEIVED elements to process: " +
                                      this._stanzaRecvQ.length,
                                      "rawStanzaLogging");
            /*DEBUG-END*/
            this._startReceiveQueue(false);
        },
        _handleElementsSent: function(evt) {
            var elements = jabberwerx.$(evt.data);
            for (var i = 0; i < elements.length; ++i) {
                this._handleElementOut(elements.get(i));
            }
        },

        /**
         * Cancels a reconnect if one is currently in the pipeline. Triggers the
         * reconnectCancelled event.
         */
        cancelReconnect: function() {
            if (this._reconnectTimerID !== null) {
                jabberwerx.system.clearTimeout(this._reconnectTimerID);
                this._reconnectTimerID = null;
                this._countDownOn = 0;
                this.event('reconnectCancelled').trigger();
            }
        },

        /**
         * <p>Determines if this client is connected in a secure or trusted
         * manner.</p>
         *
         * @returns <tt>true</tt> If the stream is considered secure
         * @type Boolean
         */
        isSecure: function() {
            return this._stream.isSecure();
        },

        /**
         * @private
         * Determine if a reconnect attempt should be made based on given
         * disconnection error.
         *
         * Default behavior is to return falses if
         * disconnect occurred during a connection (or disconnection) attempt
         * (only want to try reconnecting if previously connected) and
         *      no error,
         *      resource conflicts
         *      system shutdowns
         *  true on all other errors.
         *
         * NOTE: This function is INTERCEPTED by the jabberwerx.cisco library
         *       in the cupha.js file. @see {@link jabberwerx.cisco.cupha}
         *
         * @param {DOM} err Error stanza that caused disconnection,
         *                  null if no error occurred (normal disconnect)
         * @returns true if the error should start a reconnection attempt
         */
        _shouldReconnect: function(err) {
            return jabberwerx.$("system-shutdown, conflict", err).length === 0;
        },

        /**
         * @private
         * Starts the countdown for a reconnection attempt.
         */
        _startReconnectCountdown: function() {
            var base = Number(jabberwerx._config.baseReconnectCountdown);

            // base <= 0 implies no reconnection
            if (base > 0) {
                var reconnectCountdown = base + Math.round( (Math.random() - 0.5) * (base / 5));

                this._reconnectTimerID = jabberwerx.system.setTimeout(
                                           this.invocation('_reconnectTimeoutHandler'),
                                           reconnectCountdown * 1000);
                this._countDownOn = reconnectCountdown;
                this.event('reconnectCountdownStarted').trigger(reconnectCountdown);
            }
        },

        /**
         * @private
         * Handles the reconnect timer timeout. Set the client state to reconnecting and attempt
         * a reconnect.
         */
        _reconnectTimeoutHandler: function() {
            this._countDownOn = 0;
            this._reconnectTimerID = null;
            this._connectParams.arg.reconnecting = true;

            try {
                this.connect(this._connectParams.jid, this._connectParams.password,
                    this._connectParams.arg);
            } catch (ex) {
                jabberwerx.util.debug.log("Failed to reconnect: " + ex.message);
            }
        },

        /**
         * @private
         */
        _handleElementOut: function(stanza) {
            stanza = jabberwerx.Stanza.createWithNode(stanza);

            var stanzaType = stanza.pType();
            //var msg = "triggering " +stanzaType + "Sent event with: " + stanza.xml();
            this.event(stanzaType + "Sent").trigger(stanza);
        },

        /**
         * @private
         */
        _startReceiveQueue: function() {
            if (this._stanzaRecvWorker || !this._stanzaRecvQ.length) {
                return;
            }

            this._stanzaRecvWorker =jabberwerx.system.setTimeout(
                    this.invocation("_processReceiveQueue"),
                    jabberwerx.Client.STANZA_PROCESS_INTERVAL);
        },
        /**
         * @private
         */
        _stopReceiveQueue: function(clear) {
            if (this._stanzaRecvWorker) {
                jabberwerx.system.clearTimeout(this._stanzaRecvWorker);
                delete this._stanzaRecvWorker;
            }

            if (clear) {
                this._stanzaRecvQ = [];
            }
        },
        /**
         * @private
         */
        _processReceiveQueue: function() {
            var idx = 0;

            // clear the worker key now; re-added if we don't finish stanzas
            delete this._stanzaRecvWorker;
            for (idx = 0; idx < jabberwerx.Client.STANZA_PROCESS_COUNT; idx++) {
                // "processStanza" wrapper function was created to localize the scope of the "stanza" variable so that
                // the for loop iterations are protected from each other with regard to this variable, relative
                // to the asynchronous call to "trigger" on the notifiers.
                var processStanza = function(stanza, stanzaType, notifiers, that, handled) {

                    var handleStanza = function(results) {
                        handled = handled || Boolean(results);

                        if (!handled) {
                            if (notifiers.length) {
                                notifiers.shift().trigger(  stanza,
                                                            undefined,
                                                            handleStanza);
                            } else {
                                if (    !results &&
                                        stanzaType == 'iq' &&
                                        (stanza.getType() == 'get' || stanza.getType() == 'set')) {
                                    //automatically send feature-not-implemented
                                    stanza = stanza.errorReply(jabberwerx.Stanza.ERR_FEATURE_NOT_IMPLEMENTED);
                                    that.sendStanza(stanza);
                                }
                            }
                        }
                    };

                    handleStanza(false);
                }

                var stanza = this._stanzaRecvQ.shift();

                if (!stanza) {
                    return;
                }

                // stored as a DOM; convert to stanza
                stanza = jabberwerx.Stanza.createWithNode(stanza);

                var stanzaType = stanza.pType();
                var notifiers = [
                        this.event('before' + stanzaType + 'Received'),
                        this.event(stanzaType + 'Received'),
                        this.event('after' + stanzaType + 'Received')
                ];

                var that = this;
                var handled = false;

                processStanza(stanza, stanzaType, notifiers, that, handled);
            }

            this._startReceiveQueue(true);
        },

        /**
         * @private
         */
        _handleIqTime: function(evt) {
            var now = new Date();
            var tz;
            tz = now.toString();
            tz = tz.substring(tz.lastIndexOf(' ') + 1);

            var iq = evt.data;
            iq = iq.reply();

            var query = new jabberwerx.NodeBuilder(iq.getQuery());
                query.element('display').text(now.toLocaleString());
                query.element('utc').text(jabberwerx.generateTimestamp(now, true));
                query.element('tz').text(tz);

            this.sendStanza(iq);

            return true;
        },
        /**
         * @private
         */
        _handleEntityTime: function(evt) {
            var now = new Date();
            var tzo;
            var h, m;

            tzo = now.getTimezoneOffset();
            h = tzo / 60;
            m = tzo % 60;

            tzo =   (tzo > 0 ? '-' : '+') +
                    (h < 10 ? '0' + h : h) + ':' +
                    (m < 10 ? '0' + m : m);

            var iq = evt.data;
            iq = iq.reply();
            var query = new jabberwerx.NodeBuilder(iq.getQuery());
                query.element('tzo').text(tzo);
                query.element('utc').text(jabberwerx.generateTimestamp(now, false));

            this.sendStanza(iq);

            return true;
        },

        /**
         * @private
         */
        _generateUsername: function() {
            return /*DEBUG-BEGIN*/'_cf_' +/*DEBUG-END*/ hex_md5(this._guid + ((this._connectionAttempts) + (new Date().valueOf)));
        },
        /**
         * @private
         */
        _generatePassword: function(username) {
            //replaced innerWidth + innerHeight as the "random" portion
            //[1x1, 1920x1080]
            return hex_md5(username + Math.floor(Math.random() * 3000) + 2);
        },
        /**
         * @private
         */
        _completeConnected: function(rnz) {
            delete this._connectedRendezvous;
            // register for feature query callback
            //end connection batch before eventing connected
            this.entitySet.endBatch();

            this.setClientStatus(jabberwerx.Client.status_connected,
                                 null,
                                 this.invocation("_connected"));
        },
        /**
         * @private
         * IE 8 compatability. function and all references may be
         * removed when IE8 is no longer supported.
         * update fullJid property.
         */
        // _setFullJid: function() {
        //     this.fullJid = this.connectedUser
        //                       ? jabberwerx.JID.asJID(this.connectedUser.jid + (this.resourceName ? "/" + this.resourceName : ""))
        //                       : null;
        // },

        /**
         * The collection of registered Controllers for this Client.
         * Controllers are responsible for registering themselves with
         * their owning client.
         */
        controllers: {},
        /**
         * The resource name for this client.
         * @type String
         */
        resourceName: null,
        /**
         * The user with whose JID we are currently logged in.
         * @type jabberwerx.User
         */
        connectedUser: null,
        /**
         * The full JID of the currently connected user as a jabberwerx.JID, null if
         * not connected.This property is read only.
         * Convenience property equivalent to
         * jabberwerx.JID.asJID(client.connectUser.jid + "/" + client.resourceName).
         * Note - this property will have a non-null value whenever connectedUser
         * has been populated. fullJid will be available immediately after
         * connect has been called (before actual connection is complete).
         *
         * @type jabberwerx.JID
         * @return The currently connected full JID, or null if not connected.
         */
        fullJid: null,

        /**
         * @private
         * The stream
         * @type jabberwerx.Stream
         */
        _stream: null,

        /**
         * @private
         *  currently assigned stream handlers
         */

        _streamHandlers: [],
        /**
         * The current client status.
         * @type Number
         */
        clientStatus: 3, //start off diconnected
        /**
         * The server to which we are currently connected.
         * @type jabberwerx.Server
         */
        connectedServer: null,
        /**
         * This entity set must be used to get references to any entity needed for the lifetime of this client/connection.
         * @type jabberwerx.EntitySet
         */
        entitySet: null,
        /**
         * Whether auto-registration is active.
         * @type Boolean
         */
        autoRegister: false,

        /**
         * @private
         */
        _stanzaRecvQ: [],
        /**
         * @private
         */
        _connectionAttempts: 0,
        /**
         * @private
         */
        _reconnectTimerID: null,
        /**
         * @private
         */
        _connectParams: {},
        /**
         * @private
         */
        _autoResourceName: false,
        /**
         * @private
         */
        _countDownOn: 0

    }, 'jabberwerx.Client');

    try {
        //readonly enumerable permanent
        Object.defineProperty(jabberwerx.Client.prototype, "fullJid",
                              {get : function() {
                                    return this.connectedUser
                                       ? jabberwerx.JID.asJID(this.connectedUser.jid + (this.resourceName ? "/" + this.resourceName : ""))
                                       : null;
                                },
                              enumerable : true,
                              writeable: false,
                              configurable : false});
        //redefine now useless _setFullJid function
        //jabberwerx.Client._setFullJid = function() {/*noop*/};
    } catch (ex) {
        // IE 8, engines not supporting defineProperty on Object.
        // see Client._setFullJid
    }

    /**
     * @constant
     * Indicates the client is connecting
     */
    jabberwerx.Client.status_connecting = 1;
    /**
     * @constant
     * Indicates the client is connected
     */
     jabberwerx.Client.status_connected = 2;
    /**
     * @constant
     * Indicates the client is disconnected
     */
     jabberwerx.Client.status_disconnected = 3;
    /**
     * @constant
     * Indicates the client is disconnecting
     */
     jabberwerx.Client.status_disconnecting = 4;
    /**
     * @constant
     * Indicates the client is starting a reconnect attempt
     */
     jabberwerx.Client.status_reconnecting = 5;

    /**
     * @class jabberwerx.Client.NotConnectedError
     * <p>Error to indicate the client is not connected, when the operation expects a
     * connection.</p>
     * @description
     * <p>Creates a new NotConnectedError with the given message.</p>
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Client.NotConnectedError = jabberwerx.util.Error.extend('The client is not connected.');
    /**
     * @class
     * <p>Error thrown when an error is encountered while trying to
     * establish the connection.</p>
     *
     * @description
     * <p>Creates a new ConnectionError with the given message.</p>
     *
     * @param {String} msg The error condition message
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Client.ConnectionError = jabberwerx.util.Error.extend();
    /**
     * @class
     * <p>Error thrown when an error is encountered after the connection
     * is established.</p>
     *
     * @description
     * <p>Creates a new DisconnectError with the given message.</p>
     *
     * @param {String} msg The error condition message
     * @extends jabberwerx.util.Error
     * @minimal
     */
    jabberwerx.Client.DisconnectError = jabberwerx.util.Error.extend();

    /**
     * Interval between stanza processing loops
     * @private
     */
    jabberwerx.Client.STANZA_PROCESS_INTERVAL = 1;
    /**
     * Number of stanzas to process in a loop
     * @private
     */
    jabberwerx.Client.STANZA_PROCESS_COUNT = 5;
})(jabberwerx);

/*build/dist/CAXL-debug-2014.04.10787/src/controller/Controller.js*/
/**
 * filename:        Controller.js
 *
 * Portions created or assigned to Cisco Systems, Inc. are
 * Copyright (c) 2009-2011 Cisco Systems, Inc.  All Rights Reserved.
 */

;(function(jabberwerx){
    /** @private */
    jabberwerx.Controller = jabberwerx.JWModel.extend(/** @lends jabberwerx.Controller.prototype */ {
        /**
         * @class
         * <p>Abstract base class for all controller types.</p>
         *
         * <p>All controller types have a unique simple name (e.g. "roster" for
         * the RosterController, or "capabilities" for the
         * CapabilitiesController).</p>
         *
         * @description
         * Creates a new jabberwerx.Controller with the given owning client.
         * This method sets the name and client for this Controller, and
         * stores it in the {@link jabberwerx.Client#controllers} hashtable.
         *
         * @param {jabberwerx.Client} client The owning client
         * @param {String} name The common name for this controller
         * @throws {TypeError} if {client} is not the correct type, or if
         *                   {name} is not a non-empty string.
         * @constructs jabberwerx.Client
         * @extends jabberwerx.JWModel
         * @minimal
         */
        init: function(client, name) {
            this._super();

            if (!name || typeof name != 'string') {
                throw new TypeError("name must be a non-empty string");
            }
            if (!(client instanceof jabberwerx.Client)) {
                throw new TypeError("client must be a jabberwerx.Client");
            }

            this.client = client;
            this.name = name;

            // overwrites any other controller with this name
            var orig = client.controllers[name];
            if (orig) {
                orig.destroy();
            }
            client.controllers[name] = this;
        },
        /**
         * <p>Destroys this Controller. This method deletes this controller
         * from its owning client.</p>
         *
         * <p>Subclasses SHOULD override this method to perform any additional
         * cleanup (e.g. removing event callbacks), but MUST call the
         * superclass' implementation (this._super()).</p>
         */
        destroy: function() {
            if (    this.client &&
                    this.client.controllers &&
                    this.client.controllers[this.name]) {
                delete this.client.controllers[this.name];
                delete this.client;
            }

            this._super();
        },

        /**
         * <p>Users should not call this method directly. Instead, call
         * {@link jabberwerx.Entity#update}.</p>
         *
         * @param {jabberwerx.Entity} entity The entity to update
         * @throws {TypeError} if entity is not an instance of Jabberwerx.Entity
         * @returns {jabberwerx.Entity} updated entity
         */
        updateEntity: function(entity) {
            if (!(entity && entity instanceof jabberwerx.Entity && entity.controller === this)) {
                throw new TypeError("invalid entity to update");
            }
            this.client.entitySet.event("entityUpdated").trigger(entity);

            return entity;
        },

        /**
         * <p>Users should not call this method directly. Instead, call
         * {@link jabberwerx.Entity#remove}.</p>
         *
         * @param {jabberwerx.Entity} entity The entity to remove
         * @throws {TypeError} if entity is not an instance of Jabberwerx.Entity
         * @returns {jabberwerx.Entity} deleted entity
         */
        removeEntity: function(entity) {
            if (!(  entity &&
                    entity instanceof jabberwerx.Entity &&
                    entity.controller === this)) {
                throw new TypeError("invalid entity to delete");
            }
            entity.destroy();

            return entity;
        },

        /**
         * <p>Cleanup the given entity on behalf of the
         * client's entity cache {@link jabberwerx.EntitySet}.</p>
         *
         * <p>Users should not call this method directly.</p>
         *
         * <p>Subclasses SHOULD override this method and use it to destroy
         * the given entity. Controllers MAY choose to leave the entity in the
         * cache between sessions (pubsub nodes), this is the behavior
         * by default.
         *
         * This method is called just prior to the clientStatusChanged
         * status_disconnected event. It is called once for each entity
         * the controller owns (the controller used during the entity's
         * creation {@link jabberwerx.Entity#init).</p>
         *
         * <p>NOTE - This method is called within a batch update
         * {@link jabberwerx.Entity.EntitySet#startBatch}.</p>
         *
         * @param {jabberwerx.Entity} entity The entity to cleanup and destroy
         */
        cleanupEntity: function(entity) {
        },

        /**
         * The client object that is used to manage roster API calls
         *
         * @type jabberwerx.Client
         */
        client: null,
        /**
         * The name of this controller.
         *
         * @type String
         */
        name: ''
    }, 'jabberwerx.Controller');
})(jabberwerx);

module.exports = jabberwerx;
