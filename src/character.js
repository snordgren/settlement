import { addLogMessage } from './log';
import { resourceList } from './resources';
import { starvationDayCount } from './settings';

export function tickCharacters(state) {
  const { characters, day, log, resources } = state;
  const newCharacters = { ...characters };
  const newLog = [...log];
  const newResources = { ...resources };

  for (let character of Object.values(characters)) {
    const newCharacter = { ...character };
    newCharacter.hunger++;

    // consume food
    consumeFood(day, newResources, newLog, newCharacter);
    
    if (newCharacter.hunger >= starvationDayCount) {

      delete newCharacters[character.id];
    } else {

      newCharacters[character.id] = newCharacter;
    }
  }
  return { ...state, characters: newCharacters, log: newLog, resources: newResources };
}

function consumeFood(day, resources, log, character) {
  let foundConsumable = true;

  while (character.hunger > 0 && foundConsumable) {
    foundConsumable = false;
    
    for (let [k, resource] of Object.entries(resourceList)) {
      const amount = resources[k];
      const hungerLoss = resource.hunger;

      if (amount > 0 && hungerLoss < 0 && resources[k] && character.hunger + hungerLoss >= 0) {

        const newAmount = amount - 1;
        resources[k] = newAmount;
        character.hunger += hungerLoss;
        foundConsumable = true;

        addLogMessage(day, log, `${character.name} ate ${resource.name}.`);
      }
    }
  }
}
