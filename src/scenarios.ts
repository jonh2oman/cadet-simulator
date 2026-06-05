export type RadioMessage = {
  speaker: 'COAST GUARD' | 'CADET' | 'TUGBOAT' | 'MARINA' | 'OTHER';
  text: string;
  options?: { text: string; nextNode: string }[];
};

export type ScenarioNode = {
  id: string;
  messages: RadioMessage[];
  expectedChannel?: string | number;
};

export const scenarios: Record<string, Record<string, ScenarioNode>> = {
  'distress-mayday': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'Practice initiating a MAYDAY call. You have struck a submerged container and are taking on water rapidly. Ensure you are on Channel 16.',
          options: [
            { text: 'MAYDAY MAYDAY MAYDAY', nextNode: 'mayday-1' },
            { text: 'PAN-PAN PAN-PAN PAN-PAN', nextNode: 'wrong-call' },
            { text: 'Help, we are sinking!', nextNode: 'informal-call' }
          ]
        }
      ]
    },
    'mayday-1': {
      id: 'mayday-1',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Vessel calling MAYDAY, this is Canadian Coast Guard Radio. State your vessel name, position, nature of distress, and number of persons on board. Over.',
          options: [
            { text: 'MAYDAY. This is Cadet Vessel. Position: 1 mile south of the breakwater. We struck an object and are taking on water. 4 persons on board. We need immediate pumps. Over.', nextNode: 'mayday-success' },
            { text: 'This is Cadet Vessel. We are sinking near the breakwater. Over.', nextNode: 'missing-info' }
          ]
        }
      ]
    },
    'missing-info': {
      id: 'missing-info',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Cadet Vessel, Coast Guard. What is your exact position and how many persons are on board? Over.',
          options: [
            { text: 'Position: 1 mile south of breakwater. 4 persons on board. Over.', nextNode: 'mayday-success' }
          ]
        }
      ]
    },
    'mayday-success': {
      id: 'mayday-success',
      messages: [
        { speaker: 'COAST GUARD', text: 'Roger Cadet Vessel. Rescue asset is underway to your position. Have all personnel don life jackets and prepare your life raft. Maintain a listening watch on Channel 16. Coast Guard out.' }
      ]
    },
    'wrong-call': {
      id: 'wrong-call',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling PAN-PAN, this is Coast Guard. Be advised PAN-PAN is for urgency. Do you have a distress situation? Over.' }
      ]
    },
    'informal-call': {
      id: 'informal-call',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling for help, this is Canadian Coast Guard Radio. Are you declaring an emergency? Use proper MAYDAY protocol if you are in grave and imminent danger. Over.' }
      ]
    }
  },
  'medical-panpan': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'Practice an Urgency (PAN-PAN) call. A crew member has suffered a severe laceration. It is stable but requires medical advice. Ensure you are on Channel 16.',
          options: [
            { text: 'MAYDAY MAYDAY MAYDAY', nextNode: 'wrong-call-mayday' },
            { text: 'PAN-PAN PAN-PAN PAN-PAN', nextNode: 'panpan-1' }
          ]
        }
      ]
    },
    'panpan-1': {
      id: 'panpan-1',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'PAN-PAN, PAN-PAN, PAN-PAN, this is Canadian Coast Guard Radio. Go ahead with your traffic. Over.',
          options: [
            { text: 'Coast Guard, this is Cadet Vessel. We have a crewman with a severe laceration to the arm. Requesting medical consultation. Over.', nextNode: 'panpan-success' },
            { text: 'Coast Guard, this is Cadet Vessel. Over and out.', nextNode: 'panpan-fail' }
          ]
        }
      ]
    },
    'panpan-success': {
      id: 'panpan-success',
      messages: [
        { 
          speaker: 'COAST GUARD', 
          text: 'Cadet Vessel, Coast Guard. Roger. Please shift your radio to Channel 22 Alpha to speak with the duty flight surgeon. Coast Guard out.',
          options: [
            { text: 'Shift to Channel 22A and hail the Flight Surgeon.', nextNode: 'flight-surgeon-1' }
          ]
        }
      ]
    },
    'flight-surgeon-1': {
      id: 'flight-surgeon-1',
      expectedChannel: '22A',
      messages: [
        {
          speaker: 'OTHER',
          text: 'Cadet Vessel, this is the Duty Flight Surgeon on Channel 22 Alpha. Go ahead with your medical situation. Over.',
          options: [
            { text: 'Flight Surgeon, we have a 30-year-old male with a deep laceration on the forearm. Bleeding is controlled with a tourniquet. Over.', nextNode: 'flight-surgeon-success' }
          ]
        }
      ]
    },
    'flight-surgeon-success': {
      id: 'flight-surgeon-success',
      messages: [
        { speaker: 'OTHER', text: 'Roger. Keep the tourniquet tight and monitor vitals every 15 minutes. We are vectoring a medevac helo to your position. Out.' }
      ]
    },
    'panpan-fail': {
      id: 'panpan-fail',
      messages: [
        { speaker: 'COAST GUARD', text: 'Cadet Vessel, Coast Guard. "Over and out" is contradictory. "Over" means you expect a reply, "Out" means the conversation is finished. Please restate your traffic.' }
      ]
    },
    'wrong-call-mayday': {
      id: 'wrong-call-mayday',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling MAYDAY, state your life-threatening emergency. Over.' }
      ]
    }
  },
  'hazard-securite': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'You have spotted an unlit, partially submerged shipping container drifting in the main channel. Broadcast a safety warning on Channel 16.',
          options: [
            { text: 'SECURITE SECURITE SECURITE', nextNode: 'securite-1' },
            { text: 'PAN-PAN PAN-PAN PAN-PAN', nextNode: 'wrong-call' }
          ]
        }
      ]
    },
    'securite-1': {
      id: 'securite-1',
      messages: [
        {
          speaker: 'CADET',
          text: 'Wait... SECURITE calls shouldn\'t tie up Channel 16. How should you format the call?',
          options: [
            { text: 'All stations, this is Cadet Vessel. Unlit container adrift in main channel. Out.', nextNode: 'securite-fail' },
            { text: 'All stations, all stations, all stations. This is Cadet Vessel. For a safety broadcast concerning a drifting hazard, shift to Channel 22 Alpha. Cadet Vessel out.', nextNode: 'securite-success' }
          ]
        }
      ]
    },
    'securite-success': {
      id: 'securite-success',
      messages: [
        { 
          speaker: 'OTHER', 
          text: '(Silence. You successfully directed traffic to a working channel, keeping Channel 16 clear for distress calls. Now, you must shift your radio to Channel 22A and broadcast the hazard.)',
          options: [
            { text: 'Shift to Channel 22A to broadcast the warning.', nextNode: 'securite-22a' }
          ]
        }
      ]
    },
    'securite-22a': {
      id: 'securite-22a',
      expectedChannel: '22A',
      messages: [
        {
          speaker: 'CADET',
          text: 'SECURITE, SECURITE, SECURITE. All stations, this is Cadet Vessel. Drifting container spotted at position X. Keep sharp lookout. Out.'
        },
        {
          speaker: 'COAST GUARD',
          text: 'Cadet Vessel, Coast Guard. Roger your SECURITE broadcast. We will issue a Notice to Mariners. Thank you for keeping our waterways safe. Coast Guard out.'
        }
      ]
    },
    'securite-fail': {
      id: 'securite-fail',
      messages: [
        { speaker: 'COAST GUARD', text: 'Cadet Vessel, this is Coast Guard. Do not broadcast full safety messages on Channel 16. Direct traffic to a working channel.' }
      ]
    },
    'wrong-call': {
      id: 'wrong-call',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling PAN-PAN, Coast Guard. A drifting object is a SECURITE hazard unless it presents an immediate danger to your vessel. Switch to Channel 22A.' }
      ]
    }
  },
  'bridge-to-bridge': {
    start: {
      id: 'start',
      expectedChannel: 13,
      messages: [
        {
          speaker: 'CADET',
          text: 'You are navigating a narrow channel and see the tugboat "Ironhorse" pushing a barge ahead. You need to arrange a safe port-to-port passing. Switch to Channel 13.',
          options: [
            { text: 'Tug Ironhorse, Tug Ironhorse, this is the sailing vessel Cadet.', nextNode: 'bridge-1' },
            { text: 'Hey tugboat, get out of the way.', nextNode: 'informal' }
          ]
        }
      ]
    },
    'bridge-1': {
      id: 'bridge-1',
      messages: [
        {
          speaker: 'TUGBOAT',
          text: 'Sailing vessel Cadet, this is Ironhorse. Go ahead.',
          options: [
            { text: 'Ironhorse, we are approaching your bow. Requesting a port-to-port passing, on one whistle.', nextNode: 'bridge-success' },
            { text: 'Ironhorse, we are approaching. Requesting starboard-to-starboard passing, on two whistles.', nextNode: 'bridge-fail' }
          ]
        }
      ]
    },
    'bridge-success': {
      id: 'bridge-success',
      messages: [
        { speaker: 'TUGBOAT', text: 'Cadet, Ironhorse. Roger that, port-to-port on one whistle. I\'ll hold my course on the right side of the channel. Ironhorse out.' }
      ]
    },
    'bridge-fail': {
      id: 'bridge-fail',
      messages: [
        { speaker: 'TUGBOAT', text: 'Cadet, Ironhorse. Negative on the two whistles. I have limited draft and cannot move to my port side. We must pass port-to-port on one whistle. Acknowledge.' }
      ]
    },
    'informal': {
      id: 'informal',
      messages: [
        { speaker: 'TUGBOAT', text: 'Vessel hailing the tugboat, use proper marine protocol and identify yourself. Ironhorse out.' }
      ]
    }
  },
  'radio-check': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'Practice requesting a radio check. Under Canadian ROC-M guidelines, perform a radio check with CCG St. John\'s Radio. Call them on Ch 16.',
          options: [
            { text: 'St. John\'s Coast Guard Radio, St. John\'s Coast Guard Radio, St. John\'s Coast Guard Radio. This is Cadet Vessel. Requesting a radio check. Over.', nextNode: 'check-1' },
            { text: 'Hey St. John\'s Coast Guard, do you copy? Radio check please.', nextNode: 'check-fail-informal' }
          ]
        }
      ]
    },
    'check-1': {
      id: 'check-1',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Cadet Vessel, this is St. John\'s Coast Guard Radio. Shift to working Channel 83A for radio check. Over.',
          options: [
            { text: 'Roger. Shifting to Channel 83A. Cadet Vessel out.', nextNode: 'check-shift-83' }
          ]
        }
      ]
    },
    'check-shift-83': {
      id: 'check-shift-83',
      expectedChannel: '83A',
      messages: [
        {
          speaker: 'OTHER',
          text: '(St. John\'s Coast Guard Radio on Ch 83A): Cadet Vessel, this is St. John\'s Coast Guard Radio. How do you read me? Over.',
          options: [
            { text: 'St. John\'s Coast Guard Radio, this is Cadet Vessel. I read you strength 5, loud and clear. Over.', nextNode: 'check-success' }
          ]
        }
      ]
    },
    'check-success': {
      id: 'check-success',
      messages: [
        { speaker: 'COAST GUARD', text: 'Roger Cadet Vessel. St. John\'s Coast Guard Radio reads you strength 5, loud and clear. Out.' }
      ]
    },
    'check-fail-informal': {
      id: 'check-fail-informal',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling Coast Guard, be advised Channel 16 is for distress, urgency, safety, and calling. Use proper protocol and call signs. St. John\'s Coast Guard out.' }
      ]
    }
  },
  'mayday-relay': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'You spot the small pleasure craft "Blue Fin" capsizing 2 miles north of your position. Their radio is silent. You must broadcast a MAYDAY RELAY on Ch 16 to the Coast Guard.',
          options: [
            { text: 'MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY. All stations, this is Cadet Vessel.', nextNode: 'relay-1' },
            { text: 'MAYDAY, MAYDAY, MAYDAY. This is Cadet Vessel. A boat has capsized.', nextNode: 'relay-fail-direct' }
          ]
        }
      ]
    },
    'relay-1': {
      id: 'relay-1',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Vessel calling MAYDAY RELAY, this is St. John\'s Coast Guard Radio. Go ahead with your distress relay traffic. Over.',
          options: [
            { text: 'St. John\'s Coast Guard, this is Cadet Vessel. We have observed the pleasure craft Blue Fin capsize. Position: 2 miles north of Brockville Breakwater. 3 persons in the water. Over.', nextNode: 'relay-success' }
          ]
        }
      ]
    },
    'relay-success': {
      id: 'relay-success',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Roger Cadet Vessel. Coast Guard St. John\'s copies your MAYDAY RELAY. SAR helicopter and CCG cutter are dispatched to the Blue Fin. Acknowledge and maintain watch. Over.',
          options: [
            { text: 'Roger, Cadet Vessel will assist and stand by. Cadet Vessel out.', nextNode: 'relay-complete' }
          ]
        }
      ]
    },
    'relay-complete': {
      id: 'relay-complete',
      messages: [
        { speaker: 'COAST GUARD', text: 'Thank you for the relay. St. John\'s Coast Guard out.' }
      ]
    },
    'relay-fail-direct': {
      id: 'relay-fail-direct',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling MAYDAY, you are transmitting a direct distress call. Be advised you must use MAYDAY RELAY if you are transmitting on behalf of another vessel. St. John\'s Coast Guard out.' }
      ]
    }
  },
  'dsc-cancel': {
    start: {
      id: 'start',
      expectedChannel: 16,
      messages: [
        {
          speaker: 'CADET',
          text: 'You accidentally triggered the red DSC Distress button on your radio. A DSC alert was transmitted. Under ROC-M guidelines, cancel the alert on Ch 16 immediately.',
          options: [
            { text: 'All stations, all stations, all stations. This is Cadet Vessel, MMSI 316001234. Cancel my DSC distress alert of 1200 UTC. Over.', nextNode: 'cancel-1' },
            { text: 'Nevermind Coast Guard, that was a mistake. Cadet Vessel out.', nextNode: 'cancel-fail-informal' }
          ]
        }
      ]
    },
    'cancel-1': {
      id: 'cancel-1',
      messages: [
        {
          speaker: 'COAST GUARD',
          text: 'Vessel calling DSC cancellation, this is Canadian Coast Guard Radio. Please confirm you have no emergency on board and that your alert was accidental. Over.',
          options: [
            { text: 'Coast Guard, this is Cadet Vessel. Confirming alert was accidental. No assistance required. 4 persons on board. Safe. Over.', nextNode: 'cancel-success' }
          ]
        }
      ]
    },
    'cancel-success': {
      id: 'cancel-success',
      messages: [
        { speaker: 'COAST GUARD', text: 'Roger Cadet Vessel. Accidental distress alert cancelled. St. John\'s Coast Guard out.' }
      ]
    },
    'cancel-fail-informal': {
      id: 'cancel-fail-informal',
      messages: [
        { speaker: 'COAST GUARD', text: 'Vessel calling, you must identify your vessel name and provide your MMSI to cancel a DSC alert. St. John\'s Coast Guard out.' }
      ]
    }
  }
};
