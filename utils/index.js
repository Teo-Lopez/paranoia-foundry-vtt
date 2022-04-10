import { damageTable } from '../module/constants/damageTable.js'
export const isItem = (item) => item.type === 'item'
export const isWeapon = (item) => item.type === 'weapon'

export const showDialog = ({
  title,
  content,
  buttons,
  default: defaultValue,
}) => {
  let d = new Dialog({
    title,
    content,
    buttons,
    default: defaultValue,
    render: (html) =>
      console.log('Register interactivity in the rendered dialog'),
    close: (html) =>
      console.log('This always is logged no matter which option is chosen'),
  })
  d.render(true)
}

export const getStringDamageResult = (damage, result) => {
  const damageRow = Object.entries(damageTable[damage])
  return damageRow.reduce((acc, [key, value]) => {
    if (value <= result.total) return key
    else return acc
  }, 'SE')
}
