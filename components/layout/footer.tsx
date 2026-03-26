interface FooterProps {
    isFullWidth?: boolean;
}

export default function Footer({ isFullWidth = false }: FooterProps) {
    return (
        <footer className="border-t">
            <div
                className={
                    isFullWidth
                        ? "px-4 py-3 text-xs text-muted-foreground md:px-6"
                        : "mx-auto w-full max-w-7xl px-4 py-3 text-xs text-muted-foreground md:px-6"
                }
            >
                Frappify Workspace
            </div>
        </footer>
    );
}