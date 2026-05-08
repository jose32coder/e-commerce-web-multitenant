import LegalPageContent from "@/components/public/legal/LegalPageContent";
import {
  DEFAULT_COMMERCE_SETTINGS,
  getSiteConfig,
  normalizeCommerceSettings,
} from "@/lib/siteConfig";

export default async function TermsPage({ params }) {
  const { tenant } = await params;
  const config = await getSiteConfig({ tenantSlug: tenant });
  const commerce = normalizeCommerceSettings(
    config.commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );

  return (
    <LegalPageContent
      title={commerce.terms_title}
      content={commerce.terms_content}
    />
  );
}
