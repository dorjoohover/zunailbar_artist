"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ILoginUser } from "@/models";
import { login } from "@/app/(api)/auth";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/shared/components/password.field";
import { useState } from "react";
import { showToast } from "@/shared/components/showToast";

const formSchema = z.object({
  mobile: z.string().min(2, {
    message: "Утасны дугаар 8 оронтой байна.",
  }),
  password: z.string().min(2, {
    message: "Нууц үг хамгийн багадаа 2 оронтой байна.",
  }),
});

export function LoginForm() {
  // {
  // save,
  // }: {
  // save: (token: string, branch: string, merchant: string) => void;
  // }
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });
  const router = useRouter();
  const save = async (token: string, branch: string, merchant: string) => {
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        branch,
        merchant,
      }),
    });
    window.location.replace(window.location.href);
    router.refresh();
  };
  const onSubmit = async (value: ILoginUser) => {
    setLoading(true);
    const { data, error } = await login(value);
    if (error) {
      showToast("info", error);
    } else {
      save(data.accessToken, data.branch_id, data.merchant_id);
    }
    setLoading(false);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full">
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Утасны дугаар</FormLabel>
              <FormControl>
                <Input
                  placeholder="xxxx-xxxx"
                  {...field}
                  className="h-12 transparent-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordField
                  props={{ ...field }}
                  className="bg-white h-12"
                  label="Нууц үг"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-12 mt-4" loading={loading}>
          Нэвтрэх
        </Button>
      </form>
    </Form>
  );
}
