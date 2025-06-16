
import { getAxiomDefaults, generateLSystem } from './axioms.js';

function setupToggle(component) {
  const toggle = document.getElementById(`${component}-toggle-mode`);
  const rulesArea = document.getElementById(`${component}-rules`);

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      const type = document.getElementById(`${component}-type`).value;
      const axiomDefaults = getAxiomDefaults(type);
      if (!axiomDefaults) {
        rulesArea.value = "Нет поддержки L-системы для этого типа.";
        return;
      }
      rulesArea.value = JSON.stringify({
        axiom: axiomDefaults.axiom,
        rules: axiomDefaults.rules,
        angle: axiomDefaults.angle
      }, null, 2);
    } else {
      if (window.fractalSystem) {
        const defaultRules = window.fractalSystem.getDefaultRules(
          window.fractalSystem[component].type
        );
        rulesArea.value = JSON.stringify(defaultRules, null, 2);
      }
    }
  });
}

["melody", "bass", "drums"].forEach(setupToggle);
