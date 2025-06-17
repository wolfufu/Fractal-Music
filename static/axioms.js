export function getAxiomDefaults(type) {
  const presets = {
    dragon: {
      axiom: "FX",
      rules: { "X": "X+YF+", "Y": "-FX-Y" },
      angle: 90
    },
    koch: {
      axiom: "F",
      rules: { "F": "F+F−F−F+F" },
      angle: 90
    },
    tree: {
      axiom: "F",
      rules: { "F": "F[+F]F[-F]F" },
      angle: 25
    },
    barnsley: { 
      axiom: "X",
      rules: { 
        "X": [
          {rule: "F+[[X]-X]-F[-FX]+X", probability: 0.5},
          {rule: "FF", probability: 0.3},
          {rule: "F[+X][-X]", probability: 0.2}
        ]
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
