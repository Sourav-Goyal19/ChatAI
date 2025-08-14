"use server";

import { VersionGroupType } from "@/types";
import client from "./prismadb";

export async function getVersionGroups(
  conversationId: string
): Promise<VersionGroupType[]> {
  const versionGroups = await client.versionGroup.findMany({
    where: {
      conversationId: conversationId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          files: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return versionGroups;
}
