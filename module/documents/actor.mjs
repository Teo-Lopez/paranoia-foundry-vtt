import { abilityMods } from '../constants/abilityMods.js'
import { damageAndResistanceMods } from '../constants/damageAndResistanceMods.js'
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ParanoiaActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData()
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data
    const data = actorData.data
    const flags = actorData.flags.paranoia || {}

    actorData.type === 'character' && this._prepareCharacterData(actorData)
    actorData.type === 'npc' && this._prepareNpcData(actorData)
  }

  // Prepare Character type specific data

  _prepareCharacterData(actorData) {
    this._calcAtrrModifiers(actorData)
    this._calcCarryingCapacity(actorData)
    this._calcPhysicalDamage(actorData)
    this._calcResistance(actorData)
    this._calcSkillsValues(actorData)
  }

  _calcAtrrModifiers(actorData) {
    const data = actorData.data
    for (let [key, attribute] of Object.entries(data.attributes)) {
      attribute.mod = abilityMods[+attribute.value]
    }
    data.mutantPower.max = data.attributes.power.value
  }

  _calcSkillsValues(actorData) {
    const data = actorData.data
    for (let [_skillName, skill] of Object.entries(data.skills)) {
      skill.baseValue = data.attributes[skill.attribute].mod
      skill.value = skill.baseValue + skill.points
      skill.className = skill.points > 12 ? 'error' : ''
    }
    this._calcTotalSkillPoints(actorData)
  }

  _calcTotalSkillPoints(actorData) {
    const data = actorData.data
    data.skillPoints.value = Object.values(data.skills).reduce(
      (acc, skill) => acc - skill.points,
      data.skillPoints.max
    )
    data.skillPoints.className =
      data.skillPoints.value >= 0 ? 'success' : 'error'
  }

  _calcCarryingCapacity(actorData) {
    const data = actorData.data
    const isOverMinimum = data.attributes.strength.value - 12 > 0
    data.carry = isOverMinimum
      ? (data.attributes.strength.value - 12) * 5 + 25
      : 25
  }

  _calcPhysicalDamage(actorData) {
    const data = actorData.data
    data.physicalDamage =
      damageAndResistanceMods[+data.attributes.strength.value]
  }
  _calcResistance(actorData) {
    const data = actorData.data
    data.resistance =
      damageAndResistanceMods[+data.attributes.constitution.value]
  }

  //==============================================================================
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return

    // Make modifications to data here. For example:
    const data = actorData.data
    data.xp = data.cr * data.cr * 100
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData()

    // Prepare character roll data.
    this.data.type === 'character' && this._getCharacterRollData(data)
    this.data.type === 'npc' && this._getNpcRollData(data)

    return data
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v)
      }
    }
    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    // Process additional NPC data here.
  }
}
