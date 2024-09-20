var ZSDKUtil = (function(ZSDKUtil) { // eslint-disable-line

  var QueryParams = GetQueryParams();

  // Global Logger instance which will be acquired and shared by other modules.
  var GlobalLogger;

  // minimal Logging utility.
  function ZLogger() {}
  ZLogger.prototype.Info = function () {
    if (ZSDKUtil.isDevMode() || ZSDKUtil.isLogEnabled()) {
        console.info.apply(console, arguments); // eslint-disable-line
    }
  };
  ZLogger.prototype.Error = console.error;  // eslint-disable-line
  function getLogger() {
    if ( !GlobalLogger || !(GlobalLogger instanceof ZLogger)) {
      GlobalLogger = new ZLogger(); // Logging instance for Core Framework
    }

    return GlobalLogger;
  }

  function GetQueryParams(URL) {
    // TODO: Handle hash case too.
    var qParams = {};
    var currentURL = URL || window.location.href;
    var splittedParams = currentURL.substr(currentURL.indexOf('?') + 1).split('&');
    splittedParams.forEach(function (ele) {
      var miniSplit = ele.split('=');
      qParams[miniSplit[0]] = miniSplit[1];
    });

    // decoding serviceOrigin URL
    if ( qParams.hasOwnProperty('serviceOrigin') ) {
      qParams.serviceOrigin = decodeURIComponent(qParams.serviceOrigin);
    }

    return qParams;
  }
  function isDevMode() {
    return QueryParams && QueryParams.isDevMode;
  }
  function isLogEnabled() {
    return QueryParams && QueryParams.isLogEnabled;
  }

  ZSDKUtil.GetQueryParams = GetQueryParams;
  ZSDKUtil.isDevMode = isDevMode;
  ZSDKUtil.isLogEnabled = isLogEnabled;
  ZSDKUtil.getLogger = getLogger;

  return ZSDKUtil;

})(window.ZSDKUtil || {});

