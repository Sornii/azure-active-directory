// Request AzureAd credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
AzureAd.requestCredential = (...args) => {
  // support both (options, callback) and (callback).
  const options = typeof args[0] === 'function' ? {} : args[0];
  const callback = typeof args[0] === 'function' ? args[0] : args[1];

  const config = AzureAd.getConfiguration(true);
  if (!config) {
    callback && callback(new ServiceConfiguration.ConfigError());
    return;
  }

  const tenant = options.tenant || 'common';
  const scope = options.scope ? options.scope.join(' ') : 'user.read';

  const loginStyle = OAuth._loginStyle('azureAd', config, options);
  const credentialToken = Random.secret();

  const queryParams = {
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: OAuth._redirectUri('azureAd', config),
    scope,
    response_mode: 'query',
    state: OAuth._stateParam(loginStyle, credentialToken),
    prompt: options.loginPrompt || 'login',
  };

  if (options.login_hint) {
    queryParams.login_hint = options.login_hint;
  }
  if (options.domain_hint) {
    queryParams.domain_hint = options.domain_hint;
  }

  const queryParamsEncoded = (queryParams || []).map(
    (val, key) => `${key}=${encodeURIComponent(val)}`
  );

  const baseUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?`;
  const loginUrl = baseUrl + queryParamsEncoded.join('&');

  OAuth.launchLogin({
    loginService: 'azureAd',
    loginStyle,
    loginUrl,
    callback,
    credentialToken,
    popupOptions: { height: 600 },
  });
};
