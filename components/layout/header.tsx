"use client";

import AccountSwitcher from "@/components/layout/account-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAccountStore } from "@/hooks/use-account-store";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { env } from "@/lib/env";

interface HeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        username?: string;
        siteId?: string;
        image?: string | null;
    };
    isFullWidth: boolean;
    onToggleFullWidth: () => void;
}

export default function Header({
    user,
    isFullWidth,
    onToggleFullWidth,
}: HeaderProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [isSessionDefaultsOpen, setIsSessionDefaultsOpen] = useState(false);
    const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
    const { accounts, saveAccount } = useAccountStore();

    const currentAccountId = user?.siteId && user?.username
        ? `${user.siteId}:${user.username}`
        : undefined;

    // Ensure the active account is always persisted in the store.
    useEffect(() => {
        if (!currentAccountId || !user) return;
        const existing = accounts.find((a) => a.id === currentAccountId);
        if (!existing) {
            // Fetch the session to grab the access token
            import("next-auth/react").then(({ getSession }) =>
                getSession().then((session) => {
                    if (session?.accessToken) {
                        saveAccount({
                            id: currentAccountId,
                            username: user.username ?? "",
                            siteId: user.siteId ?? "",
                            accessToken: session.accessToken,
                            accessTokenExpires: session.accessTokenExpires ?? 0,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                        });
                    }
                }),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAccountId]);

    const displayName =
        user?.name?.trim() || user?.username?.trim() || user?.email?.trim() || "User";

    const initials = useMemo(() => {
        const words = displayName.split(" ").filter(Boolean);
        if (words.length === 0) return "U";
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }, [displayName]);

    const handleToggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    const handleReload = () => {
        window.location.reload();
    };

    const handleLogout = async () => {
        // Remove the current account from the store.
        if (currentAccountId) {
            const { removeAccount, getSnapshot } = await import("@/hooks/use-account-store").then(
                (m) => ({ removeAccount: () => {}, getSnapshot: () => m.useAccountStore }),
            ).catch(() => ({ removeAccount: () => {}, getSnapshot: () => null }));

            // Use the store directly to remove + check remaining accounts.
            const remaining = accounts.filter((a) => a.id !== currentAccountId);
            // Persist the removal.
            removeAccountFromStore(currentAccountId);

            if (remaining.length > 0) {
                const next = remaining[0];
                // Sign out the current session, then sign into the next account.
                await signOut({ redirect: false });
                const result = await signIn("credentials", {
                    siteId: next.siteId,
                    username: next.username,
                    accessToken: next.accessToken,
                    accessTokenExpires: String(next.accessTokenExpires),
                    redirect: false,
                });

                if (result && !result.error) {
                    window.location.href = result.url || "/";
                    return;
                }
                // Token was stale — fall through to normal logout.
                removeAccountFromStore(next.id);
            }
        }

        await signOut({ callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/login` });
    };

    return (
        <>
            <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="flex h-14 items-center justify-between gap-3 px-3 md:px-5">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">Frappify</p>
                            {user?.siteId ? (
                                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                                    Site: {user.siteId}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 gap-2 px-1.5 md:px-2">
                                <Avatar className="size-7">
                                    <AvatarImage src={user?.image ?? undefined} alt={displayName} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <span className="hidden max-w-40 truncate text-xs md:block">{displayName}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 min-w-64">
                            <DropdownMenuLabel className="space-y-0.5">
                                <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
                                {user?.email ? (
                                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                ) : null}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link href="/app/user-profile">My Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/app/user-profile">My Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsSessionDefaultsOpen(true)}>
                                Session Defaults
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsAccountSwitcherOpen(true)}>
                                Switch Account
                                {accounts.length > 1 && (
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {accounts.length}
                                    </span>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleReload}>Reload</DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/">Apps</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onToggleFullWidth}>
                                {isFullWidth ? "Disable Full Width" : "Enable Full Width"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleToggleTheme}>Toggle Theme</DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <Dialog open={isSessionDefaultsOpen} onOpenChange={setIsSessionDefaultsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Session Defaults</DialogTitle>
                        <DialogDescription>
                            This section is not implemented yet. It will be available in a future update.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton />
                </DialogContent>
            </Dialog>

            <AccountSwitcher
                open={isAccountSwitcherOpen}
                onOpenChange={setIsAccountSwitcherOpen}
                currentAccountId={currentAccountId}
            />
        </>
    );
}