var ZSDKMessageManager = (function(ZSDKMessageManager) { // eslint-disable-line

  var rootInstance;
  var Logger = ZSDKUtil.getLogger();
  var promiseIDCtr = 100;
  var PromiseQueue = {}; // Queue holding all the GetRequest promises

  var AuthParentWindow, AuthParentOrigin;

  var qParams = ZSDKUtil.GetQueryParams();

  function Init(widgetInstance) { // Config is for future use
    rootInstance = widgetInstance;

    window.addEventListener('message', MessageHandler);
    window.addEventListener('unload', DERegisterApp);
  }

  // Authorization Check in SDK side.
  function isAuthorizedMessage(MEvent) {
    var incomingSource = MEvent.source;
    var incomingOrigin = MEvent.origin;

    if ( rootInstance.isRegistered() && AuthParentWindow === incomingSource && AuthParentOrigin === incomingOrigin ) {
      return true;
    }

    return new Error('Un-Authorized Message.');
  }
  function MessageHandler(MessageEvent) {
    /* Added for backward compatibility support */
    var data;
    try {
      data = typeof MessageEvent.data === 'string' ? JSON.parse(MessageEvent.data) : MessageEvent.data;
    } catch (e) {
      data = MessageEvent.data;
    }
    var messageType = data.type;

    try {

      if ( messageType === '__REGISTER__' || isAuthorizedMessage(MessageEvent)) {

        switch (messageType) {

        case '__REGISTER__':
          HandleRegister(MessageEvent, data); break;
        case '__EVENT_RESPONSE__':
          HandleEventResponse(MessageEvent, data); break;
        default:
          HandleCustomEvent(MessageEvent, data); break;

        }
      }
    } catch (e) {
      Logger.Error('[SDK.MessageHandler] => ', e.stack);
    }
  }

  function HandleRegister(MessageEvent, payload) {
    AuthParentWindow = window.parent;
    AuthParentOrigin = qParams.serviceOrigin;
    var origin = window.location.origin;
    rootInstance.dcType = origin.split('.').pop().toUpperCase();
    if (rootInstance.dcType === 'COM') {
      rootInstance.dcType = 'US';
    }
    rootInstance.key = payload.uniqueID;
    rootInstance.parentWindow = AuthParentWindow;
    rootInstance._isRegistered = true;

    var registerEventObj = {
      'type': '__REGISTER__',
      'widgetOrigin': getCurrentURLPath(),
      'uniqueID': rootInstance.key
    };
    SendEvent(registerEventObj, rootInstance);

    var initData = payload.data;
    executeEventHandlers(rootInstance, 'Load', initData);
  }
  function HandleCustomEvent(MessageEvent, data) {
    var widgetID = data.widgetID;
    var eventName = data.eventName;
    var responseArr;
    if ( rootInstance.key === widgetID ) { // Checking 'EMIT' type to prevent circular exec.
      responseArr = executeEventHandlers(rootInstance, eventName, data.data);
    } else {
      var childInstance = rootInstance._childWidgets[widgetID];
      if ( childInstance ) {
        responseArr = executeEventHandlers(childInstance, eventName, data.data);
      }
    }
    if (data.isPromise) {
      var obj = {};
      Promise.all(responseArr).then(function (res) {
        obj.response = res;
        obj.widgetID = widgetID;
        obj.sourceWidgetID = rootInstance.key;
        sendPromiseEvent(data, obj);
      }).catch(function (err) {
        obj.response = err;
        obj.widgetID = widgetID;
        obj.sourceWidgetID = rootInstance.key;
        sendPromiseEvent(data, obj);
      });
    }
  }

  function sendPromiseEvent(data, responseObj) {
    var eventObject = {
      'type': '__EVENT_RESPONSE__',
      'widgetOrigin': getCurrentURLPath(),
      'uniqueID': rootInstance.key,
      'eventName': data.eventName,
      'data': responseObj,
      'promiseID': data.promiseID
    };
    SendEvent(eventObject, rootInstance);
  }

  function executeEventHandlers(widgetInstance, eventName, data) {
    var handlersArray = widgetInstance.eventHandlers[eventName], responseArr = [];
    if ( Array.isArray(handlersArray)) {
      for ( var i = 0; i < handlersArray.length; i++) {
        var response, responseObj;
        try {
          response = handlersArray[i].call(widgetInstance, data);
          if (response instanceof Promise) {
            responseObj = response.then(function (_res) { return { isSuccess: true, response: _res }; })
              .catch(function (err) {  return { isSuccess: false, response: err }; });
          } else {
            responseObj = { isSuccess: true, response: response };
          }
        } catch (e) {
          responseObj = { isSuccess: false, response: e };
        }
        responseArr.push(responseObj);
      }
    }
    return responseArr;
  }

  function HandleEventResponse(MessageEvent, payload) {
    var promiseID = payload.promiseID;
    var response = payload.data;
    var isResolved = payload.isSuccess;

    if (PromiseQueue.hasOwnProperty(promiseID)) {

      if ( isResolved ) {
        PromiseQueue[promiseID].resolve(response);
      } else {
        PromiseQueue[promiseID].reject(response);
      }

      PromiseQueue[promiseID] = undefined; // eslint-disable-line
      delete PromiseQueue[promiseID];
    } else {
      // TODO: Handle if there is no promiseID present
    }
  }

  // Sends events to ZFramework. TODO: Add to queue if not yet 'registered'.
  function SendEvent(eventObject, instance) {

    var isPromiseEvent = eventObject.isPromise;
    var PromiseID;
    if ( isPromiseEvent ) {
      PromiseID = getNextPromiseID();
      eventObject.promiseID = PromiseID; // eslint-disable-line
    }

    if ( instance ) {
      eventObject.uniqueID = (instance.parentWidget || instance).key;
      eventObject.widgetID = instance.key;
    }
    eventObject.time = new Date().getTime();

    PostMessage(eventObject);

    if ( isPromiseEvent ) {
      return AddToPromiseQueue(PromiseID);
    }

  }
  function getNextPromiseID() {
    return 'Promise' + promiseIDCtr++;
  }
  function AddToPromiseQueue(promiseID) {

    var promise = new Promise(function (resolve, reject) {

      // Adding the promise to queue.
      PromiseQueue[promiseID] = {
        resolve: resolve,
        reject: reject,
        time: new Date().getTime()
      };
    });

    return promise;
  }

  function DERegisterApp() {
    var deRegisterSDKClient = {
      type: '__DEREGISTER__',
      uniqueID: rootInstance.key
    };

    PostMessage(deRegisterSDKClient);
  }

  // Helpers
  function PostMessage(data) {

    if ( typeof data === 'object' ) {
      data.widgetOrigin = encodeURIComponent(getCurrentURLPath());
    }

    if ( !AuthParentWindow ) {
      throw new Error('Parentwindow reference not found.');
    }

    AuthParentWindow.postMessage(data, qParams.serviceOrigin);

  }
  function getCurrentURLPath() {
    return window.location.protocol + '//' + window.location.host + window.location.pathname;
  }
  ZSDKMessageManager.Init = Init;
  ZSDKMessageManager.SendEvent = SendEvent;

  return ZSDKMessageManager;
})(window.ZSDKMessageManager || {});

