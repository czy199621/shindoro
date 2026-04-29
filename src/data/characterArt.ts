import type { CharacterArt, CharacterDefinition } from "../types.js";

export interface ResolvedCharacterArt {
  card: string;
  avatar: string;
  banner: string;
  alt: string;
}

function getCharacterArtBasePath(characterId: string): string {
  return `/characters/${characterId}`;
}

export function createCharacterArt(characterId: string, alt: string, overrides: CharacterArt = {}): CharacterArt {
  const basePath = getCharacterArtBasePath(characterId);

  return {
    card: `${basePath}/card.jpg`,
    avatar: `${basePath}/avatar.jpg`,
    banner: `${basePath}/banner.jpg`,
    alt,
    ...overrides
  };
}

export function getCharacterArt(character: CharacterDefinition): ResolvedCharacterArt {
  const basePath = getCharacterArtBasePath(character.id);
  const card = character.art?.card ?? `${basePath}/card.jpg`;
  const avatar = character.art?.avatar ?? `${basePath}/avatar.jpg`;

  return {
    card,
    avatar,
    banner: character.art?.banner ?? character.art?.card ?? `${basePath}/banner.jpg`,
    alt: character.art?.alt ?? `${character.name} 角色图`
  };
}

export function toCssUrl(assetPath: string): string {
  const escaped = assetPath.replaceAll("\\", "/").replaceAll('"', '\\"').replaceAll("\n", "").replaceAll("\r", "");
  return `url("${escaped}")`;
}
