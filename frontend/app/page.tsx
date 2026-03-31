import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon } from "lucide-react";

export default async function Home() {
  const name = false;

  const users = await prisma.user.findMany();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <section>
        <h1
          className={cn(
            "text-3xl font-bold mb-4 font-mono",
            name ? "text-grey-700" : "text-grey-700",
          )}
        >
          Welcome Ray!
        </h1>
        <Alert className="bg-grey-600/10 border-grey-600/50 text-grey-600">
          <CheckCircle2Icon />
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription className="text-sm text-grey-800/90">
            Your payment of $29.99 has been processed. A receipt has been sent
            to your email address.
          </AlertDescription>
        </Alert>
        <ul>
          {JSON.stringify(users)}
        </ul>
      </section>
    </div>
  );
}
