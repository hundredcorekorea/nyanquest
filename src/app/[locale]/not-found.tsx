import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="text-center py-20 pb-24">
      <div className="text-6xl mb-4">😿</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {t("title")}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {t("description")}
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors"
      >
        {t("goHome")}
      </Link>
    </div>
  );
}
