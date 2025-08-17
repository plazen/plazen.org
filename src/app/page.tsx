"use client";

import React from "react";
import Link from "next/link";
import styles from "./marketing.module.css";
import Image from "next/image";
import Logo from "@/images/logo2.png";

const REDIRECT_PATH = "/schedule";

const PlazenLogo = () => (
  <Image src={Logo} alt="Plazen Logo" width={50} height={50} />
);

export default function Page() {
  return <Landing />;
}

import dynamic from "next/dynamic";
const ClientRedirect = dynamic(
  () =>
    Promise.resolve(function ClientRedirect() {
      React.useEffect(() => {
        function hasAuthCookie() {
          if (typeof document === "undefined") return false;
          return document.cookie
            .split(";")
            .some((cookie) => cookie.trim().includes("auth-token"));
        }

        if (hasAuthCookie()) {
          window.location.href = REDIRECT_PATH;
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
                <PlazenLogo />
                <span className={styles.brandText}>Plazen</span>
              </div>
              <nav className={styles.nav}>
                <a href="#features" className={styles.navLink}>
                  Features
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
        <section className={styles.heroFullscreen}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Your day, planned for you.</h1>
            <p className={styles.heroSubtitle}>
              Plazen turns tasks into time. Add flexible to‑dos, pin hard
              appointments, and let Plazen place everything into a realistic
              daily schedule—no dragging blocks or micromanaging.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className={styles.buttonPrimary}>
                Get started — Log in
              </Link>
              <a href="#features" className={styles.buttonSecondary}>
                See how it works
              </a>
            </div>
            <p className={styles.trustNote}>
              Built for people who value deep work: students, founders,
              creators, and focused teams.
            </p>
          </div>
          <div className={styles.scrollIndicator}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrowIcon}
            >
              <path
                d="M7 10L12 15L17 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        <section id="features" className={styles.sectionAlt}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Built for focus, not fiddling
            </h2>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>🎯</div>
                <span className={styles.featureName}>Focus mode</span>
                <span className={styles.featureDesc}>
                  One task at a time with gentle, timely handoffs.
                </span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>⏱️</div>
                <span className={styles.featureName}>Smart planning</span>
                <span className={styles.featureDesc}>
                  Calculates perfect schedules based on your plans.
                </span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>⚡</div>
                <span className={styles.featureName}>Energy‑aware</span>
                <span className={styles.featureDesc}>
                  Schedule deep work when you&apos;re sharp; save admin for
                  later.
                </span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>📅</div>
                <span className={styles.featureName}>Calendar‑friendly</span>
                <span className={styles.featureDesc}>
                  Respects your events so plans reflect reality.
                </span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>🛡️</div>
                <span className={styles.featureName}>Deadline protection</span>
                <span className={styles.featureDesc}>
                  Prioritizes time‑sensitive items so nothing slips.
                </span>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.featureIcon}>🔧</div>
                <span className={styles.featureName}>Tweakable</span>
                <span className={styles.featureDesc}>
                  Nudge a task; Plazen rebalances the rest intelligently.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>What people say</h2>
            <div className={styles.testimonialGrid}>
              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  I stopped spending 30 minutes every morning deciding when to
                  do tasks. Plazen just handles it, so I actually start working.
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="https://avatars.githubusercontent.com/u/175145001?v=4"
                    alt="Drew S."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Drew S.</span>
                    <span className={styles.testimonialRole}>
                      Lead Developer
                    </span>
                  </div>
                </figcaption>
              </figure>

              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  My day used to be a mess of tasks and meetings. Now I just
                  focus on what&apos;s next.
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="https://i.pinimg.com/236x/b2/ea/a0/b2eaa0d4918d54021f9c7aa3fc3d3cf3.jpg"
                    alt="Preston P."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Preston P.</span>
                    <span className={styles.testimonialRole}>
                      Software Engineer
                    </span>
                  </div>
                </figcaption>
              </figure>

              <figure className={styles.testimonial}>
                <blockquote className={styles.testimonialQuote}>
                  It was hard for me to plan my day outside of classes. Now I
                  can focus on studying and let Plazen plan the rest.
                </blockquote>
                <figcaption className={styles.testimonialMeta}>
                  <Image
                    width={800}
                    height={600}
                    className={styles.testimonialAvatar}
                    src="https://i.pinimg.com/236x/06/f4/e2/06f4e292a4dbe804107c6bf6f6616bda.jpg"
                    alt="Nina C."
                  />
                  <div className={styles.testimonialIdentity}>
                    <span className={styles.testimonialName}>Priya</span>
                    <span className={styles.testimonialRole}>
                      Medical Student
                    </span>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
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
              <PlazenLogo />
              <span className={styles.brandText}>Plazen</span>
            </div>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Plazen
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
