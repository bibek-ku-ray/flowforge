"use client";

import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
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
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import Image from "next/image";

const loginSchema = z.object({
  email: z.email("Please enter valid email"),
  password: z.string().min(3, "Password is required"),
});

type LoginFormValue = z.infer<typeof loginSchema>;

const LoginForm = () => {

  const router = useRouter();

  const form = useForm<LoginFormValue>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValue) => {
    await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/"
      }, {
        onSuccess: () => {
          router.push("/")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        }
      }
    )
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Card className="w-full sm:max-w-md">
        <CardHeader className={`flex gap-3 justify-between items-center`}>
          <div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Login to continue</CardDescription>
          </div>
          <div>
            <Image src={`/logos/logo.png`} alt={`flowforge logo`} width={50} height={50}/>
          </div>
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
                    <Image src="/logos/google.svg" alt="Google" width={20} height={20} className="mr-2"/>
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    type="button"
                    disabled={isPending}
                  >
                    <Image src="/logos/github.svg" alt="GitHub" width={20} height={20} className="mr-2 "/>
                    Continue with GitHub
                  </Button>
                </div>
                <div className="grid gap-6">
                  <Field data-invalid={!!form.formState.errors.email}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <FieldContent>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="bibek@flowforge.com"
                        aria-invalid={!!form.formState.errors.email}
                        {...form.register("email")}
                      />
                    </FieldContent>
                    <FieldError errors={[form.formState.errors.email]}/>
                  </Field>
                  <Field data-invalid={!!form.formState.errors.password}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <FieldContent>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="*********"
                        autoComplete="current-password"
                        aria-invalid={!!form.formState.errors.password}
                        {...form.register("password")}
                      />
                    </FieldContent>
                    <FieldError errors={[form.formState.errors.password]}/>
                  </Field>
                  <Button className="w-full cursor-pointer" type="submit" disabled={isPending}>
                    Sign in
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don&#39;t have an account? <Link href="/signup" className="text-primary underline">Register</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
