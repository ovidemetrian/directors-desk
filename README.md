# Director's Desk

**The director calls the cue. Claude operates. HUSH stays human.**

[▶ Open the desk and run the 60-second show](https://ovidemetrian.github.io/directors-desk/)

A tablet broadcast desk for live and hybrid shows: sound, cameras, lights and stream, run by Claude while a human directs. Installable as an app (PWA). Concept by Ovi, built with Claude.

**Three parts, one app:**
- **The desk** (`index.html`, tablet 10"+ or PC): the director's screen.
- **[Crew Radio](https://ovidemetrian.github.io/directors-desk/radio.html)** (`radio.html`, phone): the silent walkie-talkie for every crew member.
- **Show flow**: seven steps from the artist's rundown to READY TO GO on every screen, then live. [Details below](#show-flow-seven-steps).

## What it does today

- **Run the show.** A 60-second demo plays a short scripted show: Claude moves sound, cameras and lights, WATCH flags a mistake, a human hits HUSH. Then the desk goes back exactly as it was. It never runs inside a live crew show.
- **Cue Claude in plain words.** "Q&A, open audience mic two." Claude makes the change, then reads the room back so you know it happened.
- **Show Grammar: exact commands, no guessing.** Voice engines mishear accents and slips of the tongue, so at showtime the desk does not interpret. It keeps a closed list of commands built from the gear in the show (scenes, mics, cameras, light cues, cue lights, stream), and a command runs only when the words match an entry exactly. The crew adds their own words in the GRAMMAR editor (an accent, a nickname, another language) and exports the list with the show. Typed and matched runs at once; spoken (hold the 🎙) and matched shows what it heard and waits for GO. No match means nothing changes, with the closest commands offered as buttons. HUSH and Blackout are never in the grammar: hands only.
- **HUSH is human only.** One tap cuts every mic. Releasing it takes a deliberate hold. Claude cannot touch it.
- **Roles.** Director, A1 Audio, Camera, Stream, Lighting, Floor. Each person owns their part; the director owns everything.
- **Crew on the same show.** Call sheet, check-in, cue lights (Standby, Go, Hold, Clear) and a shared show log.
- **The bubble is the AI switch.** Tap the MADE BY OVI WITH CLAUDE bubble: **OFF** (me alone, the AI is truly cut off), **WATCH** (it looks and flags what seems wrong, never acts) or **ON** (works with you, every move shown and read back). Anyone can step the AI down; only the Director brings it back up.
- **ARE YOU SURE?** One key shows what your next step will change and what looks wrong right now, before you GO. It works with the AI off. In WATCH, the AI asks the same question once, with a smile and an Undo, and never on HUSH or Blackout.
- **Lights on cue with sound and cameras.** One scene GO moves audio, camera and the light cue together, with real fade times. The LD has a cue stack and house, wash, key and cyc submasters, and the camera previews show what the lights are doing. **Blackout is human only**, like HUSH.
- **Camera previews** with program on air, and **PFL** headphone listening per channel.
- **Rooms: from one show to many offices.** A fleet screen of Logitech CollabOS meeting rooms in San Francisco, New York and London. Each room shows camera, mics, display, network and calendar health. Claude reads the faults, shows the evidence and proposes the fix; a human approves. It waits for a meeting to end before anything that would drop a call, spots a failure that keeps coming back and opens a ticket for the root cause instead of resetting again, catches ghost meetings (booked, nobody came) and walk-ins (people in a room nobody booked) from Logitech Spot occupancy, counting people only, never faces, and asks before releasing or booking, and runs CollabOS updates in rings (one room, one office, the fleet) that only a human advances, with rollback ready. Tap the ROOMS tally or pick Rooms under This screen.
- **Cloud down, show on.** Built the week a Microsoft cloud outage kept Teams and Outlook dark for two workdays while room hardware stayed healthy. The Rooms screen now splits local from cloud: the local show path (sound, cameras, lights, Core) never needs the cloud, and each meeting platform has its own health tile. When one goes down, Claude shows that the rooms themselves pass every check, says a reset won't help, and proposes moving those rooms to a backup platform with fresh invites. You approve with one push, or wait it out. When the platform comes back, Claude asks before moving anyone home.
- **PRE-SHOW plan: one dependency less, one less possible defect.** From Ovi's bench rule with a seven-transistor radio. Before the first button, the desk lists every link the show depends on in three tiers: Signal (hardware only), Control (local box on the LAN, runs with the internet down) and Cloud (extras only). Each link has its fallback written next to it. Optional links can be dropped, and the desk shows the chain shrinking (Lusser's law: 7 parts at 99.9% each give 99.3%, 1,000 give 37%). A human checks every link, then signs the plan and gets GO for show. After that, ARE YOU SURE? also lists exactly which links the next cue leans on, cloud ones in blue with their fallback.
- **Green Room: start with a smile.** One main switch in the top row, **HUMOR ON / OFF** (Law Six). With it on, every shift starts at the water fountain: the Director, then every crew role, gets a greeting and a short piece of theatre folklore before the serious part. A new Green Room note drops in every 8 to 15 minutes, never while the stream is on air, or on demand from the 🎭 Green room chip. The desk catches the classics: say *Macbeth* in a cue and it is held until the ritual is done; whistle and a sandbag twitches; peacock feathers and real mirrors get a word from props and lighting; test-mode faults mean "bad dress, good opening"; Blackout leaves a **ghost light** glowing on screen; ARE YOU SURE? asks *To be, or not to be?*; and a full tank wishes luck in four theatre languages: *Break a leg*, *Merde*, *Toi toi toi*, *Chookas*. Mondays bring a dark-night note and March 27 is World Theatre Day. All told as folklore. Switch humor OFF and the desk talks plain.
- **A sound language.** The desk answers by ear so the director does not have to look: a rising pair for OK (read back ✓, grammar match, plan signed), a falling low pair for NO (FAIL, not in the grammar), two even taps for ATTENTION (Standby, Hold, HUSH, Blackout, crew calls) and three quick ones for WARNING (WATCH, a cloud down). With humor on and the stream off air, a mistake answers *Meeeh* like a goat. Synthesized on the device, played only on its own speaker or headphones, never into the PA or the stream. 🔔 in the top row switches it off.
- **Tablet, desktop console, or several portrait monitors** with one mouse across all of them, each window showing one part: Audio, Picture, Lighting, or Calls & Claude.

It is a working simulation. No real equipment is connected yet. A real Rooms screen would read Logitech Sync and the CollabOS API through a small server that holds the keys; this page never holds them. This installable version uses an offline cue parser; the live-Claude version runs inside Claude.

## What comes next

The Director's Desk started as one tablet. Today it runs on one screen or split across several portrait monitors, and the crew shares the same show from any device.

The next step is scale. A boardroom of 16 people needs one screen. A hall of 200 needs three. A venue of 2,000, with crews on both sides of the field and remote sites feeding in, needs six screens and a wall: every camera's inputs and outputs, previous and next slide, the participant list, every location's feed.

At that size no director can watch everything. So the desk has to change from showing everything to flagging what matters. A feed drops, a mic goes hot, a remote site goes quiet, and that one moves to the front. That's where Claude belongs: watching the hundred things a person can't, so the person can make the one call that counts.

**The show sets the screens, not the other way around.**

| Show | People | Screens |
|---|---|---|
| Boardroom | ~16 | 1 |
| Hall | ~200 | 1 to 3 |
| Venue, multiple sites | ~2,000 | 6 plus a wall |

---

*Concept by Ovi, built with Claude. A working simulation today; real rooms next.*

## Crew Radio (phones) · Show styles

- **Crew Radio** (`radio.html`): the silent walkie-talkie. The director sends a message to a channel (All crew, Audio, Stage, Security, Front of house); phones buzz instead of squawking, the crew taps **COPY**, and the desk shows who copied. One-tap replies (Done, Can't, Need help) and reports tagged with the sender's place (Can't hear, Feedback, Picture frozen…). Crew phones can only **request** HUSH; the director's phone holds the real one, hold 1 second. The full desk needs a 10-inch tablet; phones are offered the Radio.
- **Ready check**: before a handoff (say, bringing in a remote site), the director starts a ready check with the items that matter (Picture, Audio, Stream). The operator's phone confirms each one; the desk shows them going green one by one, and GO lights up only when all are ready.
- **Role playbooks and the Crew board**: every show style comes with a library of crew tasks, each with who (role), when (Pre-show, Walk-in, Show, Q&A, Break, Strike) and why. Each phone shows only its role's slice, sorted by what matters now; the crew ticks Done or Can't. The director sends any task with one tap from the Playbook, and the Crew board shows every role's progress for the current phase. Changing the scene moves the phase on every phone. Libraries are written with Claude and meant to be reviewed by a stage manager.
- **Show styles**: Set the stage by room size (Boardroom 16 to Arena 2,000) and character (Business, Rock, Jazz, Theatre). Scene names, light looks, mic names and the accent colour change; the commands underneath stay the same, so Show Grammar and Claude keep working.
- Without a shared show connection, the Radio talks to Desk windows on the same device; on a shared Claude show it rides the room.

## Show flow (seven steps)
The **SHOW FLOW** button walks the whole day in order:
1. **Plan**: the rundown. The event on the left (time, moment, trigger: on the clock or called), the technical side on the right (sound, light, camera, crew, scene). Type the artist's words ("1:30 the band comes in, 4:00 the solo…") and the desk drafts the rows.
2. **Meeting**: row by row, each department hears its part, the row gets marked Agreed, or sent to every phone.
3. **Crew**: phones join Crew Radio; each role gets its playbook.
4. **Rehearsal**: REHEARSAL on every screen. Next moment records real time against plan ("Use real" keeps the new timing). Every Can't, Need help, report or note lands in the fix list.
5. **Check**: the pre-show tank plus a ready check to all crew.
6. **Ready**: READY TO GO on the desk and every phone, only when steps 1–5 are done.
7. **Live**: ARE YOU SURE?, then Go live. Standby warns the phones; GO fires the next row: its scene moves the room and every phone gets the call. After the last row, END OF SHOW puts SHOW COMPLETE on every phone and switches the crew to strike tasks; New show starts again with the rundown kept.
