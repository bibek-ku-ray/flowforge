"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Loader2Icon, StarIcon } from "lucide-react";
import { useHasActiveSubscription } from "../hooks/use-subscription";

export const SubscriptionsView = () => {
  const { hasActiveSubscription, subscription, isLoading } =
    useHasActiveSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        <span className="ml-2 text-sm">Loading subscription...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full flex flex-col gap-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your FlowForge subscription and billing details.
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasActiveSubscription ? (
              <>Pro Plan</>
            ) : (
              <>
                <StarIcon className="size-4 text-amber-500" />
                Free Plan
              </>
            )}
          </CardTitle>
          <CardDescription>
            {hasActiveSubscription
              ? "You have an active Pro subscription."
              : "Upgrade to Pro to unlock premium workflow features."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveSubscription && subscription ? (
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Status: </span>
                {subscription.status}
              </p>
              {subscription.productId ? (
                <p>
                  <span className="text-muted-foreground">Product ID: </span>
                  {subscription.productId}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Subscribe to Pro to run premium nodes and workflows without
              limits.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!hasActiveSubscription ? (
              <Button
                onClick={() => {
                  authClient.checkout({ slug: "pro" });
                }}
              >
                Upgrade to Pro
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                authClient.customer.portal();
              }}
            >
              Manage billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
