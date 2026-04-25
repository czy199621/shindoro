import type { CharacterDefinition } from "../types.js";
import { CHARACTER_A } from "./characters/characterA.js";
import { CHARACTER_B } from "./characters/characterB.js";
import { CHARACTER_C } from "./characters/characterC.js";
import { CHARACTER_D } from "./characters/characterD.js";
import { CHARACTER_E } from "./characters/characterE.js";
import { CHARACTER_F } from "./characters/characterF.js";
import { CHARACTER_G } from "./characters/characterG.js";

export {
  CHARACTER_A,
  CHARACTER_A_SLOT_ABILITIES,
  CHARACTER_A_PASSIVE
} from "./characters/characterA.js";
export {
  CHARACTER_B,
  CHARACTER_B_SLOT_ABILITIES,
  CHARACTER_B_PASSIVE
} from "./characters/characterB.js";
export {
  CHARACTER_C,
  CHARACTER_C_SLOT_ABILITIES,
  CHARACTER_C_PASSIVE
} from "./characters/characterC.js";
export {
  CHARACTER_D,
  CHARACTER_D_SLOT_ABILITIES,
  CHARACTER_D_PASSIVE
} from "./characters/characterD.js";
export {
  CHARACTER_E,
  CHARACTER_E_SLOT_ABILITIES,
  CHARACTER_E_PASSIVE
} from "./characters/characterE.js";
export {
  CHARACTER_F,
  CHARACTER_F_SLOT_ABILITIES,
  CHARACTER_F_PASSIVE
} from "./characters/characterF.js";
export {
  CHARACTER_G,
  CHARACTER_G_SLOT_ABILITIES,
  CHARACTER_G_PASSIVE
} from "./characters/characterG.js";

export const CHARACTERS: CharacterDefinition[] = [
  CHARACTER_A,
  CHARACTER_B,
  CHARACTER_C,
  CHARACTER_D,
  CHARACTER_E,
  CHARACTER_F,
  CHARACTER_G
];

export const CHARACTER_LOOKUP: Record<string, CharacterDefinition> = Object.fromEntries(
  CHARACTERS.map((character) => [character.id, character])
) as Record<string, CharacterDefinition>;
