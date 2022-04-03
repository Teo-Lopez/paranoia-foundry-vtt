import { isItem, isWeapon, showDialog } from '../../utils/index.js'
import { damageTable } from '../constants/damageTable.js'

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ParanoiaItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData()
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null
    const rollData = this.actor.getRollData()
    rollData.item = foundry.utils.deepClone(this.data.data)

    return rollData
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data

    // Initialize chat data.

    try {
      const roll = await this._createRoll(item)

      return roll
    } catch (error) {
      console.error(error)
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? '',
      })
      return
    }
    // If you need to store the value first, uncomment the next line.
    // let result = await roll.roll({async: true});
    // }
  }

  _createRoll(item) {
    if (isItem(item)) {
      return this._rollNormalFormula(item)
    }
    if (isWeapon(item)) {
      return this._checkArmorAndResistance(item)
    }
  }

  _rollNormalFormula(item) {
    const rollData = this.getRollData()
    // Invoke the roll and submit it to chat.
    const roll = new Roll(rollData.item.formula, rollData)
    this._showRollMessage(`[${item.type}] ${item.name}`, roll)
  }

  _rollSkill(item) {
    const rollData = this.getRollData()
    console.log(item.data.mod, rollData)
    // Invoke the roll and submit it to chat.
    const roll = new Roll(rollData.item.formula, rollData)
    this._showRollMessage(`[${item.type}] ${item.name}`, roll)
  }

  _checkArmorAndResistance(item) {
    showDialog({
      title: 'Damage Roll',
      content: `
                <div>
                  <div class="grid">
                    <label>Resistencia del objetivo</label><input value="0" name="resistance"></input>
                  </div>
                  <div class="grid">
                    <label>Armadura del objetivo</label><input value="0" name="armor"></input>
                  </div>
                </div>`,
      buttons: {
        armor: {
          label: 'Tirar',
          callback: (html) => {
            const armor = $(html).find('[name=resistance]').val()
            const resistance = $(html).find('[name=armor]').val()
            this._rollDamageRoll(item, resistance, armor)
          },
        },
      },
      default: 'Tirar',
    })
  }

  async _rollDamageRoll(item, resistance, armor) {
    const roll = new Roll('1d20')
    let result = await roll.roll({ async: true })
    let baseDamage = item.data.damage - (resistance + armor)
    if (baseDamage <= 0)
      return this._showRollMessage(`[${item.type}] ${item.name} - SE`, roll)
    else {
      const damageRow = Object.entries(damageTable[item.data.damage])
      let finalDamage = damageRow.reduce((acc, [key, value]) => {
        if (value <= result.total) return key
        else return acc
      }, 'SE')

      this._showRollMessage(
        `[${item.type}] ${item.name} - ${finalDamage}`,
        roll
      )

      return roll
    }
  }

  _showRollMessage(label, roll) {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor })
    const rollMode = game.settings.get('core', 'rollMode')
    roll.toMessage({
      speaker: speaker,
      rollMode: rollMode,
      flavor: label,
    })
  }
}
