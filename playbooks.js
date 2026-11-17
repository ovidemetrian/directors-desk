/* Role playbooks: one library per show, each crew role gets only its slice.
   Every task says who, when (phase) and why. Written with Claude, to be reviewed by a stage manager. */
(function(){
const R={A1:'A1 Audio',CAM:'Camera',STR:'Stream',LX:'Lighting',SM:'Stage manager',FL:'Floor',US:'Usher',SEC:'Security',RUN:'Runner'};
const PHASES=['pre','doors','show','qa','break','strike'];
const PHASE_BASE={pre:'Pre-show',doors:'Walk-in',show:'Presentation',qa:'Q&A',break:'Break',strike:'Strike'};
const SCENE_OF={doors:'walkin',show:'presentation',qa:'qa',break:'brk'};
const SIZE_ORDER=['boardroom','club','hall','theatre','arena'];

/* [phase, role, task, why, minSize?] */
const BASE=[
['pre','A1','Line-check every mic and playback, one by one','A dead channel found now is a fix; found at doors it is a scramble'],
['pre','A1','Fresh batteries in every wireless pack','New batteries cost less than a mic dying mid-sentence'],
['pre','A1','Ring out the room at show volume','Feedback found in an empty room is easy; with a full house it is an apology'],
['pre','A1','Check the remote audio return both ways','Remote guests who cannot hear the room talk over it'],
['pre','CAM','White-balance and preset every camera position','Matched colour makes the cuts invisible'],
['pre','CAM','Check each PTZ preset lands clean','A drifting preset lands on an empty chair, live'],
['pre','STR','Test the stream end to end on a private link','The first viewer should not be the one who finds the problem'],
['pre','STR','Confirm upload bandwidth and a backup path','One network path is one point of failure'],
['pre','LX','Run every cue once at show speed','A cue that misfires in rehearsal saves one that misfires live'],
['pre','LX','Focus check on the presenter mark','Faces in shadow read as nervous on camera'],
['pre','SM','Walk the run of show with every department','Everyone should know the next cue before it is called'],
['pre','SM','Confirm every crew phone is on the radio','A crew member off the radio is one you cannot reach'],
['pre','FL','Spike marks on stage for every position','Lights and cameras depend on people hitting their marks','club'],
['pre','FL','Clear walkways and tape every cable','A trip on stage stops the show and hurts someone','club'],
['pre','US','Learn every exit and the accessible seating','Ushers who know the room look like the venue','club'],
['pre','SEC','Check every exit is unlocked and clear','Exits come first in any room, before anything else','club'],
['pre','RUN','Water on stage for every speaker','A dry mouth sounds like nerves on a microphone','club'],
['pre','RUN','Spare batteries and a spare handheld at the desk','The runner is the backup system on legs','club'],
['doors','US','Seat guests from the front rows back','Empty front rows look like an empty show on camera','club'],
['doors','US','Count the audience at the door','The headcount drives safety, catering and the stream story','club'],
['doors','SEC','Bag check and keep the entrance flowing','A jam at the door starts the show late for everyone','club'],
['doors','SEC','Agree a radio channel with venue security','Two security teams that cannot talk are no team','theatre'],
['doors','US','Section ushers report seat counts by section','At this size nobody can count a room alone','theatre'],
['doors','A1','Walk-in music at background level','People should still talk easily over it'],
['doors','STR','Stream on the walk-in slate','Early viewers see a show, not a black screen'],
['doors','CAM','Wide shot on program','The room filling up is the story before the story'],
['doors','SM','Call the 5-minute warning to all crew','Everyone gets the same countdown'],
['doors','LX','House at full, stage at preset','People find seats in light, not in darkness'],
['show','US','Hold latecomers at the door until the applause','A walk-in during the show pulls every eye off the stage','club'],
['show','A1','Ride the main mic level','Voices change when people get excited; the level should not'],
['show','A1','Watch for feedback when the presenter walks','A lav near a speaker turns into a whistle fast'],
['show','CAM','Frame the presenter, headroom steady','Remote viewers only see what the camera sees'],
['show','STR','Watch stream health and the chat','Remote viewers report lag before any meter does'],
['show','LX','House down, key light on the mark','The room should look at the stage, not at each other'],
['show','SM','Track timing against the run of show','A show that runs long cuts something at the end'],
['show','FL','Cue the next person on stage 2 minutes out','Nobody should run onto a stage','club'],
['show','SEC','Hold the doors, eyes on the room','A calm presence prevents problems before they start','club'],
['qa','RUN','Bring the handheld to the raised hand','Questions off-mic never reach the remote audience','club'],
['qa','RUN','Two runners: house left and house right','One runner cannot cross a room this size in time','theatre'],
['qa','A1','Open the audience mics, music down','The room hears the question and so does the stream'],
['qa','CAM','Find the questioner, then back to the stage','Viewers want to see who is asking'],
['qa','STR','Pass remote questions to the floor','Remote viewers are part of the room'],
['qa','FL','Repeat the question if the mic missed it','A question nobody heard cannot be answered','club'],
['qa','LX','House up to 60 percent','Faces in the audience need light for the camera'],
['qa','US','Point the runner to raised hands in your section','The runner cannot see every hand','club'],
['break','A1','Swap the main lav batteries','Batteries fade in the second half, never at the start'],
['break','STR','Break slate with a countdown timer','Viewers come back when the timer tells them to'],
['break','CAM','Wide shot, reset presets for part two','Breaks are where the second half gets prepared'],
['break','US','Open doors, guide to restrooms','A break that runs long is usually a restroom queue','club'],
['break','SM','Call the 2-minute return to all crew','The same countdown for everyone, again'],
['break','RUN','Fresh water on stage','The second half deserves a full glass too','club'],
['break','SEC','Watch the doors as the crowd moves','Breaks are when people and things wander','club'],
['strike','A1','Mute everything before anyone touches a cable','A pulled cable on a live channel pops through the PA'],
['strike','STR','End the stream on the closing slate','A stream left running broadcasts the strike'],
['strike','CAM','Park the cameras and cap the lenses','Lenses outlive the show only if someone caps them'],
['strike','LX','Work lights up, show lights down','Crews strike safely in work light'],
['strike','FL','Coil cables over-under and count the gear','Gear counted tonight is not lost tomorrow','club'],
['strike','SM','Thank the crew and log tonight\'s notes','Tonight\'s notes are tomorrow\'s better show'],
['strike','US','Sweep the rows for lost items','Phones and keys left behind are tomorrow\'s calls','club'],
['strike','SEC','Clear the room and lock up','The show is not over until the room is secure','club']
];
const EXTRA={
  business:[
    ['pre','RUN','Clicker with fresh batteries at the lectern','A dead clicker turns a keynote into a guessing game','club'],
    ['show','STR','Keep slides in sync with the presenter','Remote viewers follow the slides more than the face']],
  rock:[
    ['pre','A1','Line-check monitors with the band, wedge by wedge','The band plays to its monitors, not to the room'],
    ['doors','US','Offer earplugs at the doors','Loud is the point; hearing damage is not','club'],
    ['show','LX','Blinders on the big hits only','Blinders on every beat stop meaning anything'],
    ['show','SEC','Watch the barricade at the front','Crowd surges start at the front','theatre'],
    ['qa','CAM','Crowd shots on the chorus','The audience singing back is the shot']],
  jazz:[
    ['pre','A1','Set the piano mics with the player present','Pianists know their own instrument\'s sweet spot'],
    ['show','A1','Leave headroom for solos, do not chase them','In jazz the dynamics are the music, not a problem'],
    ['show','LX','Slow fades only, follow the soloist','The light should breathe with the music'],
    ['show','US','Seat between tunes, never during a solo','A solo is the quietest, most personal moment','club'],
    ['break','STR','Lounge music under the break slate','A silent stream feels like a dropped stream']],
  theatre:[
    ['pre','SM','Call places 5 minutes before curtain','Theatre runs on calls, and places is the first'],
    ['pre','LX','Ghost light off, preset up','The stage belongs to the show now'],
    ['show','SM','Call every cue by number: standby, then go','In theatre the stage manager calls the show'],
    ['show','A1','Follow the script for every mic on and off','An open mic offstage broadcasts the backstage'],
    ['show','FL','Run props and quick changes to the table','A missing prop stops a scene','club'],
    ['qa','LX','Bows look: full stage, house at 30','Applause deserves light'],
    ['strike','LX','Ghost light on before the last one leaves','A dark stage is a dangerous stage, and the ghosts get their show']]
};
function build(genre,size){
  const si=Math.max(0,SIZE_ORDER.indexOf(size||'hall'));
  const rows=BASE.concat(EXTRA[genre]||EXTRA.business);
  return rows.filter(r=>!r[4]||SIZE_ORDER.indexOf(r[4])<=si).map((r,i)=>({
    id:(genre||'business')+'-'+r[0]+'-'+r[1]+'-'+i, phase:r[0], role:R[r[1]], text:r[2], why:r[3]}));
}
function phaseName(p,scenes){const k=SCENE_OF[p];return (scenes&&k&&scenes[k])||PHASE_BASE[p]||p;}
function phaseOfScene(k){for(const [p,s] of Object.entries(SCENE_OF))if(s===k)return p;return null;}
window.DeskPlaybook={PHASES,build,phaseName,phaseOfScene,ROLES:Object.values(R)};
})();
