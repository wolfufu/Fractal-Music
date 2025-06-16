
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
    }
  };
  return presets[type] || null;
}

export function generateLSystem({ axiom, rules, depth }) {
  let result = axiom;
  for (let i = 0; i < depth; i++) {
    result = result.split('').map(ch => rules[ch] || ch).join('');
  }
  return result;
}
