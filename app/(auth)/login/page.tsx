"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  type StoredAccount,
  useAccountStore,
} from "@/hooks/use-account-store";
import { getAuthErrorMessage } from "@/lib/auth-error";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

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

function getInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

// ── Session Picker ──────────────────────────────────────────────────
function SessionPicker({
  accounts,
  onSelect,
  onNewAccount,
  switching,
  error,
  onRemove,
}: {
  accounts: StoredAccount[];
  onSelect: (account: StoredAccount) => void;
  onNewAccount: () => void;
  switching: string | null;
  error: string | null;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose an account</CardTitle>
          <CardDescription>
            Select a saved session to continue, or sign in with a different account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account) => {
            const displayName =
              account.name?.trim() ||
              account.username.trim() ||
              account.email?.trim() ||
              "User";

            return (
              <button
                key={account.id}
                type="button"
                disabled={switching !== null}
                onClick={() => onSelect(account)}
                className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
              >
                <Avatar className="size-9">
                  <AvatarImage
                    src={account.image ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {account.username} · {account.siteId}
                  </p>
                </div>
                {switching === account.id ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Switching…
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    disabled={switching !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(account.id);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </button>
            );
          })}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            variant="outline"
            className="w-full"
            disabled={switching !== null}
            onClick={onNewAccount}
          >
            Sign in with a different account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Login Page ─────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Prefill from query params (e.g. redirected after token expiry).
  const prefillSiteId = searchParams.get("siteId") || "";
  const prefillUsername = searchParams.get("username") || "";
  const isExpired = searchParams.get("expired") === "1";
  const signInErrorCode = searchParams.get("error");

  const [siteId, setSiteId] = useState(prefillSiteId);
  const [ipAddress, setIpAddress] = useState("");
  const [username, setUsername] = useState(prefillUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    isExpired
      ? getAuthErrorMessage("SessionExpired")
      : signInErrorCode
        ? getAuthErrorMessage(signInErrorCode)
        : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accounts, saveAccount, removeAccount } = useAccountStore();

  // Show the login form immediately when redirected with prefilled credentials.
  const [showLoginForm, setShowLoginForm] = useState(!!prefillSiteId && !!prefillUsername);

  // Switching state for the session picker.
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus password when redirected with prefilled credentials.
  useEffect(() => {
    if (prefillSiteId && prefillUsername && showLoginForm) {
      passwordRef.current?.focus();
    }
  }, [prefillSiteId, prefillUsername, showLoginForm]);

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

  async function handleSelectAccount(account: StoredAccount) {
    setSwitchError(null);
    setSwitching(account.id);

    try {
      const result = await signIn("credentials", {
        siteId: account.siteId,
        username: account.username,
        accessToken: account.accessToken,
        accessTokenExpires: String(account.accessTokenExpires),
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        const isExpiredSession = result?.error === "CredentialsSignin";

        if (isExpiredSession) {
          removeAccount(account.id);
          // Redirect to login with prefilled siteId/username
          const params = new URLSearchParams();
          params.set("siteId", account.siteId);
          params.set("username", account.username);
          params.set("expired", "1");
          router.push(`/login?${params.toString()}`);
        } else {
          setSwitchError(getAuthErrorMessage(result?.error));
        }

        setSwitching(null);
        return;
      }

      window.location.href = result.url || callbackUrl;
    } catch {
      setSwitchError(getAuthErrorMessage("AuthServiceUnavailable"));
      setSwitching(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedSiteId = siteId.trim().toUpperCase();
    const normalizedUsername = username.trim();
    const normalizedPassword = password;

    setSiteId(normalizedSiteId);
    setUsername(normalizedUsername);

    try {
      // Refresh public IP at submit time so late VPN changes are captured.
      const currentIpAddress = await fetchPublicIpAddress();

      if (currentIpAddress) {
        setIpAddress(currentIpAddress);
      }

      const result = await signIn("credentials", {
        siteId: normalizedSiteId,
        ipAddress: (currentIpAddress || ipAddress).trim(),
        username: normalizedUsername,
        password: normalizedPassword,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError(getAuthErrorMessage(result?.error));
        return;
      }

      // Persist the new account in the multi-account store.
      const session = await getSession();
      if (session?.accessToken && session.user) {
        saveAccount({
          id: `${session.user.siteId}:${session.user.username}`,
          username: session.user.username ?? normalizedUsername,
          siteId: session.user.siteId ?? normalizedSiteId,
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
      setError(getAuthErrorMessage("AuthServiceUnavailable"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // If there are saved accounts and user hasn't asked for the login form, show the picker.
  if (accounts.length > 0 && !showLoginForm) {
    return (
      <SessionPicker
        accounts={accounts}
        onSelect={handleSelectAccount}
        onNewAccount={() => setShowLoginForm(true)}
        switching={switching}
        error={switchError}
        onRemove={(id) => {
          removeAccount(id);
          setSwitchError(null);
        }}
      />
    );
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
                ref={passwordRef}
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

            {accounts.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowLoginForm(false)}
              >
                Back to saved accounts
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
