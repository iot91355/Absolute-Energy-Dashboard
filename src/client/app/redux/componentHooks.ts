/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { selectInitComplete, selectSelectedLanguage } from './slices/appStateSlice';
import { selectCurrentUserRole, selectIsAdmin } from './slices/currentUserSlice';
import { useAppSelector } from './reduxHooks';
import localeData, { LocaleDataKey } from '../translations/data';
import { createIntlCache, createIntl, defineMessages } from 'react-intl';
import { useMemo } from 'react';

export const useWaitForInit = () => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const userRole = useAppSelector(selectCurrentUserRole);
	const initComplete = useAppSelector(selectInitComplete);
	return { isAdmin, userRole, initComplete };
};

// Overloads to support TS key completions
type TranslateFunction = {
	(messageID: LocaleDataKey): string;
	(messageID: string): string;
}

const cache = createIntlCache();

// usage
// const translate = useTranslate()
// translate('myKey')
export const useTranslate = () => {
	const lang = useAppSelector(selectSelectedLanguage);

	const translate = useMemo(() => {
		const messages = localeData[lang];
		const intl = createIntl({ locale: lang, messages }, cache);

		const translateFn: TranslateFunction = (messageID: LocaleDataKey | string) => {
			return intl.formatMessage(defineMessages({ [messageID]: { id: messageID } })[messageID]);
		};
		return translateFn;
	}, [lang]);

	return translate;
};
