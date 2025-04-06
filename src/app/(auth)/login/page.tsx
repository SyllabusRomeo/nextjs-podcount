import { Metadata } from "next"
import Link from "next/link"
import { UserAuthForm } from "@/components/auth/user-auth-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url("/cocoaimage.jpg")' }}
    >
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">PodCount</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your cocoa farm
          </p>
        </div>
        
        <UserAuthForm />
        
        <p className="mt-6 text-center text-sm text-gray-600">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="font-medium text-koa-orange hover:text-orange-600"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-medium text-koa-orange hover:text-orange-600"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
} 