"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { Suspense } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

const resetRequestSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

function UserAuthFormContent({ className, ...props }: UserAuthFormProps) {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isRequestingReset, setIsRequestingReset] = React.useState<boolean>(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const resetRequestForm = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: values.email.toLowerCase(),
        password: values.password,
        redirect: true,
        callbackUrl: searchParams?.get("callbackUrl") || "/dashboard",
      })

      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid email or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onResetRequest(values: z.infer<typeof resetRequestSchema>) {
    setIsRequestingReset(true)

    try {
      const response = await fetch('/api/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email.toLowerCase() }),
      });

      if (response.ok) {
        toast({
          title: "Request Sent",
          description: "Password reset request has been sent to the administrator. You will be contacted soon.",
        });
        setIsResetDialogOpen(false);
        resetRequestForm.reset();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to send password reset request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingReset(false);
    }
  }

  return (
    <div className={className} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...field}
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="text-sm text-orange-600 hover:text-orange-800">
              Forgot password?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password Request</DialogTitle>
              <DialogDescription>
                Enter your email address below. An administrator will reset your password and provide you with a temporary one.
              </DialogDescription>
            </DialogHeader>
            <Form {...resetRequestForm}>
              <form onSubmit={resetRequestForm.handleSubmit(onResetRequest)} className="space-y-4">
                <FormField
                  control={resetRequestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsResetDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isRequestingReset}>
                    {isRequestingReset && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Request
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export function UserAuthForm(props: UserAuthFormProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    }>
      <UserAuthFormContent {...props} />
    </Suspense>
  )
} 