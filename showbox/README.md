# Show Box · Director's Desk

One small, local-first box that runs the show network: it serves the **Desk** (tablet) and **Crew Radio** (phones) over HTTPS, relays crew messages, bridges the desk to the **Q-SYS Core**, and keeps the show log. No internet, no cloud, no AI needed at showtime.

Concept & design: Ovi Demetrian · built with Claude

---

## The ideal configuration

```
            ┌──────────── show LAN 192.168.50.0/24 (Wi-Fi + one cable) ────────────┐
 Director tablet ─(USB-C Ethernet, ideal)─┐                                         │
 Crew phones ─────── Wi-Fi 5 GHz ──── travel router (WAN port empty) ── cable ── NUC enp1s0 .50.10
                                                                                   │  show box
                                         Q-SYS Core control port ── cable ── NUC enp2s0 .60.10
            └──────────── Core LAN 192.168.60.0/24 (one cable, nobody else) ────────┘
```

| Piece | Setting | Why |
|---|---|---|
| **Router** | WAN port empty · admin password changed · WPS off · UPnP off · remote admin off | Nothing in, nothing out |
| | SSID per show (e.g. `DD-Show-7F3K`) · WPA2/WPA3 mixed · new passphrase each show | Old phones still join; a leaked passphrase expires with the show |
| | 5 GHz only, fixed channel, chosen at the venue walk | Keep 2.4 GHz free for digital wireless mics and IEMs |
| | Client (AP) isolation on | Phones talk to the box only, never to each other |
| | DHCP .100–.199 · NUC fixed at .10 · router NTP → .10 | One address in every QR code; one clock |
| **NUC** | Two NICs: show LAN and Core LAN, **no routing between them** (`network/nftables.conf`) | Phones can never reach port 1710. The box is the only door to the Core |
| | Only ports 8443 (HTTPS) and 8080 (certificate step) open, show LAN only | One port, one purpose |
| | `chrony` as the show clock (`network/chrony-showbox.conf`) | Log times agree without internet |
| | `systemd` service, restarts itself (`network/showbox.service`) | Power on = show box up |
| **Core** | Access Control on, a `desk` user · password only in `showbox.env` (chmod 600) | Credentials never leave the NUC |
| | Script/Code Access External on the controls the box uses | QRC can only see what you allow |
| **Director tablet** | Wired if possible (USB-C Ethernet) | No RF in the director's path |
| **Every device** | Trust the box certificate once (step 1 on the join sheet) | Real HTTPS: installs as a PWA, mic allowed |

**If Wi-Fi drops:** the Core keeps the last scene and its mutes; the director (wired) keeps control. **If the box dies:** the Core keeps running the room as it is.
**After the show:** power off the router. The network is gone.

---

## First time on the NUC (EpicOS)

```sh
sudo adduser --disabled-password show && sudo -iu show
# copy this folder to /home/show/showbox and the directors-desk site to /home/show/directors-desk
cd showbox
./certs.sh 192.168.50.10                       # once: the box's own certificate authority + server certificate
cp network/showbox.env.example showbox.env && chmod 600 showbox.env    # add the Core's desk password
exit
sudo cp /home/show/showbox/network/01-showbox.yaml /etc/netplan/ && sudo netplan apply
sudo cp /home/show/showbox/network/nftables.conf /etc/nftables.conf && sudo systemctl enable --now nftables
sudo apt install chrony && sudo cp /home/show/showbox/network/chrony-showbox.conf /etc/chrony/conf.d/ && sudo systemctl restart chrony
sudo cp /home/show/showbox/network/showbox.service /etc/systemd/system/ && sudo systemctl enable --now showbox
journalctl -u showbox -f                        # shows the Director join sheet link
```

## Every show

1. Edit `show.json`: show name, SSID, the Core's address, and the **call sheet** (`crew`: name, role, `desk` or `radio`).
2. `node server.js --new-show` once (new join tokens; anyone removed from the call sheet is locked out). After that the service runs it.
3. Open the **join sheet** on the director's tablet (link printed at start) → print it, or show it on screen.
4. Each person: join the Wi-Fi → scan **Step 1** once per device (trust the box) → scan **their own** code → the Desk or Crew Radio opens with their role already set.
5. Android may say "Wi-Fi has no internet": tap **Stay connected**.

## Car test (Android, Termux, no Core)

```sh
pkg install nodejs openssl-tool
./certs.sh 192.168.43.1           # your phone hotspot's own address (check with: ip addr)
node server.js --mock             # mock Core inside; add --drop to see read-back catch lost commands
```
Set `"address"` in `show.json` to the hotspot address first. A second phone or tablet joins the hotspot and scans.

---

## What the box enforces (not the page)

- **No token, no entry.** Every API call needs a personal join token. The token sets the role. The page can't claim one.
- **Roles match the desk:** audio (mutes, levels, HUSH) = Director, A1 Audio. Scenes = Director. Everyone else: radio only.
- **HUSH is hands only.** Not reachable through the action path (grammar, buttons, Claude); only through the HUSH key's own door, from Director or A1 Audio, marked as a human press.
- **Radio messages are stamped by the box** with the sender's real name and role, so a phone can't pretend to be the Director (the desk engages HUSH on a Director's radio HUSH).
- **Every Core command is read back from the Core** before the log says ✓. A change made at the Core by anyone else shows on the desk as *changed at the Core, not from this desk*.
- **The log is in two places:** `logs/<show>-<date>.jsonl` on the box (Director can download it), and the last 2,000 lines on each desk.

## Files

| File | Job |
|---|---|
| `server.js` | HTTPS desk + radio server, join tokens, relay, show log, Q-SYS bridge |
| `bridge.js` · `qrc.js` · `actions.js` | QRC client, Active-Core logic, redundant-pair check, read-back, action map |
| `mock-core.js` | Pretend Core for testing (not Q-SYS: always test on Designer Emulate or a real Core before a show) |
| `certs.sh` | Box certificate authority + server certificate |
| `show.json` | The show and its call sheet |
| `network/` | Firewall, addresses, clock, service |
| `vendor/qrcode.js` | QR codes (Kazuhiko Arase, MIT licence) |

## Q-SYS job sheet (for whoever builds the design)

Named Controls the box expects (rename in `actions.js` to match your design):
`Pres/Aud1/Aud2/Remote/Play` + `.Mute` and `.Gain` · `Desk.Scene` (1–4, saved inside each scene snapshot) · `Desk.Hush` (0/1, mutes every mic and remote input in the design) · snapshot bank `Scenes`, 1 Walk-in · 2 Presentation · 3 Q&A · 4 Break.
