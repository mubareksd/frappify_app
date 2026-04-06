"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type StoredAccount,
  useAccountStore,
} from "@/hooks/use-account-store";
import { getAuthErrorMessage } from "@/lib/auth-error";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

interface AccountSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAccountId?: string; // `${siteId}:${username}`
}

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

export default function AccountSwitcher({
  open,
  onOpenChange,
  currentAccountId,
}: AccountSwitcherProps) {
  const { accounts, saveAccount, removeAccount } = useAccountStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add-account form state
  const [siteId, setSiteId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

  async function handleSwitch(account: StoredAccount) {
    setError(null);
    setSwitching(account.id);

    const normalizedSiteId = account.siteId.trim().toUpperCase();
    const normalizedUsername = account.username.trim();

    try {
      const result = await signIn("credentials", {
        siteId: normalizedSiteId,
        username: normalizedUsername,
        accessToken: account.accessToken,
        accessTokenExpires: String(account.accessTokenExpires),
        redirect: false,
      });

      if (!result || result.error) {
        if (result?.error === "CredentialsSignin") {
          // Token expired — remove the stale account
          removeAccount(account.id);
          setError(
            `Session for ${account.username}@${account.siteId} has expired. Please add the account again.`,
          );
        } else {
          setError(getAuthErrorMessage(result?.error));
        }

        setSwitching(null);
        return;
      }

      // Success – hard reload to pick up the new session everywhere
      window.location.href = result.url || "/";
    } catch {
      setError(getAuthErrorMessage("AuthServiceUnavailable"));
      setSwitching(null);
    }
  }

  async function handleAddAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedSiteId = siteId.trim().toUpperCase();
    const normalizedUsername = username.trim();
    const normalizedPassword = password;

    setSiteId(normalizedSiteId);
    setUsername(normalizedUsername);

    try {
      const ipAddress = await fetchPublicIpAddress();

      const result = await signIn("credentials", {
        siteId: normalizedSiteId,
        ipAddress,
        username: normalizedUsername,
        password: normalizedPassword,
        redirect: false,
      });

      if (!result || result.error) {
        setError(getAuthErrorMessage(result?.error));
        setIsSubmitting(false);
        return;
      }

      // After successful sign-in NextAuth has updated the session.
      // We need to fetch the new session to save it to the account store.
      // The session callback exposes accessToken etc.
      const { getSession } = await import("next-auth/react");
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

      // Hard reload to pick up the new session
      window.location.href = result.url || "/";
    } catch {
      setError(getAuthErrorMessage("AuthServiceUnavailable"));
      setIsSubmitting(false);
    }
  }

  function handleRemove(id: string) {
    removeAccount(id);
  }

  function resetForm() {
    setShowAddForm(false);
    setSiteId("");
    setUsername("");
    setPassword("");
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Account</DialogTitle>
          <DialogDescription>
            Switch to a saved account or add a new one.
          </DialogDescription>
        </DialogHeader>

        {/* ── Saved accounts list ──────────────────────────────── */}
        {otherAccounts.length > 0 && (
          <div className="space-y-2">
            {otherAccounts.map((account) => {
              const displayName =
                account.name?.trim() ||
                account.username.trim() ||
                account.email?.trim() ||
                "User";

              return (
                <div
                  key={account.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <Avatar className="size-8">
                    <AvatarImage
                      src={account.image ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {account.username} · {account.siteId}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={switching !== null}
                      onClick={() => handleSwitch(account)}
                    >
                      {switching === account.id ? "Switching…" : "Switch"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={switching !== null}
                      onClick={() => handleRemove(account.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {otherAccounts.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground">
            No other accounts saved. Add one below.
          </p>
        )}

        {/* ── Add account ─────────────────────────────────────── */}
        {!showAddForm ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            Add Account
          </Button>
        ) : (
          <form className="space-y-3 border-t pt-3" onSubmit={handleAddAccount}>
            <p className="text-sm font-medium">Add a new account</p>
            <div className="space-y-1.5">
              <Label htmlFor="switch-site-id">Site ID</Label>
              <Input
                id="switch-site-id"
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="C00001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="switch-username">Username</Label>
              <Input
                id="switch-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="switch-password">Password</Label>
              <Input
                id="switch-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in & Switch"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {error && !showAddForm ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
