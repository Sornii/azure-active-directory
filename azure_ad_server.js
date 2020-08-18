AzureAd.allowlistFields = [
  'id',
  'userPrincipalName',
  'mail',
  'displayName',
  'surname',
  'givenName',
];

const hasOwn = Object.prototype.hasOwnProperty;

AzureAd.retrieveCredential = (credentialToken, credentialSecret) =>
  OAuth.retrieveCredential(credentialToken, credentialSecret);

function getTokensFromCode(code) {
  return AzureAd.http.getAccessTokensBase({
    grant_type: 'authorization_code',
    code,
  });
}

OAuth.registerService('azureAd', 2, null, query => {
  const tokens = getTokensFromCode(query.code);
  const graphUser = AzureAd.resources.graph.getUser(tokens.accessToken);
  const serviceData = {
    accessToken: tokens.accessToken,
    expiresAt: +new Date() + 1000 * tokens.expiresIn,
  };

  const fields = {};
  AzureAd.allowlistFields.forEach(allowlistedField => {
    if (hasOwn.call(graphUser, allowlistedField)) {
      fields[allowlistedField] = graphUser[allowlistedField];
    }
  });

  Object.assign(serviceData, fields);

  // only set the token in serviceData if it's there. this ensures
  // that we don't lose old ones (since we only get this on the first
  // log in attempt)
  if (tokens.refreshToken) serviceData.refreshToken = tokens.refreshToken;

  const emailAddress = graphUser.mail || graphUser.userPrincipalName;

  const options = {
    profile: {
      name: graphUser.displayName,
    },
  };

  if (emailAddress) {
    options.emails = [
      {
        address: emailAddress,
        verified: true,
      },
    ];
  }

  return { serviceData, options };
});
