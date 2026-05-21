"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Instagram, Facebook, Twitter } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  normalizeCommerceSettings,
  normalizeFooterSettings,
  normalizeHeaderMenu,
  normalizeWhatsappNumber,
} from "@/lib/siteConfig";

const footerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.19, 1, 0.22, 1],
      staggerChildren: 0.1,
    },
  },
};

const BUSINESS_DAY_INDEX = [6, 0, 1, 2, 3, 4, 5];

const formatHour = (value) => {
  if (!value) return "";
  const [hour, minute] = String(value).split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getBusinessHoursStatus = (hours) => {
  if (!Array.isArray(hours) || hours.length === 0) return null;

  const now = new Date();
  const today = hours[BUSINESS_DAY_INDEX[now.getDay()]];
  if (!today?.enabled) return { open: false, label: "Cerrado hoy" };

  const [openHour, openMinute] = String(today.open || "00:00")
    .split(":")
    .map(Number);
  const [closeHour, closeMinute] = String(today.close || "00:00")
    .split(":")
    .map(Number);
  const openAt = new Date(now);
  const closeAt = new Date(now);
  openAt.setHours(openHour || 0, openMinute || 0, 0, 0);
  closeAt.setHours(closeHour || 0, closeMinute || 0, 0, 0);

  const open = now >= openAt && now <= closeAt;
  return {
    open,
    label: open
      ? `Abierto hasta ${formatHour(today.close)}`
      : `Cerrado · ${formatHour(today.open)} - ${formatHour(today.close)}`,
  };
};

const Footer = () => {
  const {
    site_name,
    header_menu,
    footer_settings,
    commerce_settings,
    tenant_slug,
  } = useSiteConfig();
  const baseUrl = tenant_slug ? `/${tenant_slug}` : "";
  const currentYear = new Date().getFullYear();
  const menuSlots = normalizeHeaderMenu(header_menu);
  const footer = normalizeFooterSettings(
    footer_settings || DEFAULT_FOOTER_SETTINGS,
  );
  const commerce = normalizeCommerceSettings(
    commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );
  const whatsappNumber = normalizeWhatsappNumber(commerce.whatsapp_number);
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
  const businessHours = Array.isArray(commerce.business_hours)
    ? commerce.business_hours
    : [];
  const businessStatus = getBusinessHoursStatus(businessHours);

  const sections = [
    {
      title: "Comprar",
      links: (() => {
        // 1. Filtramos para obtener solo los slots que tienen texto (label)
        const activeLinks = menuSlots
          .filter((item) => item.label && item.label.trim() !== "")
          .map((item) => ({
            name: item.label,
            href: item.target_id
              ? `${baseUrl}/products?category=${encodeURIComponent(item.target_id)}`
              : `${baseUrl}/products`,
          }));

        // 2. Si hay links guardados, devolvemos solo esos.
        // 3. Si la lista está totalmente vacía, devolvemos el link por defecto.
        return activeLinks.length > 0
          ? activeLinks
          : [{ name: "Productos", href: `${baseUrl}/products` }];
      })(),
    },
    {
      title: "Ayuda",
      links: [
        { name: "Privacidad", href: `${baseUrl}/privacy` },
        { name: "Términos", href: `${baseUrl}/terms` },
        { name: "Contacto", href: whatsappHref },
      ],
    },
  ];

  const legalLinks = [
    { name: "Privacidad", href: "/privacy" },
    { name: "Términos", href: "/terms" },
    { name: "Admin", href: "/access" },
  ];

  return (
    <footer className="bg-[#09090b] text-zinc-400 pt-20 pb-10 border-t mt-10 border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* --- SECCIÓN PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-10 mb-8">
          {/* Brand & Social */}
          <div className="lg:col-span-5 space-y-8">
            <Link
              href={`${baseUrl}/`}
              className="text-2xl font-black tracking-[0.15em] text-white uppercase inline-block"
            >
              {site_name}
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-medium">
              {footer.description}
            </p>
            <div className="flex gap-6 text-zinc-500">
              {footer.instagram_url?.trim() ? (
                <Link
                  href={footer.instagram_url}
                  className="hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Instagram size={20} strokeWidth={1.5} />
                </Link>
              ) : null}
              {footer.facebook_url?.trim() ? (
                <Link
                  href={footer.facebook_url}
                  className="hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Facebook size={20} strokeWidth={1.5} />
                </Link>
              ) : null}
              {footer.twitter_url?.trim() ? (
                <Link
                  href={footer.twitter_url}
                  className="hover:text-white transition-all duration-300 transform hover:-translate-y-1"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Twitter size={20} strokeWidth={1.5} />
                </Link>
              ) : null}
            </div>
          </div>

          {/* Links Desktop */}
          <div className="hidden md:grid grid-cols-2 lg:col-span-4 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-200 mb-8">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li key={`${link.name}-${linkIdx}`}>
                      <Link
                        href={link.href}
                        target={link.name === "Contacto" ? "_blank" : undefined}
                        rel={
                          link.name === "Contacto"
                            ? "noreferrer noopener"
                            : undefined
                        }
                        className="text-sm hover:text-white transition-colors duration-200 font-light"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Acordeón Móvil */}
          {businessHours.length > 0 ? (
            <div className="hidden md:block lg:col-span-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-200 mb-5">
                Horario
              </h3>
              {businessStatus ? (
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 mb-4 text-[9px] font-black uppercase tracking-widest ${
                    businessStatus.open
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      businessStatus.open ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  {businessStatus.label}
                </div>
              ) : null}
              <ul className="space-y-2">
                {businessHours.map((item) => (
                  <li
                    key={item.day}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-zinc-300">{item.day}</span>
                    <span className="text-zinc-500">
                      {item.enabled === false
                        ? "Cerrado"
                        : `${formatHour(item.open)} - ${formatHour(item.close)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="md:hidden pt-4">
            <Accordion type="single" collapsible className="w-full">
              {sections.map((section, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border-zinc-800"
                >
                  <AccordionTrigger className="text-[10px] font-bold uppercase tracking-widest text-zinc-200 py-6">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-500">
                    <ul className="space-y-4 pb-4">
                      {section.links.map((link, linkIdx) => (
                        <li key={`${link.name}-${linkIdx}`}>
                          <Link
                            href={link.href}
                            target={
                              link.name === "Contacto" ? "_blank" : undefined
                            }
                            rel={
                              link.name === "Contacto"
                                ? "noreferrer noopener"
                                : undefined
                            }
                            className="text-sm"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {businessHours.length > 0 ? (
              <div className="pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-200 mb-4">
                  <Clock size={14} /> Horario
                </div>
                {businessStatus ? (
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 mb-4 text-[9px] font-black uppercase tracking-widest ${
                      businessStatus.open
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        businessStatus.open ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                    />
                    {businessStatus.label}
                  </div>
                ) : null}
                <ul className="space-y-2">
                  {businessHours.map((item) => (
                    <li
                      key={item.day}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-bold text-zinc-300">{item.day}</span>
                      <span className="text-zinc-500">
                        {item.enabled === false
                          ? "Cerrado"
                          : `${formatHour(item.open)} - ${formatHour(item.close)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* --- BARRA INFERIOR --- */}
        <div className="pt-10 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.25em]">
              © {currentYear} {site_name}
            </p>
            <span className="hidden md:block w-px h-3 bg-zinc-800" />
            <p className="text-[9px] text-zinc-700 uppercase tracking-[0.25em]">
              Desarrollado por <span className="text-zinc-500">Deploy</span>
            </p>
          </div>

          <div className="flex gap-10">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[9px] text-zinc-600 hover:text-white active:text-white uppercase tracking-[0.25em] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
