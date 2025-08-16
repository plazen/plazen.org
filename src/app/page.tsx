"use client";

import React from "react";
import Link from "next/link";
import styles from "./marketing.module.css";
import Image from "next/image";

// Adjust these to match your auth and routes:
const SESSION_COOKIE = "plazen_session";
const SCHEDULE_PATH = "/schedule";

export default function Page() {
  return <Landing />;
}

// Client-only redirect component
import dynamic from "next/dynamic";
const ClientRedirect = dynamic(
  () =>
    Promise.resolve(function ClientRedirect() {
      React.useEffect(() => {
        function getCookie(name: string) {
          if (typeof document === "undefined") return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2)
            return parts.pop()?.split(";").shift() || null;
          return null;
        }
        const token = getCookie(SESSION_COOKIE);
        if (token) {
          window.location.href = SCHEDULE_PATH;
        }
      }, []);
      return null;
    }),
  { ssr: false }
);

function Landing() {
  return (
    <>
      <ClientRedirect />
      <main className={`${styles.page} ${styles.theme}`}>
        <header className={styles.header}>
          <div className={styles.container}>
            <div className={styles.topBar}>
              <div className={styles.brand}>
                <span className={styles.brandMark} />
                <span className={styles.brandText}>Plazen</span>
              </div>
              <nav className={styles.nav}>
                <a href="#how" className={styles.navLink}>
                  How it works
                </a>
                <a href="#features" className={styles.navLink}>
                  Features
                </a>
                <a href="#faq" className={styles.navLink}>
                  FAQ
                </a>
                <Link
                  href="/login"
                  className={`${styles.navLink} ${styles.loginLink}`}
                >
                  Log in
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>Your day, planned for you.</h1>
            <p className={styles.subtitle}>
              Plazen turns tasks into time. Add flexible to‑dos, pin hard
              appointments, and let Plazen place everything into a realistic
              daily schedule—no dragging blocks or micromanaging.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className={styles.buttonPrimary}>
                Get started — Log in
              </Link>
              <a href="#how" className={styles.buttonSecondary}>
                See how it works
              </a>
            </div>
            <p className={styles.trustNote}>
              Built for people who value deep work: students, founders,
              creators, and focused teams.
            </p>
          </div>
          <div className={styles.heroMedia}>
            <Image
              width={800}
              height={600}
              className={styles.heroImage}
              src="/og-image.png"
              alt="Plazen daily plan with tasks placed between calendar events"
              loading="eager"
            />
            <Image
              width={800}
              height={600}
              className={styles.mediaImage}
              src="/images/mobile.png"
              alt="Mobile view of Plazen with today's plan"
              loading="lazy"
            />
          </div>
        </section>

        <section id="features" className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Built for focus, not fiddling
            </h2>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Focus mode</span>
                <span className={styles.featureDesc}>
                  One task at a time with gentle, timely handoffs.
                </span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Smart durations</span>
                <span className={styles.featureDesc}>
                  Learns how long tasks really take to improve future plans.
                </span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Energy‑aware</span>
                <span className={styles.featureDesc}>
                  Schedule deep work when you’re sharp; save admin for later.
                </span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Calendar‑friendly</span>
                <span className={styles.featureDesc}>
                  Respects your events so plans reflect reality.
                </span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Deadline protection</span>
                <span className={styles.featureDesc}>
                  Prioritizes time‑sensitive items so nothing slips.
                </span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureName}>Tweakable</span>
                <span className={styles.featureDesc}>
                  Nudge a task; Plazen rebalances the rest intelligently.
                </span>
              </li>
            </ul>
            <Image
              width={800}
              height={600}
              className={styles.integrationsImage}
              src="/images/integrations.png"
              alt="Integrations and calendar syncing"
              loading="lazy"
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>What people say</h2>
            <div className={styles.testimonialGrid}>
              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  “I stopped spending 30 minutes every morning shuffling tasks.
                  Plazen just handles it, so I actually start working.”
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="/images/testimonial-1.jpg"
                    alt="Samira A."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Samira A.</span>
                    <span className={styles.testimonialRole}>
                      Founder & Researcher
                    </span>
                  </div>
                </figcaption>
              </figure>

              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  “My days finally feel realistic. I finish more and worry less.
                  It’s like a calm project manager in my pocket.”
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="/images/testimonial-2.jpg"
                    alt="Jon P."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Jon P.</span>
                    <span className={styles.testimonialRole}>
                      Product Designer
                    </span>
                  </div>
                </figcaption>
              </figure>

              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  “Pin the must‑dos, let Plazen place the rest. It’s the first
                  task manager that respects my time.”
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="/images/testimonial-3.jpg"
                    alt="Nina C."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Nina C.</span>
                    <span className={styles.testimonialRole}>Grad Student</span>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Frequently asked questions</h2>

            <details className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                How is Plazen different from a normal to‑do app?
              </summary>
              <p className={styles.faqText}>
                Most to‑do apps collect tasks. Plazen turns tasks into time. It
                plans your day automatically, balancing fixed events with
                flexible work so you don’t have to micromanage your schedule.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                Can I still drag and drop tasks?
              </summary>
              <p className={styles.faqText}>
                Yes. You can nudge and reorder. Plazen will reflow everything
                else intelligently, preserving your anchors.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                Does it work with my calendar?
              </summary>
              <p className={styles.faqText}>
                Plazen respects your calendar events and can sync with popular
                providers so your schedule stays true to life.
              </p>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                Is there a free plan?
              </summary>
              <p className={styles.faqText}>
                Yes. Get started for free and upgrade if you need more power.
              </p>
            </details>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.ctaTitle}>Ready to reclaim your day?</h2>
            <p className={styles.ctaText}>
              Join people who plan less and accomplish more with Plazen.
            </p>
            <Link href="/login" className={styles.buttonPrimaryLarge}>
              Log in to start planning
            </Link>
            <p className={styles.smallNote}>No credit card required.</p>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={`${styles.container} ${styles.footerInner}`}>
            <div className={styles.brand}>
              <span className={styles.brandMark} />
              <span className={styles.brandText}>Plazen</span>
            </div>
            <nav className={styles.footerNav}>
              <a href="#features" className={styles.footerLink}>
                Features
              </a>
              <a href="#how" className={styles.footerLink}>
                How it works
              </a>
              <a href="#faq" className={styles.footerLink}>
                FAQ
              </a>
              <Link href="/login" className={styles.footerLink}>
                Log in
              </Link>
            </nav>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Plazen
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
