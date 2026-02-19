import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");
  return { title: t("metaTitle") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  return (
    <div className="pb-24 max-w-2xl mx-auto prose prose-sm prose-gray">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <p className="text-xs text-gray-400 mb-8">{t("effectiveDate")}</p>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-base font-bold text-gray-900">{t("article1Title")}</h2>
        <p>{t("article1Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article2Title")}</h2>
        <p>{t("article2Intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article2Items.partyMatching")}</li>
          <li>{t("article2Items.soloQuest")}</li>
          <li>{t("article2Items.characterGrowth")}</li>
          <li>{t("article2Items.premium")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article3Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article3Items.socialLogin")}</li>
          <li>{t("article3Items.accurateInfo")}</li>
          <li>{t("article3Items.accountResponsibility")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article4Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article4Items.plans")}</li>
          <li>{t("article4Items.noAutoRenew")}</li>
          <li>{t("article4Items.cancelPolicy")}</li>
          <li>{t("article4Items.paymentProcessor")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article5Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article5Items.fullRefund")}</li>
          <li>{t("article5Items.serviceOutage")}</li>
          <li>{t("article5Items.refundContact")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article6Title")}</h2>
        <p>{t("article6Intro")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article6Items.infringement")}</li>
          <li>{t("article6Items.disruption")}</li>
          <li>{t("article6Items.illegalUse")}</li>
          <li>{t("article6Items.falseInfo")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article7Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article7Items.maintenance")}</li>
          <li>{t("article7Items.violation")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article8Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article8Items.aiContent")}</li>
          <li>{t("article8Items.userDispute")}</li>
          <li>{t("article8Items.forceM")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article9Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article9Items.companyCopyright")}</li>
          <li>{t("article9Items.userContent")}</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article10Title")}</h2>
        <p>{t("article10Content")}</p>

        <h2 className="text-base font-bold text-gray-900 mt-6">{t("article11Title")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("article11Items.operator")}</li>
          <li>{t("article11Items.email")}</li>
        </ul>
      </section>
    </div>
  );
}
