"use client";

import {Button} from "@/components/ui/button";
import {authClient, useSession} from "@/lib/auth-client";

export default function Home() {
  const {data: session} = useSession();
  if (!session) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      Welcome {session.user.email}{" "}
      {session.user && (
        <Button onClick={() => authClient.signOut()}>Sign out</Button>
      )}
    </div>
  );
}
