"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountStore } from "@/hooks/use-account-store";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

async function fetchPublicIpAddress() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return "";

    const data = (await response.json()) as { ip?: string };
    return data.ip?.trim() || "";
  } catch {
    return "";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [siteId, setSiteId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveAccount } = useAccountStore();

  useEffect(() => {
    let isMounted = true;

    async function detectIpAddress() {
      const currentIp = await fetchPublicIpAddress();
      if (isMounted && currentIp) {
        setIpAddress(currentIp);
      }
    }

    void detectIpAddress();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Refresh public IP at submit time so late VPN changes are captured.
      const currentIpAddress = await fetchPublicIpAddress();

      if (currentIpAddress) {
        setIpAddress(currentIpAddress);
      }

      const result = await signIn("credentials", {
        siteId,
        ipAddress: (currentIpAddress || ipAddress).trim(),
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError(result?.error || "Invalid username or password");
        return;
      }

      // Persist the new account in the multi-account store.
      const session = await getSession();
      if (session?.accessToken && session.user) {
        saveAccount({
          id: `${session.user.siteId}:${session.user.username}`,
          username: session.user.username ?? username,
          siteId: session.user.siteId ?? siteId,
          accessToken: session.accessToken,
          accessTokenExpires: session.accessTokenExpires ?? 0,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        });
      }

      router.push(result.url || callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your site ID, username, and password to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="site_id">Site ID</Label>
              <Input
                id="site_id"
                type="text"
                value={siteId}
                onChange={(event) => setSiteId(event.target.value)}
                placeholder="C00001"
                autoComplete="site_id"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="mubareksd"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
