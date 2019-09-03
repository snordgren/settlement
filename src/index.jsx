import React from 'react';
import ReactDOM from 'react-dom';

import { tickCharacters } from './character';
import { addLogMessage } from './log';
import { resourceList } from './resources';
import { tickThreshold } from './settings';

import './index.css';

const actions = {
  none: {
    id: 'none',
    name: 'None',
    resources: {}
  },
  gather: {
    id: 'gather',
    name: 'Gather',
    resources: {
      iron: [0.1],
      rocks: [0.5],
      potatoes: [0.8, 0.4],
      sticks: [0.3]
    }
  },
  craftRockKnife: {
    id: 'craftRockKnife',
    name: 'Craft Rock Knife',
    resourceRequirements: {
      rocks: 2
    },
    resources: {
      rockKnife: [1]
    },
    useResources: {
      rocks: 2
    }
  }
};

class App extends React.Component {
  constructor(props) {
    super(props);

    const resources = {};
    Object.keys(resourceList).forEach(r => {
      resources[r] = 0;
    });

    this.state = {
      day: 0,
      ids: 1,
      lastTickTime: 0,
      tickProgress: 0,
      buildings: {
        sawmills: 0
      },
      characters: {},
      log: [],
      resources
    };

    this.state = this.createCharacter('Boy', this.state);
  }

  createCharacter(name, state) {
    const id = state.ids;
    const newCharacter = { id, name, action: actions.none, hunger: 0 };
    const newCharacters = { ...state.characters };
    newCharacters[id] = newCharacter;

    return { ...state, characters: newCharacters };
  }

  componentDidMount() {
    requestAnimationFrame(this.tick.bind(this));
  }

  render() {
    const { characters, resources } = this.state;

    const actionOptions = Object.values(actions)
      .filter((action) => {
        const { resourceRequirements } = action;
        if (!resourceRequirements) {
          return true;
        }

        for (let [resource, requiredAmount] of Object.entries(resourceRequirements)) {
          const owned = resources[resource];
          if (!owned || owned < requiredAmount) {
            return false;
          }
        }
        return true;
      })
      .map((value) => <option key={value.id} value={value.id}>{value.name}</option>);

    const updateCharacter = (character, newCharacter) => {
      const { characters } = this.state;
      const newCharacters = { ...characters };
      newCharacters[character.id] = { ...character, ...newCharacter };
      this.setState({ characters: newCharacters });
    };

    const characterDiv = character => (
      <div key={character.id}>
        <div>Name: {character.name}</div>
        {character.hunger != 0 && <div>Hunger: {character.hunger}</div>}
        <label>Action</label>
        <select value={character.action.id} onChange={ev => {
          updateCharacter(character, { action: actions[ev.currentTarget.value] });
        }}>
          {actionOptions}
        </select>
      </div>
    );

    const resourceDiv = (value, name) => value > 0 && <div>{name}: {value}</div>;

    const updateResources = (newResources) => {
      this.setState({ resources: { ...resources, ...newResources } });
    };

    const resourceButton = (name, action) => {
      return (
        <button key={name} onClick={() => {
          action();
        }}>{name}</button>
      );
    }

    const tickPct = Math.round(this.state.tickProgress * 100);

    return (
      <div>
        <h1>Settlement</h1>
        <div style={{ backgroundColor: 'red', width: (this.state.tickProgress * 95 + 5) + '%' }}>
          Day {this.state.day}
        </div>

        <div>
          <h2>Characters</h2>
          {Object.values(characters).map(characterDiv)}
        </div>

        <div>
          <h2>Resources</h2>
          {Object.entries(resourceList)
            .map(([k, v]) => resourceDiv(resources[k], v.name))}
        </div>

        <div>
          <h2>Log</h2>
          {this.state.log.slice(Math.max(this.state.log.length - 16, 0))}
        </div>
      </div>
    );
  }

  tick(tickTime) {
    const { lastTickTime } = this.state;

    const progress = (tickTime - lastTickTime) / tickThreshold;
    if (progress >= 1) {
      this.setState(tickState(this.state, tickTime));
    } else {
      this.setState({
        tickProgress: progress
      });
    }

    requestAnimationFrame(this.tick.bind(this));
  }
}

function tickState(state, tickTime) {
  state = tickCharacters(state);
  const { characters, day, log, resources } = state;

  const gainOf = arr => {
    if (!arr) {
      return 0;
    }

    let gain = 0;
    for (let chance of arr) {
      if (Math.random() < chance) {
        gain++;
      }
    }
    return gain;
  }

  const newCharacters = { ...characters };
  const newLog = [...log];
  const newResources = { ...resources };

  for (let character of Object.values(newCharacters)) {
    for (let resource of Object.keys(resourceList)) {
      const { useResources } = character.action;
      let canPerform = true;

      if (useResources) {
        for (let resource of Object.keys(resourceList)) {
          const amount = newResources[resource] ? newResources[resource] : 0;
          const required = useResources[resource] ? useResources[resource] : 0;
          if (required > amount) {
            canPerform = false;
          }
        }
      }

      if (canPerform) {
        const amount = gainOf(character.action.resources[resource]);

        if (amount > 0) {
          const usedUp = useResources ? useResources[resource] : 0;
          const previous = newResources[resource];
          const newAmount = amount + (previous ? previous : 0) - (usedUp ? usedUp : 0);
          newResources[resource] = newAmount;

          addLogMessage(day, newLog, `${character.name} created ` + 
            `${amount} ${resourceList[resource].name}`);
        }
      } else {
        const newCharacter = { ...character };
        newCharacter.action = actions.none;
        newCharacters[character.id] = newCharacter;
      }
    }
  }

  return {
    ...state,
    day: state.day + 1,
    lastTickTime: Math.round(tickTime / 1000) * 1000,
    characters: newCharacters,
    log: newLog,
    resources: newResources,
    tickProgress: 0
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
