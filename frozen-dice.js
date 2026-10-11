/**
 * Frozen Dice - Constitution Save Button for All Characters
 * Adds a scene control button that rolls Con saves for all player characters
 */

// Module namespace
const MOD_ID = 'frozen-dice';

/**
 * Initialize module settings
 */
function registerSettings() {
  game.settings.register(MOD_ID, 'conSaveDC', {
    name: 'Default Constitution Save DC',
    hint: 'The default DC to use for Constitution saving throws',
    scope: 'world',
    config: true,
    type: Number,
    default: 15,
    min: 0,
    max: 100,
    step: 1
  });

  game.settings.register(MOD_ID, 'showButtonToPlayers', {
    name: 'Show Button to Players',
    hint: 'If enabled, all players see the button (only GM can click it)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MOD_ID, 'includeNPCs', {
    name: 'Include NPCs',
    hint: 'Also roll saves for NPCs owned by the GM',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}

/**
 * Add custom CSS for the button
 */
function addStyles() {
  const style = document.createElement('style');
  style.id = `${MOD_ID}-styles`;
  style.textContent = `
    #frozen-dice-con-save {
      color: #2e8b57 !important;
    }
    #frozen-dice-con-save:hover {
      color: #3cb371 !important;
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Get the Constitution save modifier for an actor
 * Handles different system implementations
 * @param {Actor} actor - The actor to check
 * @returns {number} The save modifier (or 0 if not found)
 */
function getConstitutionSaveModifier(actor) {
  // Try D&D5e style
  if (actor.system?.attributes?.savingThrows?.con?.value !== undefined) {
    return actor.system.attributes.savingThrows.con.value;
  }
  
  // Try PF2e style
  if (actor.system?.saves?.constitution?.value !== undefined) {
    return actor.system.saves.constitution.value;
  }
  
  // Try generic approach - look for constitution ability mod
  const conMod = actor.system?.abilities?.con?.mod || 
                 actor.system?.attributes?.con?.mod ||
                 actor.system?.abilityScores?.con?.mod ||
                 0;
  
  // If no proficiency, just return ability mod
  const proficiency = actor.system?.attributes?.savingThrows?.con?.prof || 
                      actor.system?.saves?.constitution?.rank || 
                      0;
  
  return conMod + proficiency;
}

/**
 * Roll Constitution save for a single actor
 * @param {Actor} actor - The character actor
 * @param {number} dc - The saving throw DC
 */
async function rollConSaveForActor(actor, dc) {
  try {
    const conSaveMod = getConstitutionSaveModifier(actor);
    
    // Build the roll formula
    const formula = conSaveMod >= 0 
      ? `d20 + ${conSaveMod}` 
      : `d20 - ${Math.abs(conSaveMod)}`;
    
    // Create and roll
    const roll = new Roll(formula);
    await roll.roll();
    
    // Determine success/failure
    const isSuccess = roll.total >= dc;
    const flavor = `<strong>${actor.name}</strong> - Constitution Save (DC ${dc})`;
    
    // Send to chat with color coding
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: flavor,
      roll: roll,
      flags: {
        [MOD_ID]: {
          type: 'conSave',
          dc: dc,
          success: isSuccess,
          ability: 'con',
          modifier: conSaveMod
        }
      }
    };
    
    // Style the message based on result
    if (isSuccess) {
      chatData.content = `<div style="color: green; font-weight: bold;">✓ SUCCESS (${roll.total} vs DC ${dc})</div>`;
    } else {
      chatData.content = `<div style="color: red; font-weight: bold;">✗ FAILURE (${roll.total} vs DC ${dc})</div>`;
    }
    
    await ChatMessage.create(chatData);
    
    return { actor, roll: roll.total, success: isSuccess, dc };
    
  } catch (error) {
    console.error(`${MOD_ID} | Error rolling Con save for ${actor?.name}:`, error);
    return { actor, error: error.message, success: false, dc };
  }
}

/**
 * Roll a Constitution saving throw for all relevant characters
 */
async function rollConSaveForAllCharacters() {
  const dc = game.settings.get(MOD_ID, 'conSaveDC');
  const includeNPCs = game.settings.get(MOD_ID, 'includeNPCs');
  
  // Get all relevant actors
  const characters = [];
  
  for (const actor of game.actors) {
    // Player characters
    if (actor.type === 'character' && actor.hasPlayerOwner) {
      characters.push(actor);
    }
    // NPCs if enabled
    else if (includeNPCs && actor.type === 'npc' && actor.hasPlayerOwner) {
      characters.push(actor);
    }
  }
  
  if (characters.length === 0) {
    ui.notifications.warn(`${MOD_ID}: No characters found!`);
    return;
  }
  
  // Roll for each character
  const results = [];
  for (const actor of characters) {
    const result = await rollConSaveForActor(actor, dc);
    results.push(result);
    
    // Small delay to avoid flooding chat
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary notification
  const successes = results.filter(r => r.success).length;
  ui.notifications.info(
    `${MOD_ID}: Rolled Con saves (DC ${dc}) - ${successes}/${characters.length} succeeded`
  );
  
  return results;
}

/**
 * Hook to add button to scene controls
 */
function addConSaveButton() {
  Hooks.on('getSceneControlButtons', (controls) => {
    const isGM = game.user?.isGM || false;
    
    console.log(`${MOD_ID} | getSceneControlButtons called, GM=${isGM}, controls count=${controls.length}`);
    
    // Add to the first control group (usually "token")
    if (controls.length > 0) {
      const groupName = controls[0].name;
      const toolsBefore = controls[0].tools.length;
      
      controls[0].tools.push({
        name: 'frozen-dice-con-save',
        title: 'Con Save All',
        icon: 'fas fa-shield-virus',
        visible: isGM,
        onClick: rollConSaveForAllCharacters,
        button: true
      });
      
      console.log(`${MOD_ID} | Added Con Save button to group "${groupName}", tools count: ${toolsBefore} -> ${controls[0].tools.length}`);
    } else {
      console.warn(`${MOD_ID} | No control groups found to add button to`);
    }
  });
}

// ============================================
// Initialization
// ============================================

Hooks.once('init', () => {
  console.log(`${MOD_ID} | Initializing...`);
  registerSettings();
  addConSaveButton();
});

Hooks.once('ready', () => {
  console.log(`${MOD_ID} | Ready`);
  addStyles();
  
  // Add keybind
  game.keybindings.register(MOD_ID, 'conSaveAll', {
    name: 'Roll Con Save for All Characters',
    hint: 'Rolls a Constitution saving throw for all characters',
    editable: [
      { key: 'KeyC', modifiers: [KeyboardManager.MODIFIER_KEYS.CONTROL, KeyboardManager.MODIFIER_KEYS.SHIFT] }
    ],
    onDown: () => {
      if (game.user.isGM) {
        rollConSaveForAllCharacters();
      }
    },
    restricted: true,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
});

Hooks.once('setup', () => {
  // Optional: Register socket if you need server-client communication
  // if (game.socket) {
  //   game.socket.on(`module.${MOD_ID}`, handleSocketMessage);
  // }
});
