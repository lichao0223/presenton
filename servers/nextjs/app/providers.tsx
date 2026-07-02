'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import { DisplayTranslator } from '@/i18n/DisplayTranslator';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n/translations';

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return <Provider store={store}>
    <I18nProvider initialLocale={initialLocale}>
      <DisplayTranslator />
      {children}
    </I18nProvider>
  </Provider>;
}
