import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-gray-50 border-t border-gray-200 pb-20 mt-12">
      <div className="max-w-3xl mx-auto px-4 py-6 text-xs text-gray-400 space-y-2">
        <p className="font-medium text-gray-500">{t("companyName")}</p>
        <div className="space-y-0.5">
          <p>{t("representative")}: {t("representativeName")}</p>
          <p>{t("businessNumber")}: 735-69-00608</p>
          <p>{t("address")}: {t("addressValue")}</p>
          <p>{t("email")}: osu355@gmail.com</p>
          <p>{t("phone")}: 010-7556-0317</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/privacy" className="hover:text-gray-600 underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-gray-600 underline">
            {t("terms")}
          </Link>
        </div>
        <p className="pt-1">&copy; 2025 HundredCore Korea. All rights reserved.</p>
      </div>
    </footer>
  );
}
