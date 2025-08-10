import client from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  console.log("Caught Request");
  try {
    const user = await currentUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const savedUser = await client.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || "",
        avatarUrl: user.imageUrl,
      },
      create: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || "",
        avatarUrl: user.imageUrl,
      },
    });

    return new Response(
      JSON.stringify({ message: "User saved successfully", savedUser }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server Error" }), {
      status: 500,
    });
  }
}
