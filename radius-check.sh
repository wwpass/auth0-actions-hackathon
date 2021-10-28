#!/bin/bash

if [[ $# < 2 ]] ; then
        echo 'You must provide user name, RADIUS nonce'
        exit 1
fi

username=$1
nonce=$2

if [[ x$nonce == x ]]; then
        exit 1
fi

RETVAL=

oathtool -b -s 30s --totp=sha512 -w 1 -d 8 `cat /etc/otp-vpn.secret` $2

RETVAL=$?
if [ $RETVAL != 0 ] ; then
        RETVAL=1
fi
echo RETVAL $RETVAL
exit $RETVAL
