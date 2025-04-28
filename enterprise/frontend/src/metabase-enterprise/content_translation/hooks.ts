import { useCallback } from "react";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";
import type { ContentTranslationFunction } from "metabase/i18n/types";

import { translateContentString } from "./utils";

export const useTranslateContent = (): ContentTranslationFunction => {
  const locale = useLocale();

  const { data } = useListContentTranslationsQuery({
    locale,
  });
  const dictionary = data?.data;

  return useCallback(
    (msgid: any) => translateContentString(dictionary, locale, msgid),
    [locale, dictionary],
  );
};
