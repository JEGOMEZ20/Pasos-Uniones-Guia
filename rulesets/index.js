import naval from "./naval.js";
import shipsBase from "./ships.js";
import ssc from "./ssc.js";

const clone = (value) => (value ? JSON.parse(JSON.stringify(value)) : value);

const ships = {
  ...shipsBase,
  CLASS_LIMITS: shipsBase.CLASS_LIMITS ? clone(shipsBase.CLASS_LIMITS) : clone(naval.CLASS_LIMITS),
};

export const RULESETS = {
  naval: { ...naval, CLASS_LIMITS: clone(naval.CLASS_LIMITS) },
  ships,
  ssc,
};
