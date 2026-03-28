import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon } from "lucide-react";

export default function Home() {
  const name = false;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <section>
        <h1
          className={cn(
            "text-3xl font-bold mb-4 font-mono",
            name ? "text-purple-700" : "text-purple-700",
          )}
        >
          Welcome Ray!
        </h1>
        <Alert className="bg-purple-600/10 border-purple-600/50 text-purple-600">
          <CheckCircle2Icon />
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription className="text-sm text-purple-800/90">
            Your payment of $29.99 has been processed. A receipt has been sent
            to your email address.
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
