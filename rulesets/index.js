import naval from "./naval.js";
import ships from "./ships.js";
import ssc from "./ssc.js";

if (!ships.CLASS_LIMITS) {
  ships.CLASS_LIMITS = naval.CLASS_LIMITS;
}

export const RULESETS = { naval, ships, ssc };
