/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'oed_dashboard_settings';

export interface DashboardMeterConfig {
	id: number;
	name: string;
}

export interface TariffRateConfig {
	effectiveDate: string;
	energyRate: number;
	demandChargeRate: number;
	wheelingRate: number;
	facRate: number;
	electricityDuty: number;
	taxOnSale: number;
	contractDemand: number;
	tariffCategory: string;
	billedDemand: number;
}

/** Time-of-Day rate slots (Offset from base rate in ₹/kWh, can be negative) */
export interface TodRates {
	/** 22:00 – 06:00 (off-peak / night) */
	slot_2206: number;
	/** 06:00 – 09:00 (morning shoulder) */
	slot_0609: number;
	/** 09:00 – 12:00 (morning peak) */
	slot_0912: number;
	/** 12:00 – 18:00 (afternoon peak) */
	slot_1218: number;
	/** 18:00 – 22:00 (evening peak) */
	slot_1822: number;
}

export interface DashboardSettings {
	dashboardMeterIds: number[];
	meterStatusMeterIds: number[];
	totalKwhMeterIds: number[];
	currentDemandMeterIds: number[];
	defaultAddress?: string;
	defaultActivity?: string;
	reportMeterId?: number | null;
	reportKvahMeterId?: number | null;
	dashboardGraphDays?: number;
	rateHistory?: TariffRateConfig[];
	energyBudgetKwh?: number;
	/** Time-of-Day energy rates (Offset from base rate in ₹/kWh) */
	todRates?: TodRates;
}

const defaultSettings: DashboardSettings = {
	dashboardMeterIds: [],
	meterStatusMeterIds: [],
	totalKwhMeterIds: [],
	currentDemandMeterIds: [],
	defaultAddress: '',
	defaultActivity: '',
	reportMeterId: null,
	reportKvahMeterId: null,
	dashboardGraphDays: 1,
	energyBudgetKwh: 0,
	todRates: {
		slot_2206: 0.00,
		slot_0609: 0.00,
		slot_0912: -1.94,
		slot_1218: 0.00,
		slot_1822: -1.94
	},
	rateHistory: [{
		effectiveDate: '2000-01-01',
		energyRate: 7.76,
		demandChargeRate: 400,
		wheelingRate: 1.39,
		facRate: 0.30,
		electricityDuty: 7.5,
		taxOnSale: 0.29,
		contractDemand: 100,
		tariffCategory: 'Industrial (LT-V B II)',
		billedDemand: 8
	}]
};

function loadSettings(): DashboardSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				dashboardMeterIds: parsed.dashboardMeterIds ?? [],
				meterStatusMeterIds: parsed.meterStatusMeterIds ?? [],
				totalKwhMeterIds: parsed.totalKwhMeterIds ?? [],
				currentDemandMeterIds: parsed.currentDemandMeterIds ?? [],
				defaultAddress: parsed.defaultAddress ?? '',
				defaultActivity: parsed.defaultActivity ?? '',
				reportMeterId: parsed.reportMeterId ?? null,
				reportKvahMeterId: parsed.reportKvahMeterId ?? null,
				dashboardGraphDays: parsed.dashboardGraphDays ?? 1,
				energyBudgetKwh: parsed.energyBudgetKwh ?? 0,
				todRates: parsed.todRates ?? defaultSettings.todRates,
				rateHistory: parsed.rateHistory ?? defaultSettings.rateHistory
			};
		}
	} catch {
		// ignore parse errors
	}
	return { ...defaultSettings };
}

function saveSettings(settings: DashboardSettings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// ignore storage errors
	}
}

/**
 * Hook to read and write dashboard settings from localStorage.
 * Settings include which meters appear on the main dashboard chart
 * and which meters appear in the meter status widget.
 */
export function useDashboardSettings() {
	const [settings, setSettings] = useState<DashboardSettings>(loadSettings);

	// Sync state if another tab changes localStorage
	useEffect(() => {
		const handler = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) {
				setSettings(loadSettings());
			}
		};
		window.addEventListener('storage', handler);
		return () => window.removeEventListener('storage', handler);
	}, []);

	const updateSettings = useCallback((partial: Partial<DashboardSettings>) => {
		setSettings(prev => {
			const next = { ...prev, ...partial };
			saveSettings(next);
			return next;
		});
	}, []);

	return { settings, updateSettings };
}

/**
 * Standalone getter for components that don't need reactivity (e.g., initial load in useEffect).
 */
export function getDashboardSettings(): DashboardSettings {
	return loadSettings();
}