;window.ZSDK = (function() {  // eslint-disable-line

  var rootInstance;
  var qParams = ZSDKUtil.GetQueryParams();

  /* New Code */
  function Widget(opts) {
    this.serviceOrigin = opts.serviceOrigin || qParams.serviceOrigin;
    this.parentWidget = opts.parentWidget;
    this.key = opts.key;
    this._isRegistered = false;
    this._childWidgets = {};
    this.eventHandlers = Object.create(null);
    this.meta;
  }
  Widget.prototype.on = function (eventName, fn) {
    if (typeof eventName !== 'string') { throw new Error('Invalid eventname parameter passed.'); }
    if (typeof fn !== 'function') { throw new Error('Invalid function parameter passed.'); }

    var handlersArray = this.eventHandlers[eventName];
    if (!Array.isArray(handlersArray)) {
      this.eventHandlers[eventName] = handlersArray = [];
    }
    handlersArray.push(fn);

    if ( eventName === 'Load' ) return;
    var eventBindObj = {
      type: '__EVENT_BIND__',
      eventName: eventName,
      count: handlersArray.length
    };
    if (
      ( this.parentWidget && !this.parentWidget.isRegistered() ) ||
      ( !this.parentWidget && !this.isRegistered() )
    ) {
      ( this.parentWidget || this ).on('Load', function () {
        ZSDKMessageManager.SendEvent(eventBindObj, this);
      });
    } else {
      ZSDKMessageManager.SendEvent(eventBindObj, this);
    }
  };
  Widget.prototype.off = function (eventName, fn) {
    if (typeof eventName !== 'string') { throw new Error('Invalid eventname parameter passed.'); }
    if (typeof fn !== 'function') { throw new Error('Invalid function parameter passed.'); }

    var handlersArray = this.eventHandlers[eventName];
    if (!Array.isArray(handlersArray)) {
      return;
    }

    var indices = [], i;
    for (i = 0; i < handlersArray.length; i++) {
      if (handlersArray[i] === fn) {
        indices.push(i);
      }
    }
    while (indices.length) {
      handlersArray.splice(indices.pop(), 1);
    }
  };
  Widget.prototype._sendEvent = function (eventName, data, isPromise) {
    var messageObj = {
      type: '__EVENT__',
      eventName: eventName,
      data: data,
      isPromise: isPromise
    };
    return ZSDKMessageManager.SendEvent(messageObj, this);
  };
  Widget.prototype.emit = function (eventName, data) {
    // Emti event to handlers in this context itself.

    var messageObj = {
      type: '__EMIT__',
      eventName: eventName,
      data: data
    };

    ZSDKMessageManager.SendEvent(messageObj, this);
  };
  Widget.prototype.isRegistered = function () { return this._isRegistered; };
  Widget.prototype.fetch = function (opts) {
    var messageObj = {
      eventName: '__HTTP__',
      isPromise: true,
      options: opts
    };
    return ZSDKMessageManager.SendEvent(messageObj, this);
  };
  Widget.prototype.createInstance = function (opts) {
    var messageObj = {
      eventName: '__CREATE_INSTANCE__',
      isPromise: true,
      options: opts
    };
    return ZSDKMessageManager.SendEvent(messageObj, this);
  };
  Widget.prototype.modal = function (opts) {
    if ( typeof opts === 'object' ) {
      opts.location = '__MODAL__';
    }

    return this.createInstance(opts);
  };
  Widget.prototype.getWidgets = function () {
    var messageObj = {
      eventName: '__WIDGETS_INFO__',
      isPromise: true
    };
    return ZSDKMessageManager.SendEvent(messageObj, this);
  };
  Widget.prototype.getWidgetInstance = function (widgetID) {
    if ( typeof widgetID !== 'string' ) { throw new Error('Invalid WidgetID passed'); }
    if ( this.parentWidget ) { return this.parentWidget.getWidgetInstance(widgetID); }

    var widgetInstance = this._childWidgets[widgetID];
    if ( !widgetInstance ) {
      this._childWidgets[widgetID] = widgetInstance = new Widget({ key: widgetID, parentWidget: this });
    }

    return widgetInstance;
  };
  Widget.prototype.getFileObject = function (file) {
    return new File( [ file.slice( 0, file.size ) ], file.name, { type: file.type } );
  };
  return {
    Init: function () {

      if (rootInstance) return rootInstance;

      rootInstance = new Widget({
        serviceOrigin: qParams.serviceOrigin
      });
      ZSDKMessageManager.Init(rootInstance);

      return rootInstance;
    },
    _getRootInstance: function () {
      return rootInstance;
    }
  };
})();

