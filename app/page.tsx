"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useUser } from "@/contexts/UserContext";
import {
  IconBoxSeam,
  IconReceipt,
  IconUsersGroup,
  IconChartBar,
  IconShieldLock,
  IconBellRinging,
  IconClipboardList,
  IconCash,
  IconCheck,
  IconArrowRight,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBuildingBank,
} from "@tabler/icons-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001/api";

type PublicPlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  modules: { moduleCode: string }[];
  features: { featureCode: string }[];
  limit: {
    maxUsers: number | null;
    maxWarehouses: number | null;
    maxItems: number | null;
    maxEmployees: number | null;
    storageGb: number | null;
  } | null;
};

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    axios
      .get<PublicPlan[]>(`${API_BASE}/plans/public`)
      .then((res) => setPlans(res.data ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const ctaPrimary = user ? "Go to dashboard" : "Get started";
  // Unauthenticated CTAs send people to self-signup; the form there
  // links to /login for returning users.
  const ctaHref = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header user={user} />

      <Hero ctaPrimary={ctaPrimary} ctaHref={ctaHref} router={router} />

      <About />

      <Features />

      <Pricing
        plans={plans}
        loading={loadingPlans}
        ctaHref={ctaHref}
        ctaLabel={ctaPrimary}
        router={router}
      />

      <Contact />

      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Header (sticky nav)
// ──────────────────────────────────────────────────────────────────
function Header({
  user,
}: {
  user: ReturnType<typeof useUser>["user"];
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#hero" className="flex items-center gap-2 font-semibold">
          <Logo className="size-7" />
          <span>Zermatoon</span>
        </a>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <a href="#about" className="hover:text-foreground transition">
            About
          </a>
          <a href="#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition">
            Pricing
          </a>
          <a href="#contact" className="hover:text-foreground transition">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {user ? (
            <Button asChild size="sm">
              <a href="/dashboard">Dashboard</a>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <a href="/login">Login</a>
              </Button>
              <Button asChild size="sm">
                <a href="/signup">Get started</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────
// Typewriter cycle — types each word out, pauses, deletes, repeats
//
// Implementation notes:
//  - Pure React + setTimeout (no framer-motion / typed.js dependency).
//  - Min-width reserves vertical-rhythm so the line doesn't reflow when
//    the typed string is short ("sales") vs. long ("your whole back office").
//  - Cursor blink uses Tailwind's `animate-pulse` so it inherits the
//    same easing as the rest of the app.
//  - Honors `prefers-reduced-motion`: if the user opted out, it just
//    cycles the full words instantly instead of animating per-char.
// ──────────────────────────────────────────────────────────────────
function TypewriterCycle({
  words,
  className,
  typeSpeedMs = 80,
  deleteSpeedMs = 40,
  pauseMs = 1400,
}: {
  words: string[];
  className?: string;
  typeSpeedMs?: number;
  deleteSpeedMs?: number;
  pauseMs?: number;
}) {
  const [wordIdx, setWordIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(
    "typing",
  );

  // Respect the OS-level reduced-motion preference.
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!words.length) return;

    if (reducedMotion) {
      // Static rotation — swap whole words on `pauseMs` interval.
      setShown(words[wordIdx]);
      const t = window.setTimeout(() => {
        setWordIdx((i) => (i + 1) % words.length);
      }, pauseMs);
      return () => window.clearTimeout(t);
    }

    const current = words[wordIdx];
    let delay = typeSpeedMs;

    if (phase === "typing") {
      if (shown.length < current.length) {
        delay = typeSpeedMs;
      } else {
        // Finished typing → pause before deleting.
        const t = window.setTimeout(() => setPhase("deleting"), pauseMs);
        return () => window.clearTimeout(t);
      }
    } else if (phase === "deleting") {
      if (shown.length > 0) {
        delay = deleteSpeedMs;
      } else {
        // Finished deleting → next word.
        setPhase("typing");
        setWordIdx((i) => (i + 1) % words.length);
        return;
      }
    }

    const t = window.setTimeout(() => {
      setShown((s) =>
        phase === "typing"
          ? current.slice(0, s.length + 1)
          : s.slice(0, -1),
      );
    }, delay);
    return () => window.clearTimeout(t);
  }, [
    shown,
    phase,
    wordIdx,
    words,
    typeSpeedMs,
    deleteSpeedMs,
    pauseMs,
    reducedMotion,
  ]);

  // Reserve horizontal space for the longest word so the rest of the
  // line ("from one place.") doesn't shift as characters come and go.
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={className} aria-live="polite">
      <span className="relative inline-block">
        {/* Invisible spacer — claims the row width without painting. */}
        <span aria-hidden className="invisible">
          {longest}
        </span>
        {/* Visible typed text positioned on top of the spacer. */}
        <span className="absolute inset-y-0 start-0">
          {shown}
          <span
            aria-hidden
            className="ms-0.5 inline-block h-[0.9em] w-[2px] -translate-y-[2px] bg-current align-middle animate-pulse"
          />
        </span>
      </span>
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Hero
// ──────────────────────────────────────────────────────────────────
function Hero({
  ctaPrimary,
  ctaHref,
  router,
}: {
  ctaPrimary: string;
  ctaHref: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        <div className="flex flex-col justify-center gap-6">
          <Badge variant="outline" className="w-fit">
            Multi-tenant office archive · Built for SMBs
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Run{" "}
            <TypewriterCycle
              words={[
                "inventory",
                "sales",
                "operations",
                "accounting",
                "your whole back office",
              ]}
              className="text-primary"
            />
            <br />
            from <span className="text-primary">one place.</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Zermatoon is an end-to-end office archive: stock control,
            multi-warehouse inventory, sales + customer billing, employee HR,
            accounting and bank reconciliation — gated by a transparent
            subscription model so you pay for what you use.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => router.push(ctaHref)}>
              {ctaPrimary}
              <IconArrowRight className="ms-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#pricing">View pricing</a>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-primary" />
              Free Basic tier
            </div>
            <div className="flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-primary" />
              No credit card
            </div>
            <div className="flex items-center gap-1.5">
              <IconCheck className="h-4 w-4 text-primary" />
              Per-tenant scoped data
            </div>
          </div>
        </div>

        {/* Decorative product card cluster */}
        <div className="relative hidden md:block">
          <Card className="absolute right-0 top-8 w-72 -rotate-3 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-blue-500/10 p-2 text-blue-600">
                  <IconBoxSeam className="h-5 w-5" />
                </div>
                <Badge variant="default">+4 today</Badge>
              </div>
              <CardTitle className="mt-2 text-base">Items in stock</CardTitle>
              <CardDescription>1,284</CardDescription>
            </CardHeader>
          </Card>
          <Card className="absolute left-0 top-44 w-72 rotate-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600">
                  <IconReceipt className="h-5 w-5" />
                </div>
                <Badge variant="outline">Today</Badge>
              </div>
              <CardTitle className="mt-2 text-base">Sales revenue</CardTitle>
              <CardDescription>
                <span className="text-emerald-600">$12,840</span>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="absolute right-6 top-80 w-72 -rotate-1 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-amber-500/10 p-2 text-amber-600">
                  <IconBellRinging className="h-5 w-5" />
                </div>
                <Badge variant="destructive">Alert</Badge>
              </div>
              <CardTitle className="mt-2 text-base">Low stock</CardTitle>
              <CardDescription>3 items below threshold</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// About
// ──────────────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-1">
            <Badge variant="outline" className="mb-3">
              About
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Built for the back office, not the boardroom.
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground md:col-span-2">
            <p className="text-lg">
              Zermatoon is a multi-tenant office-archive system. Every
              business event — a stock movement, a sale, a payment, a
              supplier invoice — lives in one auditable history, scoped to
              the company it belongs to.
            </p>
            <p>
              The platform combines double-entry accounting, FIFO inventory
              costing, optimistic-lock stock movements, and a domain event
              bus so accounting ledgers, alerts and audit logs all stay in
              sync without any manual reconciliation.
            </p>
            <p>
              Permissions and subscription modules compose: each user has a
              role-based permission set <em>and</em> their company has an
              active plan that toggles which modules they can reach. So a
              Basic tenant gets the core, Premium tenants add reporting
              depth, and Pro tenants unlock the accounting and banking
              layers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// Features
// ──────────────────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      icon: IconBoxSeam,
      title: "Inventory + warehouses",
      desc: "Items, FIFO batches, optimistic-lock stock, per-warehouse stock breakdown and stock counts.",
    },
    {
      icon: IconReceipt,
      title: "Sales + customer billing",
      desc: "Invoices, partial payments, overdue tracking, PDF customer statements.",
    },
    {
      icon: IconUsersGroup,
      title: "Employees + departments",
      desc: "HR records, designations, onboarding dates, soft-deleted history.",
    },
    {
      icon: IconChartBar,
      title: "Reports + analytics",
      desc: "Profit per product, sales velocity, dead stock, turnover and dashboard KPIs.",
    },
    {
      icon: IconBellRinging,
      title: "Smart alerts",
      desc: "LOW / OVERSTOCK / REORDER / DEAD_STOCK alerts run on a cron, dispatched via your chosen channel.",
    },
    {
      icon: IconClipboardList,
      title: "Stock counts",
      desc: "Cycle counts with variance reconciliation and an audit trail of every adjustment.",
    },
    {
      icon: IconBuildingBank,
      title: "Accounting ledger",
      desc: "Double-entry chart of accounts, journal entries posted automatically from sales / purchases / payments.",
    },
    {
      icon: IconCash,
      title: "Bank reconciliation",
      desc: "Import statements, auto-match against payments, close periods only when balances tie.",
    },
    {
      icon: IconShieldLock,
      title: "Permissions + audit",
      desc: "Role-based gates, tenant-scoped queries, append-only audit log of every meaningful action.",
    },
  ];

  return (
    <section id="features" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 max-w-2xl">
          <Badge variant="outline" className="mb-3">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything a growing business needs — composable by plan.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick the modules you care about. Upgrade when you grow. Your
            data stays exactly where it was — under one tenant id, every
            query auto-scoped.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-muted transition hover:border-primary/40">
              <CardHeader>
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// Pricing — live data from /plans/public
// ──────────────────────────────────────────────────────────────────
function Pricing({
  plans,
  loading,
  ctaHref,
  ctaLabel,
  router,
}: {
  plans: PublicPlan[];
  loading: boolean;
  ctaHref: string;
  ctaLabel: string;
  router: ReturnType<typeof useRouter>;
}) {
  // Tag the middle plan as "recommended" — typical pricing-page UX.
  const recommendedSlug = plans.length >= 2 ? plans[Math.floor(plans.length / 2)].slug : null;

  return (
    <section id="pricing" className="border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-3">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Plans that scale with you.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free on Basic. Move to Premium when you need reporting,
            stock counts and alerts. Go Pro for accounting and banking.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Plans haven&apos;t been published yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={plan.slug === recommendedSlug}
                ctaHref={ctaHref}
                ctaLabel={ctaLabel}
                router={router}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices shown in USD. Plans can be billed Monthly or Yearly when an
          admin assigns the subscription. Basic is free and open-ended.
        </p>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  isRecommended,
  ctaHref,
  ctaLabel,
  router,
}: {
  plan: PublicPlan;
  isRecommended: boolean;
  ctaHref: string;
  ctaLabel: string;
  router: ReturnType<typeof useRouter>;
}) {
  const isFree = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
  const bullets = describePlan(plan);

  return (
    <Card
      className={
        isRecommended
          ? "relative border-primary shadow-lg"
          : "relative border-muted"
      }
    >
      {isRecommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Recommended
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          {plan.description ?? "Choose this plan when you outgrow the previous one."}
        </CardDescription>
        <div className="mt-3 flex items-baseline gap-1">
          {isFree ? (
            <>
              <span className="text-4xl font-bold">Free</span>
              <span className="text-muted-foreground">/ forever</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold">
                ${plan.monthlyPrice.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/ month</span>
              {plan.yearlyPrice > 0 && (
                <span className="ms-2 text-xs text-muted-foreground">
                  or ${plan.yearlyPrice.toLocaleString()} / year
                </span>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={isRecommended ? "default" : "outline"}
          className="w-full"
          onClick={() => router.push(ctaHref)}
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Turn a Plan's modules + limits into human-readable bullets. */
function describePlan(plan: PublicPlan): string[] {
  const lines: string[] = [];

  const modules = new Set(plan.modules.map((m) => m.moduleCode));
  const features = new Set(plan.features.map((f) => f.featureCode));

  const has = (code: string) => modules.has(code) || features.has(code);

  if (has("INVENTORY")) lines.push("Inventory + warehouses + stock movements");
  if (has("SALES")) lines.push("Sales, customers and partial payments");
  if (has("EMPLOYEES")) lines.push("Employees and departments");
  if (has("ALERTS")) lines.push("LOW / OVERSTOCK / REORDER alerts");
  if (has("STOCK_COUNTS")) lines.push("Cycle stock counts with variance reconciliation");
  if (has("INVENTORY_REPORTS")) lines.push("Inventory analytics + dashboards");
  if (has("INVENTORY_PROFIT_REPORT")) lines.push("Profit-per-product report");
  if (has("SALES_PDF_EXPORT")) lines.push("PDF invoice + sales report exports");
  if (has("CUSTOMER_STATEMENT_PDF")) lines.push("Customer statement PDFs");
  if (has("ACCOUNTING") || has("ACCOUNTING_LEDGER"))
    lines.push("Double-entry accounting ledger");
  if (has("ACCOUNTING_JOURNALS")) lines.push("Auto-posted journal entries");
  if (has("BANKING") || has("BANK_RECONCILIATION"))
    lines.push("Bank reconciliation + auto-matching");
  if (has("AUDIT_LOGS")) lines.push("Full audit-log explorer");

  // Limits → friendly labels
  const l = plan.limit;
  if (l) {
    const fmt = (n: number | null) => (n == null ? "Unlimited" : n.toLocaleString());
    lines.push(`Up to ${fmt(l.maxUsers)} users`);
    lines.push(`Up to ${fmt(l.maxWarehouses)} warehouses`);
    lines.push(`Up to ${fmt(l.maxItems)} items`);
    lines.push(`Up to ${fmt(l.maxEmployees)} employees`);
  }

  return lines;
}

// ──────────────────────────────────────────────────────────────────
// Contact
// ──────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">
              Contact
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Talk to us.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sales, support, partnership, or just a question — drop us a
              line and we&apos;ll get back within one business day.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <ContactRow
                icon={IconMail}
                label="Email"
                value="hello@zermatoon.com"
                href="mailto:hello@zermatoon.com"
              />
              <ContactRow
                icon={IconPhone}
                label="Phone"
                value="+93 700 000 000"
                href="tel:+93700000000"
              />
              <ContactRow
                icon={IconMapPin}
                label="Office"
                value="Kabul, Afghanistan"
              />
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-80 transition">
      {content}
    </a>
  ) : (
    content
  );
}

function ContactForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a message</CardTitle>
        <CardDescription>
          Real form coming soon — this is a static placeholder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Your name"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="your@email.com"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            rows={4}
            placeholder="How can we help?"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="submit">Send</Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────────
function Footer() {
  const year = 2026;
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-semibold">
              <Logo className="size-6" />
              <span>Zermatoon</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              An office-archive platform: inventory, sales, accounting and
              everything in between — tenant-scoped, audited, gated by a
              transparent subscription model.
            </p>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold">Product</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-foreground transition">
                  Login
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground transition">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row">
          <span>© {year} Hakimi Group. All rights reserved.</span>
          <span>Built with Next.js + NestJS + Prisma.</span>
        </div>
      </div>
    </footer>
  );
}
