import { cn } from "@/lib/utils";

/**
 * Zermatoon brand mark.
 *
 * Renders the bitmap at `public/logo.png`. The image has transparent
 * areas ("wings" around the mark). A CSS `background-color` on an <img>
 * shows through those transparent pixels, so we paint them with the
 * active theme's primary colour via the `bg-primary` token — it tracks
 * whatever theme is selected (ThemeProvider / active-theme).
 *
 *   • Want a different theme colour behind the logo?  Swap `bg-primary`
 *     for `bg-secondary` / `bg-accent` / `bg-sidebar-primary` / etc.
 *   • Want the transparency to stay see-through?  Remove the
 *     `bg-primary rounded-md` classes below.
 *
 * Sized via the `className` you pass — e.g. `<Logo className="size-8" />`
 * (login screen), `<Logo className="!size-6" />` (sidebar header).
 *
 * The browser favicon is separate and stays as the SVG at `app/icon.svg`.
 */
export function Logo({
  className,
  title = "Zermatoon",
}: {
  className?: string;
  title?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset sized purely via CSS */
    <img
      src="/logo.png"
      alt={title}
      className={cn("rounded-md bg-primary object-contain", className)}
    />
  );
}
