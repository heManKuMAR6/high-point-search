"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], delay: i * 0.1 },
  }),
};

const features = [
  {
    label: "Apply in minutes",
    sub: "Simple, guided onboarding experience",
    color: "#1F6F8B",
    bg: "rgba(31,111,139,0.08)",
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
  },
  {
    label: "We match you",
    sub: "Smart AI-powered matching engine",
    color: "#FF6F61",
    bg: "rgba(255,111,97,0.08)",
    icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  },
  {
    label: "Get hired",
    sub: "With employers who truly care",
    color: "#d4a017",
    bg: "rgba(255,209,102,0.12)",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </>
    ),
  },
];

function FeatureCard({ item, index }: { item: typeof features[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      custom={index + 5}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        background: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: hovered ? `1.5px solid ${item.color}30` : "1.5px solid rgba(0,0,0,0.065)",
        borderRadius: "20px",
        padding: "28px",
        cursor: "default",
        transform: hovered ? "translateY(-6px)" : "translateY(0px)",
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.09), 0 0 0 1px ${item.color}15`
          : "0 4px 20px rgba(0,0,0,0.04)",
        transition: "all 0.3s cubic-bezier(0.2,0.8,0.2,1)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: hovered ? item.bg : "rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          transition: "background 0.3s ease",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={hovered ? item.color : "#888"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.3s ease" }}
        >
          {item.icon}
        </svg>
      </div>
      <h4
        style={{
          fontSize: "1rem",
          fontFamily: "var(--font-heading-var)",
          fontWeight: 600,
          color: hovered ? item.color : "#1D1D1F",
          marginBottom: 6,
          letterSpacing: "-0.01em",
          transition: "color 0.3s ease",
        }}
      >
        {item.label}
      </h4>
      <p style={{ fontSize: "0.85rem", color: "#86868b", lineHeight: 1.6, fontWeight: 300 }}>
        {item.sub}
      </p>
    </motion.div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: "0.9rem",
        fontWeight: 400,
        color: hovered ? "#1D1D1F" : "#6b6b70",
        textDecoration: "none",
        transition: "color 0.2s ease",
      }}
    >
      {label}
    </Link>
  );
}

export default function Home() {
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [outlineHovered, setOutlineHovered] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FBFBFD",
        fontFamily: "var(--font-body-var)",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Background Accents */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "-8%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(143,221,231,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "5%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(31,111,139,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Nav */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#1F6F8B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(31,111,139,0.28)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "1.1rem",
              fontFamily: "var(--font-heading-var)",
              fontWeight: 500,
              color: "#1D1D1F",
              letterSpacing: "-0.02em",
            }}
          >
            High Point Search
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <NavLink href="/employers" label="For Employers" />
          <NavLink href="/apply" label="For Candidates" />
          <Link
            href="/login"
            style={{
              fontSize: "0.88rem",
              fontWeight: 500,
              color: "#1D1D1F",
              textDecoration: "none",
              padding: "8px 20px",
              borderRadius: 100,
              border: "1.5px solid rgba(0,0,0,0.12)",
              background: "white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.2s ease",
            }}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 40px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              border: "1.5px solid rgba(31,111,139,0.18)",
              borderRadius: 100,
              padding: "6px 16px",
              marginBottom: 36,
              boxShadow: "0 2px 12px rgba(31,111,139,0.08)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#1F6F8B",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(31,111,139,0.15)",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: "0.72rem",
                color: "#1F6F8B",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Specialized recruiting for 50+ and veterans
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontFamily: "var(--font-heading-var)",
            fontSize: "clamp(3rem, 6vw, 5.5rem)",
            fontWeight: 300,
            color: "#1D1D1F",
            lineHeight: 1.07,
            letterSpacing: "-0.03em",
            marginBottom: 28,
            maxWidth: 800,
          }}
        >
          We connect the right people
          <br />
          with the right{" "}
          <span style={{ color: "#1F6F8B", fontWeight: 500 }}>work.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontSize: "1.15rem",
            color: "#6b6b70",
            fontWeight: 300,
            lineHeight: 1.75,
            marginBottom: 44,
            maxWidth: 560,
          }}
        >
          High Point Search specializes in placing experienced professionals —
          50+ age and veterans — with employers who value what they bring.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ display: "flex", gap: 14, marginBottom: 80, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link
            href="/apply"
            onMouseEnter={() => setPrimaryHovered(true)}
            onMouseLeave={() => setPrimaryHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: primaryHovered ? "#185d76" : "#1F6F8B",
              color: "white",
              fontSize: "0.95rem",
              fontWeight: 400,
              padding: "14px 32px",
              borderRadius: 100,
              textDecoration: "none",
              transform: primaryHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: primaryHovered
                ? "0 12px 32px rgba(31,111,139,0.35)"
                : "0 6px 20px rgba(31,111,139,0.22)",
              transition: "all 0.25s cubic-bezier(0.2,0.8,0.2,1)",
              letterSpacing: "0.005em",
            }}
          >
            Find opportunities
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: primaryHovered ? "translateX(3px)" : "translateX(0)",
                transition: "transform 0.25s ease",
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/employers"
            onMouseEnter={() => setOutlineHovered(true)}
            onMouseLeave={() => setOutlineHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: outlineHovered ? "#1F6F8B" : "transparent",
              color: outlineHovered ? "white" : "#1F6F8B",
              fontSize: "0.95rem",
              fontWeight: 400,
              padding: "14px 32px",
              borderRadius: 100,
              border: "1.5px solid #1F6F8B",
              textDecoration: "none",
              transform: outlineHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: outlineHovered ? "0 8px 24px rgba(31,111,139,0.18)" : "none",
              transition: "all 0.25s cubic-bezier(0.2,0.8,0.2,1)",
              letterSpacing: "0.005em",
            }}
          >
            I'm an employer
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <div style={{ display: "flex", gap: 18, width: "100%", maxWidth: 860 }}>
          {features.map((item, i) => (
            <FeatureCard key={item.label} item={item} index={i} />
          ))}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(31,111,139,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(31,111,139,0.06); }
        }
      `}</style>
    </div>
  );
}