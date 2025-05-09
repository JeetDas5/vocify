"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import FormField from "./FormField";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.actions";
import { Loader } from "./Loader";
import { useState } from "react";

const authFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === "sign-up"
        ? z.string().nonempty("Name is required").min(3, "Name is too short")
        : z.string().optional(),
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .nonempty("Password is required")
      .min(6, "Password must be at least 6 characters long"),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      if (type === "sign-up") {
        const { name, email, password } = values;

        const userCredentials = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredentials.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Account created successfully! Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = values;
        const userCredentials = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredentials.user.getIdToken();
        if (!idToken) {
          toast.error("Failed to get ID token. Please try again.");
          return;
        }

        const result = await signIn({
          email,
          idToken,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }
        toast.success("Signed in successfully! Redirecting to Home page...");
        router.push("/");
      }
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        toast.error(
          "Invalid credentials. Please check your email and password."
        );
      } else {
        toast.error(`Something went wrong! ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isSignIn = type === "sign-in";

  {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader message="loading..." />
        </div>
      );
    }
  }

  return (
    <div className="card-border lg:min-w-[550px]">
      <div className="flex flex-col gap-6 card py-8 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Interview Prep</h2>
        </div>
        <h3>Practice Job Interview with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                placeholder="John Doe"
                label="Name"
              />
            )}
            <FormField
              control={form.control}
              name="email"
              placeholder="Your email address"
              label="Email"
              type="email"
            />
            <FormField
              control={form.control}
              name="password"
              placeholder="Your password"
              type="password"
              label="Password"
            />
            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>
        <p className="text-center">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
