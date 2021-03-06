// Import document classes.
import { ParanoiaActor } from './documents/actor.mjs'
import { ParanoiaItem } from './documents/item.mjs'
// Import sheet classes.
import { ParanoiaActorSheet } from './sheets/actor-sheet.mjs'
import { ParanoiaItemSheet } from './sheets/item-sheet.mjs'
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs'
import { PARANOIA } from './helpers/config.mjs'
/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async () => {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.paranoia = {
    ParanoiaActor,
    ParanoiaItem,
    rollItemMacro,
  }

  // Add custom constants for configuration.
  CONFIG.PARANOIA = PARANOIA
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20+@attributes.agility.mod',
    decimals: 2,
  }

  // Define custom Document classes
  CONFIG.Actor.documentClass = ParanoiaActor
  CONFIG.Item.documentClass = ParanoiaItem

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('paranoia', ParanoiaActorSheet, { makeDefault: true })
  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('paranoia', ParanoiaItemSheet, { makeDefault: true })

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates()
})

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function () {
  var outStr = ''
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg]
    }
  }
  return outStr
})

Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase()
})

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
  await game.i18n.setLanguage('es')

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => {
    console.log(data)
    data.type === 'Item' && createItemMacro(data, slot)
  })
})

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (!('data' in data))
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    )
  const item = data.data

  // Create the macro command
  const command = `game.paranoia.rollItemMacro("${item.name}");`
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  )
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'paranoia.itemMacro': true },
    })
  }
  game.user.assignHotbarMacro(macro, slot)
  return false
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    )

  // Trigger the item roll
  return item.roll()
}
