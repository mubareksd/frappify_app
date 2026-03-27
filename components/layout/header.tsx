"use client";

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
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
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
        </>
    );
}