"use client";

import { getCategoryAbout } from "@/lib/category-about";
import { t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

interface CategoryAboutCardProps {
  category: Category;
}

/** On-dashboard card — only the contractor's trade (e.g. paints for painters) */
export function CategoryAboutCard({ category }: CategoryAboutCardProps) {
  const { lang } = useLang();
  const content = getCategoryAbout(category);

  return (
    <div className="card-visual bg-white p-5">
      <div className="mb-4 flex items-center justify-center gap-3">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl text-white shadow-md"
          style={{ backgroundColor: category.color_hex }}
          aria-hidden
        >
          {content.icon}
        </span>
        <h2 className="text-2xl font-black text-gray-900">
          {t(lang, content.title.en, content.title.te)}
        </h2>
      </div>

      <p className="text-center text-lg font-semibold leading-relaxed text-gray-700">
        {t(lang, content.about.en, content.about.te)}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {content.products.map((p) => (
          <li
            key={p.en}
            className="flex flex-col items-center rounded-xl border-2 border-gray-100 bg-gray-50 p-3 text-center"
          >
            <span className="text-3xl" aria-hidden>
              {p.icon}
            </span>
            <span className="mt-1 text-sm font-bold text-gray-800">
              {t(lang, p.en, p.te)}
            </span>
          </li>
        ))}
      </ul>

      <p
        className="mt-4 rounded-xl p-3 text-center text-base font-black text-white"
        style={{ backgroundColor: category.color_hex }}
      >
        ★ {t(lang, content.shopPromise.en, content.shopPromise.te)}
      </p>
    </div>
  );
}
