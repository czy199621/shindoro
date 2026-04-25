export type PlayerId = "P1" | "P2";

export type GameScreen = "setup" | "mulligan" | "game";
export type GamePhase =
  | "setup"
  | "mulligan"
  | "turnStart"
  | "slotResolution"
  | "draw"
  | "mainTurn"
  | "combat"
  | "turnEnd"
  | "gameOver";

export type CardType = "minion" | "spell" | "persistent" | "trap";
export type SlotType = "jump" | "godDraw";
export type EffectTrigger = "onPlay" | "onDeath" | "onTurnStart" | "onTriggerMet" | "onAttacked";
export type TriggerConditionType = "enemyCastsSpell" | "enemySummonsMinion";
export type SlotTier = "jump10" | "jump13";
export type TalentCategory =
  | "survival"
  | "resource"
  | "deckControl"
  | "slotControl"
  | "combat"
  | "spell"
  | "burst";
export type PassiveKey =
  | "bonusJumpOnGain"
  | "extraGodDrawOnDisadvantage"
  | "loseOneSlotAtTurnStart"
  | "loseHpAtTurnStart"
  | "gainGodDrawOnBigDamage"
  | "healOnDrawPhase";

export interface Condition {
  type: TriggerConditionType;
}

export type DamageTarget =
  | "enemyHero"
  | "selfHero"
  | "allEnemyMinions"
  | "allFriendlyMinions"
  | "strongestEnemyMinion"
  | "weakestEnemyMinion"
  | "triggeredMinion";

export type BuffTarget = "allFriendlyMinions" | "allFriendlyMinionsExceptSource" | "triggeredMinion";
export type DestroyTarget = "strongestEnemyMinion" | "weakestEnemyMinion";
export type DiscardTarget = "self" | "opponent";

export interface DamageAction {
  type: "damage";
  target: DamageTarget;
  amount: number;
}

export interface HealAction {
  type: "heal";
  target: "selfHero" | "enemyHero";
  amount: number;
}

export interface DrawAction {
  type: "draw";
  count: number;
}

export interface SummonAction {
  type: "summon";
  cardId: string;
  count?: number;
}

export interface BuffAction {
  type: "buff";
  target: BuffTarget;
  atk?: number;
  hp?: number;
}

export interface DestroyAction {
  type: "destroy";
  target: DestroyTarget;
}

export interface AddSlotAction {
  type: "addSlot";
  slot: SlotType;
  amount: number;
}

export interface DiscardAction {
  type: "discard";
  target: DiscardTarget;
  count: number;
}

export interface SetTopDeckAction {
  type: "setTopDeck";
  cardId: string;
}

export interface DiscountNextDrawAction {
  type: "discountNextDraw";
  amount: number;
}

export interface AddCardToHandAction {
  type: "addCardToHand";
  cardId: string;
  count?: number;
}

export interface GainManaAction {
  type: "gainMana";
  amount: number;
}

export interface SetIgnoreGuardAction {
  type: "setIgnoreGuard";
  enabled?: boolean;
}

export interface ApplyOpponentNextTurnManaPenaltyAction {
  type: "applyOpponentNextTurnManaPenalty";
  amount: number;
}

export interface ApplyOpponentNextTurnManaMultiplierAction {
  type: "applyOpponentNextTurnManaMultiplier";
  multiplier: number;
}

export interface MillDeckAction {
  type: "millDeck";
  target: "self" | "opponent";
  count: number;
}

export interface MillDeckUntilRemainingAction {
  type: "millDeckUntilRemaining";
  target: "self" | "opponent";
  remaining: number;
  onlyIfAbove?: number;
}

export interface SetMillOnDamageTakenAction {
  type: "setMillOnDamageTaken";
  amount: number;
}

export interface ExilePriorityEnemyMinionAndDamageHeroAction {
  type: "exilePriorityEnemyMinionAndDamageHero";
  damageHeroBy: "health" | "attackAndHealth";
}

export interface GrantAdjacentGuardAction {
  type: "grantAdjacentGuard";
}

export interface BuffSelfIfHeroHpBelowAction {
  type: "buffSelfIfHeroHpBelow";
  threshold: number;
  atk?: number;
  hp?: number;
}

export interface GrantExtraTurnAction {
  type: "grantExtraTurn";
  loseIfNoWin?: boolean;
}

