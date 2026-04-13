"use client";

import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const signupSchema = z
  .object({
    email: z.email("Please enter valid email"),
    password: z.string().min(3, "Password is required"),
    confirmPassword: z.string().min(3, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupFormValue = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const router = useRouter();

  const form = useForm<SignupFormValue>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupFormValue) => {
    await authClient.signUp.email(
      {
        name: values.email,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    type="button"
                    disabled={isPending}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    type="button"
                    disabled={isPending}
                  >
                    Continue with GitHub
                  </Button>
                </div>
                <div className="grid gap-6">
                  <Field data-invalid={!!form.formState.errors.email}>
                    <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                    <FieldContent>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="bibek@flowforge.com"
                        autoComplete="email"
                        aria-invalid={!!form.formState.errors.email}
                        {...form.register("email")}
                      />
                    </FieldContent>
                    <FieldError errors={[form.formState.errors.email]} />
                  </Field>
                  <Field data-invalid={!!form.formState.errors.password}>
                    <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                    <FieldContent>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={!!form.formState.errors.password}
                        {...form.register("password")}
                      />
                    </FieldContent>
                    <FieldError errors={[form.formState.errors.password]} />
                  </Field>
                  <Field data-invalid={!!form.formState.errors.confirmPassword}>
                    <FieldLabel htmlFor="signup-confirm-password">
                      Confirm password
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={!!form.formState.errors.confirmPassword}
                        {...form.register("confirmPassword")}
                      />
                    </FieldContent>
                    <FieldError
                      errors={[form.formState.errors.confirmPassword]}
                    />
                  </Field>
                  <Button className="w-full" type="submit" disabled={isPending}>
                    Create account
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupForm;
