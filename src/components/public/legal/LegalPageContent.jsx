"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, FileText, ChevronRight, ArrowUp } from "lucide-react";

// Parsea el content en bloques para render estructurado
function parseContent(content) {
  if (!content) return [];
  const lines = content.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      const items = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("• "))
      ) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    } else if (line.trim() === "") {
      // skip blank lines
    } else {
      blocks.push({ type: "paragraph", text: line.trim() });
    }
    i++;
  }

  return blocks;
}

// Extrae headings para tabla de contenidos
function extractHeadings(blocks) {
  return blocks
    .filter((b) => b.type === "h2" || b.type === "h3")
    .map((b, idx) => ({
      id: `section-${idx}`,
      text: b.text,
      level: b.type === "h2" ? 2 : 3,
    }));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export default function LegalPageContent({ title, content, type = "privacy" }) {
  const [activeSection, setActiveSection] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef(null);

  const isPrivacy = type === "privacy";
  const Icon = isPrivacy ? Shield : FileText;
  const accentColor = isPrivacy ? "indigo" : "violet";

  const blocks = parseContent(content);
  const headings = extractHeadings(blocks);

  // Back-to-top button on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active section tracker usando IntersectionObserver
  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const accentClasses = {
    indigo: {
      badge: "bg-indigo-50 text-indigo-600 border-indigo-200",
      icon: "text-indigo-500",
      iconBg: "bg-indigo-50",
      activeLink: "text-indigo-600 bg-indigo-50/60 border-indigo-300",
      dot: "bg-indigo-500",
      h2border: "border-indigo-200",
      h2text: "text-indigo-900",
      backTop: "bg-indigo-600 hover:bg-indigo-700",
    },
    violet: {
      badge: "bg-violet-50 text-violet-600 border-violet-200",
      icon: "text-violet-500",
      iconBg: "bg-violet-50",
      activeLink: "text-violet-600 bg-violet-50/60 border-violet-300",
      dot: "bg-violet-500",
      h2border: "border-violet-200",
      h2text: "text-violet-900",
      backTop: "bg-violet-600 hover:bg-violet-700",
    },
  }[accentColor];

  // Render each block
  let h2Count = 0;
  let headingIdx = 0;
  const renderedBlocks = blocks.map((block, i) => {
    if (block.type === "h1") {
      return null; // título ya se muestra en el header
    }

    if (block.type === "h2") {
      h2Count++;
      const id = headings[headingIdx]?.id;
      headingIdx++;
      return (
        <div key={i} id={id} className="scroll-mt-24 mt-10 first:mt-0">
          <div className={`flex items-center gap-3 mb-4`}>
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full ${accentClasses.dot} text-white text-[10px] font-black flex items-center justify-center`}
            >
              {h2Count}
            </span>
            <h2
              className={`text-lg font-black uppercase tracking-[0.06em] ${accentClasses.h2text}`}
            >
              {block.text}
            </h2>
          </div>
          <div className={`w-full h-px ${accentClasses.h2border} mb-5`} />
        </div>
      );
    }

    if (block.type === "h3") {
      const id = headings[headingIdx]?.id;
      headingIdx++;
      return (
        <h3
          key={i}
          id={id}
          className="scroll-mt-24 text-sm font-black uppercase tracking-widest text-zinc-700 mt-6 mb-2"
        >
          {block.text}
        </h3>
      );
    }

    if (block.type === "list") {
      return (
        <ul key={i} className="space-y-2 mb-4 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-zinc-600">
              <ChevronRight
                size={14}
                className={`mt-0.5 shrink-0 ${accentClasses.icon}`}
              />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === "paragraph") {
      return (
        <p
          key={i}
          className="text-sm leading-7 text-zinc-600 mb-4 font-light"
        >
          {block.text}
        </p>
      );
    }

    return null;
  });

  // Si no hay bloques estructurados, render como texto plano
  const isPlainContent = blocks.every(
    (b) => b.type === "paragraph" || b.type === "list",
  );

  return (
    <section className="py-12 md:py-20 min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-10">
        {/* Hero Header */}
        <div className="mb-10 md:mb-16">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest mb-6 ${accentClasses.badge}`}
          >
            <Icon size={11} />
            {isPrivacy ? "Privacidad" : "Legal"}
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.06em] text-zinc-900 leading-tight max-w-2xl">
            {title || (isPrivacy ? "Política de Privacidad" : "Términos y Condiciones")}
          </h1>

          <p className="mt-4 text-sm text-zinc-500 font-medium max-w-xl leading-relaxed">
            {isPrivacy
              ? "Información sobre cómo recopilamos, usamos y protegemos tus datos personales."
              : "Condiciones que rigen el uso de nuestra tienda y los servicios que ofrecemos."}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <span className="h-px w-8 bg-zinc-300" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              Documento legal vigente
            </span>
          </div>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Sidebar TOC — solo si hay headings */}
          {headings.length > 0 && (
            <aside className="lg:w-60 lg:sticky lg:top-24 flex-shrink-0">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">
                  Contenido
                </p>
                <nav className="space-y-1">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(heading.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className={`block text-[11px] font-bold py-1.5 px-3 rounded-lg border transition-all duration-200 truncate
                        ${heading.level === 3 ? "ml-3" : ""}
                        ${
                          activeSection === heading.id
                            ? `${accentClasses.activeLink} border-opacity-100`
                            : "text-zinc-500 border-transparent hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div
            ref={contentRef}
            className="flex-1 min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 md:p-10 shadow-sm"
          >
            {/* Si no hay contenido estructurado, mostrar como texto */}
            {!content || content.trim() === "" ? (
              <div className="text-sm text-zinc-400 italic">
                Este documento está siendo preparado. Vuelve pronto.
              </div>
            ) : blocks.length === 0 ||
              blocks.every((b) => b.type === "paragraph") ? (
              <div className="whitespace-pre-line text-sm leading-7 text-zinc-600 font-light">
                {content}
              </div>
            ) : (
              <div>{renderedBlocks}</div>
            )}
          </div>
        </div>

        {/* Back to top */}
        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className={`fixed bottom-8 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full text-white shadow-lg transition-all duration-300 ${accentClasses.backTop}
            ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </section>
  );
}
