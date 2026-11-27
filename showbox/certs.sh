#!/bin/sh
# Director's Desk · SHOW BOX · certificates
# Makes the box its own small certificate authority (once), then a server certificate for the box's address.
# Devices trust the CA once (http://<box>:8080/), then the Desk and Crew Radio run on real HTTPS: installable, mic allowed.
# Usage: ./certs.sh 192.168.50.10 [showbox.local]      Works on the NUC (EpicOS) and in Termux (pkg install openssl-tool).
set -eu
IP="${1:?give the box address, e.g. 192.168.50.10}"; NAME="${2:-showbox.local}"
cd "$(dirname "$0")"; mkdir -p certs; chmod 700 certs; cd certs
umask 077
if [ ! -f ca.key ]; then
  openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 3650 \
    -keyout ca.key -out ca.crt -subj "/CN=Show Box CA (Ovi)" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" -addext "keyUsage=critical,keyCertSign,cRLSign"
  echo "New CA made. Every device must trust certs/ca.crt once."
fi
cat > server.ext <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectAltName=IP:${IP},DNS:${NAME},DNS:localhost,IP:127.0.0.1
EOF
openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -keyout server.key -out server.csr -subj "/CN=${NAME}"
# 397 days: inside what Apple and Chrome accept for a server certificate
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 397 -out server.crt -extfile server.ext
rm -f server.csr server.ext
chmod 644 ca.crt
echo "Server certificate for ${IP} / ${NAME} ready (valid 397 days)."
openssl x509 -in ca.crt -noout -fingerprint -sha256
