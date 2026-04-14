"use client";

import {Button} from "@/components/ui/button";
import {authClient} from "@/lib/auth-client";

function SignoutButton() {
  return (
    <div>
      <Button onClick={() => authClient.signOut()}>Sign out</Button>
    </div>
  );
}

export default SignoutButton;