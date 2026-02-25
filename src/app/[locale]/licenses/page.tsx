import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Licenses");
  return { title: t("metaTitle") };
}

export default async function LicensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Licenses");

  return (
    <div className="pb-24 max-w-2xl mx-auto prose prose-sm prose-gray">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <p className="text-xs text-gray-400 mb-8">{t("effectiveDate")}</p>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-base font-bold text-gray-900">{t("section1Title")}</h2>
        <p>{t("section1Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section2Title")}</h2>
        <p>{t("section2Content")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section2Items.diceOnly")}</li>
          <li>{t("section2Items.noRulebook")}</li>
          <li>{t("section2Items.noExtraction")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section3Title")}</h2>
        <p>{t("section3Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section4Title")}</h2>
        <p>{t("section4Content")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("section4Items.dnd")}</li>
          <li>{t("section4Items.coc")}</li>
          <li>{t("section4Items.vtm")}</li>
          <li>{t("section4Items.dw")}</li>
          <li>{t("section4Items.bitd")}</li>
          <li>{t("section4Items.insane")}</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">{t("section4Disclaimer")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section5Title")}</h2>
        <p>{t("section5Content")}</p>

        <h3 className="text-sm font-bold text-gray-800 mt-4">{t("section5Dw")}</h3>
        <p>{t("section5DwAttribution")}</p>
        <p>{t("section5DwTerms")}</p>

        <h3 className="text-sm font-bold text-gray-800 mt-4">{t("section5Bitd")}</h3>
        <p>{t("section5BitdAttribution")}</p>

        <p className="text-xs text-gray-400 mt-2">
          <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
            {t("section5LicenseLink")}
          </a>
        </p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("section6Title")}</h2>
        <p>{t("section6Content")}</p>
      </section>
    </div>
  );
}
