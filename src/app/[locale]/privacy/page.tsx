import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");
  return { title: t("metaTitle") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <div className="pb-24 max-w-2xl mx-auto prose prose-sm prose-gray">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <p className="text-xs text-gray-400 mb-8">{t("effectiveDate")}</p>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-base font-bold text-gray-900">{t("section1Title")}</h2>
        <p>{t("section1Intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section1Items.socialLogin")}</li>
          <li>{t("section1Items.serviceUsage")}</li>
          <li>{t("section1Items.payment")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section2Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section2Items.identification")}</li>
          <li>{t("section2Items.partyMatching")}</li>
          <li>{t("section2Items.premiumPayment")}</li>
          <li>{t("section2Items.improvement")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section3Title")}</h2>
        <p>{t("section3Intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section3Items.transaction")}</li>
          <li>{t("section3Items.loginRecord")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section4Title")}</h2>
        <p>{t("section4Content")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section4Items.payment")}</li>
          <li>{t("section4Items.ai")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section4aTitle")}</h2>
        <p>{t("section4aContent")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section5Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section5Items.encryption")}</li>
          <li>{t("section5Items.https")}</li>
          <li>{t("section5Items.socialAuth")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section6Title")}</h2>
        <p>{t("section6Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section7Title")}</h2>
        <p>{t("section7Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section8Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section8Items.operator")}</li>
          <li>{t("section8Items.email")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section9Title")}</h2>
        <p>{t("section9Content")}</p>
      </section>
    </div>
  );
}
