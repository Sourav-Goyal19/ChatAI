import type { VersionGroupType, MessageType } from "@/types";

export const getCurrentMessages = (
  versionGroups: VersionGroupType[],
  currentVersionIndices: Record<string, number>
): MessageType[] => {
  const messages: MessageType[] = [];

  versionGroups.forEach((group) => {
    const currentIndex = currentVersionIndices[group.id] || 0;
    const currentMessages = group.messages.slice(
      currentIndex,
      currentIndex + 2
    );
    messages.push(...currentMessages);
  });

  return messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export const hasMultipleVersions = (
  versionGroups: VersionGroupType[],
  groupId: string
): boolean => {
  const group = versionGroups.find((g) => g.id === groupId);
  return !!group && group.messages.length > 2;
};

export const getVersionInfo = (
  versionGroups: VersionGroupType[],
  currentVersionIndices: Record<string, number>,
  groupId: string
): { current: number; total: number } => {
  const group = versionGroups.find((g) => g.id === groupId);
  if (!group) return { current: 0, total: 0 };

  const totalPairs = Math.floor(group.versions.length / 2);
  const currentIndex = currentVersionIndices[groupId] || 0;
  const normalizedIndex = Math.floor(currentIndex / 2) * 2;
  const currentPair = Math.floor(normalizedIndex / 2) + 1;

  return { current: currentPair, total: totalPairs };
};
