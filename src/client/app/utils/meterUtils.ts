/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Extracts the device name from a meter identifier.
 * For identifiers like "EM1/kWh_Import", the device is "EM1".
 * For identifiers without a "/", the device is "Other".
 */
export function getDeviceFromIdentifier(identifier: string): string {
	if (!identifier) return 'Other';
	const slashIndex = identifier.indexOf('/');
	if (slashIndex > 0) {
		return identifier.substring(0, slashIndex);
	}
	return 'Other';
}
