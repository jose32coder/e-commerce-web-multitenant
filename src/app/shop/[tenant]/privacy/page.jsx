import LegalPageContent from "@/components/public/legal/LegalPageContent";
import {
  DEFAULT_COMMERCE_SETTINGS,
  getSiteConfig,
  normalizeCommerceSettings,
} from "@/lib/siteConfig";

export default async function PrivacyPage({ params }) {
  const { tenant } = await params;
  const config = await getSiteConfig({ tenantSlug: tenant });
  const commerce = normalizeCommerceSettings(
    config.commerce_settings || DEFAULT_COMMERCE_SETTINGS,
  );

  return (
    <LegalPageContent
      title={commerce.privacy_title}
      content={commerce.privacy_content}
    />
  );
}
