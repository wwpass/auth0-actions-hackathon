const VPN_ROLE_NAME = "VPN";
const VPN_PAGE_URL = "https://a0client.wwpass.net/vpn";

const redirectToVPNPage = (event, api) => {
  const vpn_allowed = event.authorization && event.authorization.roles.includes(VPN_ROLE_NAME);
  const otp = vpn_allowed ? require("totp-generator")(
    event.secrets.OTP_SECRET,
    { period: 30,
      algorithm: "SHA-512",
      digits:  8}): null;
  const token = api.redirect.encodeToken({
    secret: event.secrets.TOKEN_SECRET,
    payload: {
      vpn_allowed: vpn_allowed,
      otp: otp,
      ttl: Math.floor(Date.now()/1000) + 30
    },
  });

  api.redirect.sendUserTo(VPN_PAGE_URL, {
    query: { session_token: token , otp: otp}
  });
}

/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/

exports.onExecutePostLogin = async (event, api) => {
  redirectToVPNPage(event, api);
};


/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onContinuePostLogin = async (event, api) => {
  const payload = api.redirect.validateToken({
    secret: event.secrets.TOKEN_SECRET,
    tokenParameterName: 'session_token',
  });
  if (!payload.success) {
    redirectToVPNPage(event, api);
  }
};
