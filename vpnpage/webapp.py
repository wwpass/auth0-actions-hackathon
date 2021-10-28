import logging
import os
import pwd
import grp
import jwt
import time

from urllib.parse import urlencode

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.auth
from tornado.options import define, options, parse_config_file, parse_command_line
import tornado.escape

base_path = os.path.abspath(os.path.dirname(__file__))
os.chdir(base_path)


class VPNHandler(tornado.web.RequestHandler):
    async def get(self) -> None:
        decoded = {}
        try:
            decoded = jwt.decode(
                self.get_argument('session_token'),
                key=options.token_secret,
                algorithms=['HS256'],
                issuer=f'{options.auth0_tenant}.auth0.com')
        except Exception:
            logging.exception("JWT decoding exception")
        if not decoded:
            self.set_status(400)
            return
        vpn_query = {
            'name': options.vpn_name,
            'host': options.vpn_host,
            'hub': '',
            'u': 'a0vpn',
            'psk': options.vpn_psk,
            'nonce': decoded.get('otp', '')
        }
        success_token = jwt.encode(
            {
                'sub': decoded['sub'],
                'iss': options.auth0_tenant,
                'exp': int(time.time()) + 30,
                'state': self.get_argument('state', ''),
                'success': True
            },
            key=options.token_secret,
            algorithm="HS256"
        )
        logging.info(decoded)
        logging.info({
                'sub': decoded['sub'],
                'iss': options.auth0_tenant,
                'exp': int(time.time()) + 30,
                'state': self.get_argument('state', ''),
                'success': True
            },)
        error_token = jwt.encode(
            {
                'sub': decoded['sub'],
                'iss': '',
                'exp': int(time.time()) + 30,
                'state': self.get_argument('state', ''),
                'success': False
            },
            key=options.token_secret,
            algorithm="HS256"
        )
        self.render(
            'vpn.html',
            vpn_url=f'wwpl2tp://connect/?{urlencode(vpn_query)}',
            return_url=f'https://{options.auth0_tenant}.auth0.com/continue',
            success_param=success_token,
            error_param=error_token,
            xsrf_token=self.xsrf_token
            )


def define_options() -> None:
    define("config", default="/etc/otp-vpn.conf")
    define("template_path", default=os.path.normpath(os.path.join(base_path, 'templates')))
    define("static_path", default=os.path.realpath(os.path.join(base_path, 'static')))

    define("user", default=None)
    define("group", default=None)

    define("debug", type=bool, default=False)
    define("bind", default="127.0.0.1")
    define("port", type=int, default=15605)

    define("token_secret", type=str)
    define("vpn_host", type=str)
    define("vpn_psk", type=str)
    define("vpn_name", type=str)
    define("auth0_tenant", type=str)


define_options()
parse_command_line()
parse_config_file(options.config)

settings = {
    'static_url_prefix': '/vpn/static/',
    'template_path': options.template_path,
    'debug': options.debug,
    'autoescape': None,
    'options': options,
    'xheaders': True,
    'static_path': options.static_path,
    'xsrf_cookies': True,
}

urls = [
    (r"/vpn", VPNHandler),
]
application = tornado.web.Application(urls, **settings)  # type: ignore [arg-type]


def run() -> None:
    logging.info(f'Starting server: {__file__}')
    server = tornado.httpserver.HTTPServer(application, xheaders=True)
    server.listen(options.port, options.bind)
    logging.info(f'Listening on : {options.bind}:{options.port}')
    logging.info(f'Logging : {options.logging} ; Debug : {options.debug}')

    gid = grp.getgrnam(options.group)[2] if options.group else os.getgid()
    uid = pwd.getpwnam(options.user)[2] if options.user else os.getuid()

    if options.group:
        logging.info(f"Dropping privileges to group: {options.group}/{gid}")
        os.setgid(gid)
    if options.user:
        os.initgroups(options.user, pwd.getpwnam(options.user)[3])
        logging.info(f"Dropping privileges to user: {options.user}/{uid}")
        os.setuid(uid)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == '__main__':
    run()