/**
   * One unified sigma sdk for all services
   */
window.SigmaSDK = (function () {
  var _zsdk;
  var EVENT_TYPES = {
    LOAD: 'Load',
    GET: 'get',
    GET_ALL: 'get_all',
    SET: 'set',
    REMOVE: 'remove',
    REQUEST: 'request',
    EVENT_NAME_PREFIX: 'SIGMA_',
    EVENT_NAME_SUFFIX: '_EVENT',
    REQUEST_API_CONNECTION: 'requestapiconnection'
  };

  var ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    APP: 'APP_ERROR'
  };


  var preValidation = function () {
    if (!_zsdk.isRegistered()) {
      throw new Error('App not registered.');
    }
  };

  var sentEvent = function (_serviceName, eventData) {
    var eventName = EVENT_TYPES.EVENT_NAME_PREFIX + _serviceName + EVENT_TYPES.EVENT_NAME_SUFFIX;
    return _zsdk._sendEvent(eventName, eventData, true);
  };

  var getErrorObject = function (type, message) {
    return Promise.reject({ type: type, message: message });
  };


  function UnifiedSDK(serviceName) {
    this._serviceName = serviceName;
  }

  UnifiedSDK.prototype.isRegistered = function () {
    return _zsdk.isRegistered();
  };

  // The method will return current widget instance
  UnifiedSDK.prototype.context = function () {
    preValidation();
    return _zsdk;
  };
  // The method used to create widget instance
  UnifiedSDK.prototype.createWidget = function (options) {
    preValidation();
    return _zsdk.createInstance(options);
  };
  // The method used to get widget instance
  UnifiedSDK.prototype.getWidget = function (widgetId) {
    return _zsdk.getWidgetInstance(widgetId);
  };
  // The method used to get other widget info of an extension
  UnifiedSDK.prototype.widgetsMeta = function () {
    preValidation();
    return _zsdk.getWidgets();
  };
  // The method used to subscribe handler for event
  UnifiedSDK.prototype.on = function (eventName, handler) {
    return _zsdk.on(eventName, handler);
  };
  // The method used to unsubscribe handler for event
  UnifiedSDK.prototype.off = function (eventName, handler) {
    return _zsdk.off(eventName, handler);
  };
  // The method used to fire events
  UnifiedSDK.prototype.trigger = function (eventName, options) {
    preValidation();
    return _zsdk.emit(eventName, options);
  };
  // The method used to create another widget instance
  UnifiedSDK.prototype.modal = function (options) {
    preValidation();
    return _zsdk.modal(options);
  };
  // The method used to fetch http get request
  UnifiedSDK.prototype.fetch = function (options) {
    preValidation();
    return _zsdk.fetch(options);
  };
  // The method used to get module or extension properties
  UnifiedSDK.prototype.get = function (properties, handler) {
    preValidation();
    if (typeof properties !== 'string' && !Array.isArray(properties)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The get method accepts String or Array of Strings only.');
    }
    var propArr = (typeof properties === 'string') ? [properties] : properties;
    if (propArr.length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The get method should not accept empty Array of Strings.');
    }
    var eventData = {
      event_type: EVENT_TYPES.GET,
      properties: propArr
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.GET, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to get all properties of module or extension
  UnifiedSDK.prototype.getAll = function (moduleName, options, handler) {
    preValidation();
    if (typeof moduleName !== 'string') {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The getAll method accepts module_name as String only.');
    }
    var eventData = {
      event_type: EVENT_TYPES.GET_ALL,
      module_name: moduleName,
      options: options
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.GET_ALL, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to set sigle property of module or extension
  UnifiedSDK.prototype.set = function (properties, propertyValue, handler) {
    preValidation();
    if (typeof properties !== 'string' && typeof properties !== 'object' && Array.isArray(properties)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The set method accepts key-value pair or Object of key-value pairs only.');
    }
    var propArr;
    if (typeof properties === 'string') {
      propArr = {};
      propArr[properties] = propertyValue;
    } else {
      propArr = properties;
    }
    if (propArr.length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The set method should not accept empty Object.');
    }

    var eventData = {
      event_type: EVENT_TYPES.SET,
      properties: propArr
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.SET, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to remove properties of module or extension
  UnifiedSDK.prototype.remove = function (properties, handler) {
    preValidation();
    if (typeof properties !== 'string' && !Array.isArray(properties)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The remove method accepts String or Array of Strings only.');
    }
    var propArr = (typeof properties === 'string') ? [properties] : properties;
    if (propArr.length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The remove method should not accept empty Array of Strings.');
    }
    var eventData = {
      event_type: EVENT_TYPES.REMOVE,
      properties: propArr
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.REMOVE, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to make http calls
  UnifiedSDK.prototype.request = function (options, handler) {
    preValidation();
    if (!options.url || options.url.trim().length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter url should not be empty');
    }
    if (typeof options.url !== 'string') {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter url should be type of string');
    }
    if (!options.method) {
      options.method = 'GET';
    }
    if (options.params && typeof options.params !== 'object' && Array.isArray(options.params)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter params should be type of object');
    }
    if (options.headers && typeof options.headers !== 'object' && Array.isArray(options.headers)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter headers should be type of object');
    }
    if (options.files) {
      if (Array.isArray(options.files)) {
        for (var i = 0; i < options.files.length; i++) {
          options.files[i] = _zsdk.getFileObject(options.files[i]);
        }
      } else if (typeof options.files !== 'object') {
        return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter files should be type of object');
      } else if (Object.keys(options.files).length > 5) {
        return getErrorObject(ERROR_TYPES.VALIDATION, 'You can upload a maximum of 5 files at a time.');
      }
    }
    var eventData = {
      event_type: EVENT_TYPES.REQUEST,
      options: options
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.REQUEST, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to make http calls for apiconnections
  UnifiedSDK.prototype.requestapiconnection = function (options, handler) {
    preValidation();
    if (!options.api_namespace || options.api_namespace.trim().length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter api_namespace should not be empty');
    }
    if (typeof options.api_namespace !== 'string') {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter api_namespace should be type of string');
    }
    if (!options.url || options.url.trim().length <= 0) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter url should not be empty');
    }
    if (typeof options.url !== 'string') {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter url should be type of string');
    }
    if (!options.method) {
      options.method = 'GET';
    }
    if (options.params && typeof options.params !== 'object' && Array.isArray(options.params)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter params should be type of object');
    }
    if (options.headers && typeof options.headers !== 'object' && Array.isArray(options.headers)) {
      return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter headers should be type of object');
    }
    if (options.files) {
      if (Array.isArray(options.files)) {
        for (var i = 0; i < options.files.length; i++) {
          options.files[i] = _zsdk.getFileObject(options.files[i]);
        }
      } else if (typeof options.files !== 'object') {
        return getErrorObject(ERROR_TYPES.VALIDATION, 'The parameter files should be type of object');
      } else if (Object.keys(options.files).length > 5) {
        return getErrorObject(ERROR_TYPES.VALIDATION, 'You can upload a maximum of 5 files at a time.');
      }
    }
    var eventData = {
      event_type: EVENT_TYPES.REQUEST_API_CONNECTION,
      options: options
    };
    if (typeof handler === 'function') {
      _zsdk.on(EVENT_TYPES.REQUEST_API_CONNECTION, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };
  // The method used to serve any custom event
  UnifiedSDK.prototype.dispatch = function (eventType, options, handler) {
    preValidation();
    var eventData = {
      event_type: eventType,
      options: options
    };
    if (typeof handler === 'function') {
      _zsdk.on(eventType, handler);
    }
    return sentEvent(this._serviceName, eventData);
  };

  var init = function (handler) {
    _zsdk = window.ZSDK.Init();
    if (typeof handler === 'function') {
      if (_zsdk.isRegistered()) {
        handler.call();
      } else {
        _zsdk.on(EVENT_TYPES.LOAD, handler);
      }
    }
    return new UnifiedSDK(this._serviceName);
  };

  var BIND_OBJECT = {
    CRM: { _serviceName: 'CRM' },
    DESK: { _serviceName: 'DESK' },
    PROJECTS: { _serviceName: 'PROJECTS' },
    ORCHESTLY: { _serviceName: 'ORCHESTLY' },
    MAIL: { _serviceName: 'MAIL' },
    SHOW: { _serviceName: 'SHOW' },
    SDP: { _serviceName: 'SDP' },
    IOT: { _serviceName: 'IOT' },
    ZAPPS: { _serviceName: 'ZAPPS' },
    CATALYST: { _serviceName: 'CATALYST' },
    FINANCE: { _serviceName: 'FINANCE' },
    CONNECT: { _serviceName: 'CONNECT' },
    TEAMINBOX: { _serviceName: 'TEAMINBOX' },
    SPRINTS: { _serviceName: 'SPRINTS' },
    BUGTRACKER: { _serviceName: 'BUGTRACKER' },
    CREATOR: { _serviceName: 'CREATOR' },
    PEOPLE: { _serviceName: 'PEOPLE' },
    COMMERCE: { _serviceName: 'COMMERCE' },
    SITES: { _serviceName: 'SITES' },
    RECRUIT: { _serviceName: 'RECRUIT' },
    WORKDRIVE: { _serviceName: 'WORKDRIVE' },
    WRITER: { _serviceName: 'WRITER' },
    INVOICE: { _serviceName: 'INVOICE' },
    INVENTORY: { _serviceName: 'INVENTORY' },
    SUBSCRIPTIONS: { _serviceName: 'SUBSCRIPTIONS' },
    CAMPAIGNS: { _serviceName: 'CAMPAIGNS' },
    CHARMHEALTHEHR: { _serviceName: 'CHARMHEALTHEHR' },
    BIGIN: { _serviceName: 'BIGIN' },
    EXPENSE: { _serviceName: 'EXPENSE' },
    FSM: { _serviceName: 'FSM' },
    LOGS360CLOUD: { _serviceName: 'LOGS360CLOUD'}
  };

  /** Sigma Unified SDK Static Version = v3 */

  return {
    CRM: {
      init: init.bind(BIND_OBJECT.CRM)
    },
    DESK: {
      init: init.bind(BIND_OBJECT.DESK)
    },
    PROJECTS: {
      init: init.bind(BIND_OBJECT.PROJECTS)
    },
    ORCHESTLY: {
      init: init.bind(BIND_OBJECT.ORCHESTLY)
    },
    MAIL: {
      init: init.bind(BIND_OBJECT.MAIL)
    },
    SHOW: {
      init: init.bind(BIND_OBJECT.SHOW)
    },
    SDP: {
      init: init.bind(BIND_OBJECT.SDP)
    },
    IOT: {
      init: init.bind(BIND_OBJECT.IOT)
    },
    ZAPPS: {
      init: init.bind(BIND_OBJECT.ZAPPS)
    },
    CATALYST: {
      init: init.bind(BIND_OBJECT.CATALYST)
    },
    FINANCE: {
      init: init.bind(BIND_OBJECT.FINANCE)
    },
    CONNECT: {
      init: init.bind(BIND_OBJECT.CONNECT)
    },
    TEAMINBOX: {
      init: init.bind(BIND_OBJECT.TEAMINBOX)
    },
    SPRINTS: {
      init: init.bind(BIND_OBJECT.SPRINTS)
    },
    BUGTRACKER: {
      init: init.bind(BIND_OBJECT.BUGTRACKER)
    },
    CREATOR: {
      init: init.bind(BIND_OBJECT.CREATOR)
    },
    PEOPLE: {
      init: init.bind(BIND_OBJECT.PEOPLE)
    },
    COMMERCE: {
      init: init.bind(BIND_OBJECT.COMMERCE)
    },
    SITES: {
      init: init.bind(BIND_OBJECT.SITES)
    },
    RECRUIT: {
      init: init.bind(BIND_OBJECT.RECRUIT)
    },
    WORKDRIVE: {
      init: init.bind(BIND_OBJECT.WORKDRIVE)
    },
    WRITER: {
      init: init.bind(BIND_OBJECT.WRITER)
    },
    INVOICE: {
      init: init.bind(BIND_OBJECT.INVOICE)
    },
    INVENTORY: {
      init: init.bind(BIND_OBJECT.INVENTORY)
    },
    SUBSCRIPTIONS: {
      init: init.bind(BIND_OBJECT.SUBSCRIPTIONS)
    },
    CAMPAIGNS: {
      init: init.bind(BIND_OBJECT.CAMPAIGNS)
    },
    CHARMHEALTHEHR: {
      init: init.bind(BIND_OBJECT.CHARMHEALTHEHR)
    },
    BIGIN: {
      init: init.bind(BIND_OBJECT.BIGIN)
    },
    EXPENSE: {
      init: init.bind(BIND_OBJECT.EXPENSE)
    },
    FSM: {
      init: init.bind(BIND_OBJECT.FSM)
    },
    LOGS360CLOUD: {
      init: init.bind(BIND_OBJECT.LOGS360CLOUD)
    }
  };
})();
