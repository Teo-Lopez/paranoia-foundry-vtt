export const healthStatus = {
  B: "Bien",
  A: "Aturdido",
  H: "Herido",
  L: "Lisiado",
  I: "Incapacitado",
  M: "Muerto",
  V: "Vaporizado",
};
export const damagesArray = Object.entries(healthStatus);

export const getDamageDone = (damage, resistance, armor, successMargin) => {
  if (successMargin < 0) {
    return damagesArray[0];
  }
  const baseIndex = damagesArray.findIndex(([key, _val]) => key === damage.min);
  const maxPossibleIndex = damagesArray.findIndex(
    ([key, _val]) => key === damage.max
  );
  let calculatedBaseIndex = baseIndex - (resistance + armor);

  successMargin = successMargin < 0 ? 0 : successMargin;
  calculatedBaseIndex = calculatedBaseIndex < 0 ? 0 : calculatedBaseIndex;

  const finalIndex =
    calculatedBaseIndex + Math.floor(successMargin / damage.augment);
  console.log(successMargin);

  if (finalIndex > maxPossibleIndex) {
    return damagesArray[maxPossibleIndex];
  } else {
    return damagesArray[finalIndex];
  }
};
