import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      Landing page
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