export interface PurgeAllMagicAndOtherMinionsAction {
  type: "purgeAllMagicAndOtherMinions";
  healPerRemoved?: number;
}

export interface SwapHeroHpAction {
  type: "swapHeroHp";
}

export interface DestroyAllMinionsAction {
  type: "destroyAllMinions";
}

export interface DestroyAllEnemyMinionsAction {
  type: "destroyAllEnemyMinions";
}

export interface DestroyPersistentsAction {
  type: "destroyPersistents";
  target: "all" | "enemy";
}

export interface DestroyEnemyTrapsAction {
  type: "destroyEnemyTraps";
}

export type EffectAction =
  | DamageAction
  | HealAction
  | DrawAction
  | SummonAction
  | BuffAction
  | DestroyAction
  | AddSlotAction
  | DiscardAction
  | SetTopDeckAction
  | DiscountNextDrawAction
  | AddCardToHandAction
  | GainManaAction
  | SetIgnoreGuardAction
  | ApplyOpponentNextTurnManaPenaltyAction
  | ApplyOpponentNextTurnManaMultiplierAction
  | MillDeckAction
  | MillDeckUntilRemainingAction
  | SetMillOnDamageTakenAction
  | ExilePriorityEnemyMinionAndDamageHeroAction
  | GrantAdjacentGuardAction
  | BuffSelfIfHeroHpBelowAction
  | GrantExtraTurnAction
  | PurgeAllMagicAndOtherMinionsAction
  | SwapHeroHpAction
  | DestroyAllMinionsAction
  | DestroyAllEnemyMinionsAction
  | DestroyPersistentsAction
  | DestroyEnemyTrapsAction;

export interface Effect {
  trigger: EffectTrigger;
  action: EffectAction;
  condition?: Condition;
}

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  attack?: number;
  health?: number;
  threat?: number;
  description: string;
  effects: Effect[];
  rarity?: "common" | "rare" | "epic";
  flavor?: string;
  tags?: string[];
}

export interface RuntimeCard extends CardDefinition {
  runtimeId: string;
  baseCost: number;
  currentCost: number;
}

export interface MinionInstance {
  instanceId: string;
  ownerId: PlayerId;
  sourceCardId: string;
  name: string;
  attack: number;
  health: number;
  maxHealth: number;
  threat: number;
  description: string;
  tags: string[];
  effects: Effect[];
  canAttack: boolean;
  summonedThisTurn: boolean;
  attacksThisTurn: number;
}

export interface PersistentInstance {
  instanceId: string;
  ownerId: PlayerId;
  sourceCardId: string;
  name: string;
  threat: number;
  description: string;
  effects: Effect[];
  type: "persistent" | "trap";
}

export interface PassiveAbility {
  key: PassiveKey;
  name: string;
  description: string;
}

export interface SlotAbility {
  name: string;
  description: string;
  effects: EffectAction[];
}

export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  baseHp: number;
  talentPoints: number;
  description: string;
  passive: PassiveAbility;
  slotAbilities: Record<SlotTier, SlotAbility>;
}

export type TalentEffect =
  | { type: "addMaxHp"; amount: number }
  | { type: "addHandLimit"; amount: number }
  | { type: "setTopDeckByRule"; rule: "lowestCostSpell" | "lowestCostCard" }
  | { type: "modifySlotGain"; slot: SlotType; amount: number }
  | { type: "bonusMana"; amount: number }
  | { type: "bonusDraw"; amount: number }
  | { type: "giveRushToLowCostMinions"; maxCost: number }
  | { type: "reduceHighCostMinionCost"; threshold: number; amount: number }
  | { type: "grantLoneMinionGuard" }
  | { type: "increaseSpellDamage"; amount: number }
  | { type: "healOnLowHpTurnStart"; threshold: number; amount: number }
  | { type: "retainSlotAfterBurst"; amount: number }
  | { type: "openingSlotBonus"; slot: SlotType; amount: number };

export type TalentSeat = "first" | "second";
export type TalentAvailability = "both" | TalentSeat;

export interface TalentPricing {
  first: number | null;
  second: number | null;
}

export interface TalentDefinition {
  id: string;
  name: string;
  category: TalentCategory;
  pricing: TalentPricing;
  availableFor: TalentAvailability;
  repeatLimit: number;
  description: string;
  effect: TalentEffect;
}

export interface DeckConfig {
  mainDeck: string[];
  sideboard: string[];
}

