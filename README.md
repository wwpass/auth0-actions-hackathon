# VPN with Auth0 Actions

This demonstrates how to allow users to connect to VPN during auth0 login process.

## How it works

Auth0 on post-login Action generates one-time password and redirects the user to a special page.
That page checks if the user can access protected network (Is connected to it by VPN or physically). If not and the user is allowed VPN access (as checked by "VPN" Role in Auth0), it present user with a link with a special scheme `wwpl2tp://`. That url contains OTP and other details for VPN connection. It opens a special application on user's PC that automatically establishes VPN connection.
The VPN server then contacts RADIUS server to check OTP, and it is checked by a custom script.
When the web page detects that the VPN is connected it redirects the user back to Aouth0 to continue with authentication.

## VPN configuration

This demo uses L2TP with SoftEther VPN server on native Windows client. Other OSes and other VPN servers can be used but each case requires updating WWPassConnector software to adapt it to that VPN client.

Install freeradius, oathtool

Configure freeradius using sample site configuration in `freeradius-site`. Configure RADIUS clients and make you VPN server to use this FREERADIUS for user authorization.

Securely generate and base32 encode a secret for OTP and place it in `/etc/otp-vpn.secret` wiht root:root, 600 permissions.

## VPN web page configuration

Deploy Python webapp from vpnpage/ folder.
`otp-vpn.conf` is a configuration file, fill in token-secret with securely generated secret. Place it in `/etc/otp-vpn.conf` wiht root:root, 600 permissions.
`otp-vpn.service` is a sample systemd service file.
`nginx-site-conf` is a sample nginx configuration that handles the protected application and this page.

## Auth0 Action

Create Auth0 Post-Login action with code form `post-login.js`.

Add `totp-generator` npm module.

Add two secrets:
 - TOKEN_SECRET is the secret from `otp-vpn.conf`
 - OTP_SECRET is the secret from `otp-vpn.secret`

Change `VPN_ROLE_NAME` and `VPN_PAGE_URL` at the beginning of the action code
