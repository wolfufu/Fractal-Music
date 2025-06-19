export function getAxiomDefaults(type) {
  const presets = {
    dragon: {
      axiom: "FX",
      rules: { "X": "X+YF+", "Y": "-FX-Y" },
      angle: 90
    },
    koch: {
      axiom: "F++F++F", 
      rules: { 
        "F": "F-F++F-F" 
      },
      angle: 60,
      initLength: 100
    },
    tree: {
      axiom: "F",
      rules: { "F": "F[+F]F[-F]F" },
      angle: 25
    },
    barnsley: {
      axiom: "X",
      rules: {
        "X": "F+[[X]-X]-F[-FX]+X", 
        "F": "FF" 
      },
      angle: 25, 
      initLength: 5
    },
    stochastic_tree: {
      axiom: "F",
      rules: {
        "F": [
          {rule: "F[+F]F[-F]F", probability: 0.4},
          {rule: "F[+F]F", probability: 0.3},
          {rule: "F[-F]F", probability: 0.3}
        ]
      },
      angle: 22.5
    },
    branching_tree: {
      axiom: "X",
      rules: {
        "X": "F[+X][-X]FX",
        "F": "FF"
      },
      angle: 22.5
    },
    asymmetric_tree: {
      axiom: "X",
      rules: {
        "X": "F[+X]F[-X]+X",
        "F": "FF"
      },
      angle: 20
    },
    complex_branching: {
      axiom: "F",
      rules: {
        "F": "FF-[-F+F+F]+[+F-F-F]"
      },
      angle: 22.5
    },
    simple_branching: {
      axiom: "F",
      rules: {
        "F": "F[+F]F[-F]"
      },
      angle: 25
    }
  };
  return presets[type] || null;
}

export function generateLSystem({ axiom, rules, depth }) {
  let result = axiom;
  for (let i = 0; i < depth; i++) {
    result = result.split('').map(ch => {
      if (rules[ch]) {
        // Для папоротника с вероятностями
        if (Array.isArray(rules[ch])) {
          const rand = Math.random();
          let cumulativeProb = 0;
          for (const rule of rules[ch]) {
            cumulativeProb += rule.probability;
            if (rand <= cumulativeProb) {
              return rule.rule;
            }
          }
          return rules[ch][0].rule; // fallback
        }
        // Стандартная обработка для других фракталов
        return rules[ch];
      }
      return ch;
    }).join('');
  }
  return result;
}