export interface DeckChoice {
  cardId: string;
  count: number;
}

export interface GraveyardEntry {
  id: string;
  name: string;
  runtimeId: string;
}

export interface TemporaryFlags {
  nextDrawDiscount: number;
  slotGainModifier: Record<SlotType, number>;
  openingBonusDraw: number;
  openingBonusMana: number;
  openingSlotBonus: Record<SlotType, number>;
  lowCostRushMaxCost: number | null;
  highCostMinionDiscount: { threshold: number; amount: number } | null;
  loneMinionGuard: boolean;
  spellDamageBonus: number;
  lowHpTurnStartHeal: { threshold: number; amount: number } | null;
  preserveBurstSlotAmount: number;
  nextTurnManaPenalty: number;
  nextTurnManaMultiplier: number;
  ignoreGuardThisTurn: boolean;
  millOnDamageTaken: number;
  damageTakenThisTurn: number;
  extraTurnPending: boolean;
  loseAtEndOfExtraTurn: boolean;
}

export interface PlayerState {
  id: PlayerId;
  character: string;
  hp: number;
  maxHp: number;
  handLimit: number;
  mana: number;
  maxMana: number;
  deck: RuntimeCard[];
  hand: RuntimeCard[];
  board: MinionInstance[];
  persistents: PersistentInstance[];
  traps: PersistentInstance[];
  reserveDeck: RuntimeCard[];
  graveyard: GraveyardEntry[];
  jumpSlot: number;
  godDrawSlot: number;
  selectedTalents: string[];
  temporaryFlags: TemporaryFlags;
}

export interface LogEntry {
  id: string;
  turn: number;
  tone: "neutral" | "alert";
  message: string;
}

export interface AdvantageBreakdown {
  handScore: number;
  hpScore: number;
  threatScore: number;
  specialScore: number;
  details: string[];
  total: number;
}

export interface LastAdvantage {
  value: number;
  gain: number;
  p1Breakdown: AdvantageBreakdown;
  summary: string[];
}

export type PendingChoice =
  | {
      type: "ultimateGodDraw";
      playerId: PlayerId;
      title: string;
      choices: DeckChoice[];
      description?: string;
    }
  | {
      type: "optionalJump";
      playerId: PlayerId;
      title: string;
      description: string;
    }
  | {
      type: "optionalGodDraw";
      playerId: PlayerId;
      title: string;
      description: string;
      choices: DeckChoice[];
    };

export interface TurnStartQueueItem {
  type: "ultimateJump" | "ultimateGodDraw" | "optionalJump" | "optionalGodDraw";
  playerId: PlayerId;
}

export interface SetupMatchConfig {
  playerCharacterId: string;
  aiCharacterId: string;
  playerTalentIds: string[];
}

export interface MatchConfig extends SetupMatchConfig {}

export interface GameState {
  screen: GameScreen;
  phase: GamePhase;
  turn: number;
  currentPlayer: PlayerId;
  players: Record<PlayerId, PlayerState>;
  actionLog: LogEntry[];
  effectStack: unknown[];
  pendingChoice: PendingChoice | null;
  turnStartQueue: TurnStartQueueItem[];
  selectedAttackerId: string | null;
  lastAdvantage: LastAdvantage | null;
  winner: PlayerId | null;
  config: MatchConfig | null;
}

export interface EffectContext {
  source?: MinionInstance | PersistentInstance;
  sourceCard?: RuntimeCard;
  triggeredMinion?: MinionInstance;
}

export interface PendingChoicePayload {
  action: "use" | "skip";
  cardId?: string | null;
}

export interface SlotAdjustOptions {
  skipTalentModifier?: boolean;
  skipCharacterPassive?: boolean;
}

export interface AttackTarget {
  type: "hero" | "minion";
  id: string;
  label: string;
}

export type AiDecision =
  | { type: "playCard"; index: number; card: RuntimeCard; score: number }
  | { type: "attack"; attackerId: string; targetId: string; targetType: "hero" | "minion"; score: number }
  | { type: "endTurn" };

export interface GameAiAdapter {
  state: GameState;
  getPlayer(playerId: PlayerId): PlayerState;
  getOpponent(playerId: PlayerId): PlayerState;
  getReadyAttackers(playerId: PlayerId): MinionInstance[];
  getAIAttackTargets(attackerId: string, playerId: PlayerId): AttackTarget[];
}
