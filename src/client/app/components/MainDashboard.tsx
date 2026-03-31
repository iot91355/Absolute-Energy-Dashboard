/* eslint-disable jsdoc/require-returns */
import './dashboard.css';
import SimpleLinePage from './SimpleLinePage';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import * as React from 'react';
import { useAppSelector } from '../redux/reduxHooks';
import { selectAllMeters, metersApi } from '../redux/api/metersApi';
import { useDashboardSettings } from '../hooks/useDashboardSettings';
import { getDeviceFromIdentifier } from '../utils/meterUtils';
import { MeterData } from '../types/redux/meters';
import { selectTheme } from '../redux/slices/appStateSlice';

interface DeviceGroupProps {
	device: string;
	deviceMeters: MeterData[];
	isExpanded: boolean;
	onToggle: (device: string) => void;
}

const DeviceGroup = React.memo(({ device, deviceMeters, isExpanded, onToggle }: DeviceGroupProps) => {
	return (
		<div className="device-group-container">
			<div
				className="device-group-header"
				onClick={() => onToggle(device)}
			>
				<div className="device-info">
					<span className={`material-symbols-rounded expand-icon ${isExpanded ? 'expanded' : ''}`}>
						chevron_right
					</span>
					<span className="material-symbols-rounded device-icon">
						router
					</span>
					<h1 className="device-name">{device}</h1>
				</div>
				<div className="device-count">
					<span>{deviceMeters.length} Telemetry</span>
				</div>
			</div>
			{isExpanded && (
				<div className="device-meters-list show">
					{deviceMeters.map(meter => (
						<div className="meter-status-info" key={meter.id}>
							<div className="meter-stat">
								<div className="stat-icon">
									<span className="material-symbols-rounded" style={{ color: meter.enabled ? '#059669' : '#9CA3AF' }}>
										{meter.enabled ? 'check_circle' : 'cancel'}
									</span>
								</div>
								<div className="stat-heading">
									<h1>{meter.name || meter.identifier}</h1>
									<p>{meter.enabled ? 'Active' : 'Inactive'}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
});

DeviceGroup.displayName = 'DeviceGroup';


export type DashboardStats = {
	totalKwh: string;
	currentDemand: string;
	demandTrend: 'up' | 'down';
	loadUtil: string;
	energyBudget: string;
	powerFactor: string;
};

export default function DashboardComponents() {
	// Ensure meters are fetched
	metersApi.useGetMetersQuery();

	const allMeters = useAppSelector(selectAllMeters);
	const { settings } = useDashboardSettings();
	const sidebarCollapsed = useAppSelector(state => state.appState.sidebarCollapsed);
	const theme = useAppSelector(selectTheme);
	const isDarkMode = theme === 'dark';
	
	const [stats, setStats] = React.useState<DashboardStats>({
		totalKwh: '0.00',
		currentDemand: '0.00',
		demandTrend: 'up',
		loadUtil: '0.0',
		energyBudget: '0.0',
		powerFactor: '1.000'
	});

	React.useEffect(() => {
		const fetchStats = async () => {
			try {
				// Get the active tariff (latest entry by effectiveDate)
				const rateHistory = settings.rateHistory ?? [];
				const activeTariff = rateHistory.length > 0
					? [...rateHistory].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]
					: null;
				const contractDemand = activeTariff?.contractDemand ?? 100;
				const energyBudgetKwh = settings.energyBudgetKwh ?? 0;

				const params = new URLSearchParams();
				if (settings.totalKwhMeterIds && settings.totalKwhMeterIds.length > 0) {
					params.set('meters', settings.totalKwhMeterIds.join(','));
				}
				if (settings.currentDemandMeterIds && settings.currentDemandMeterIds.length > 0) {
					params.set('demandMeters', settings.currentDemandMeterIds.join(','));
				}
				params.set('contractDemand', String(contractDemand));
				params.set('energyBudgetKwh', String(energyBudgetKwh));

				const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
				if (res.ok) {
					const data = await res.json();
					setStats(data);
				}
			} catch (err) {
				console.error('Error fetching dashboard stats', err);
			}
		};
		fetchStats();
		const interval = setInterval(fetchStats, 10000); // 10s refresh
		return () => clearInterval(interval);
	}, [settings.totalKwhMeterIds, settings.currentDemandMeterIds, settings.rateHistory, settings.energyBudgetKwh]);

	// ✅ Trigger window resize when sidebar toggles to refresh graphs
	React.useEffect(() => {
		const timer = setTimeout(() => {
			window.dispatchEvent(new Event('resize'));
		}, 350); // Slightly more than the 300ms transition
		return () => clearTimeout(timer);
	}, [sidebarCollapsed]);

	const filteredMeters = React.useMemo(() => {
		if (!allMeters) return [];
		let meters = allMeters.filter(m => m.enabled);
		// If meter status meters are configured in settings, filter to those
		if (settings.meterStatusMeterIds.length > 0) {
			const statusSet = new Set(settings.meterStatusMeterIds);
			meters = meters.filter(m => statusSet.has(m.id));
		}
		return meters.slice(0, 1000); // Limit to 1000 for performance
	}, [allMeters, settings.meterStatusMeterIds]);

	const [expandedDevices, setExpandedDevices] = React.useState<Record<string, boolean>>({});

	const toggleDevice = (device: string) => {
		setExpandedDevices(prev => ({
			...prev,
			[device]: !prev[device]
		}));
	};

	const groupedMeters = React.useMemo(() => {
		const groups: Record<string, typeof filteredMeters> = {};
		filteredMeters.forEach(meter => {
			const device = getDeviceFromIdentifier(meter.identifier);
			if (!groups[device]) groups[device] = [];
			groups[device].push(meter);
		});
		return groups;
	}, [filteredMeters]);

	return (
		<main>
			<div className="main-grids">
				<div className="grid-item">
					<div className="total-head" >
						<div className="total-topic">
							<div className="readin-headin">
								<div className="total-head-1">
									<span className="material-symbols-rounded">
										insights
									</span>
									<h1>Total kWh Usage</h1>
								</div>
								<div className="total-status">
									<div className="total-status-stat">
										<span className="material-symbols-rounded status-icon">
											trending_up
										</span>
										<span className="status-text">Live</span>
									</div>
								</div>
							</div>
							<div className="readin-total">
								<div className="today-total">
									<p className="today-total">{stats.totalKwh} <span style={{ fontSize: '0.6em', fontWeight: 500, letterSpacing: 0 }}>kWh</span></p>
								</div>
								<div className="yesterday-total">
									<p className="total-readin">Cumulative</p>
									<p className="total-date">Across all meters</p>
								</div>
							</div>
						</div>
					</div>
					<div className="load-utilization">
						<div className="load-util">
							<div className="load-heading">
								<div className="load-icon">
									<span className="material-symbols-rounded">
										bolt
									</span>
									<h1>Power Factor</h1>
								</div>
								{/* Color coding logic: Green > 0.95, Red < 0.9, Theme otherwise */}
								<div className="load-status" style={{ 
									background: parseFloat(stats.powerFactor) > 0.95 
										? 'rgba(16, 185, 129, 0.15)' 
										: parseFloat(stats.powerFactor) < 0.9 
											? 'rgba(239, 68, 68, 0.15)' 
											: 'rgba(255, 0, 127, 0.15)', // Theme Pink
									color: parseFloat(stats.powerFactor) > 0.95 
										? '#10b981' 
										: parseFloat(stats.powerFactor) < 0.9 
											? '#ef4444' 
											: '#FF007F' // Theme Pink
								}}>
									<span className="material-symbols-rounded status-icon" style={{ 
										color: parseFloat(stats.powerFactor) > 0.95 ? '#10b981' : parseFloat(stats.powerFactor) < 0.9 ? '#ef4444' : '#FF007F' 
									}}>
										{parseFloat(stats.powerFactor) > 0.95 ? 'verified' : parseFloat(stats.powerFactor) < 0.9 ? 'warning' : 'info'}
									</span>
									<span className="status-text">
										{parseFloat(stats.powerFactor) > 0.95 ? 'Excellent' : parseFloat(stats.powerFactor) < 0.9 ? 'Poor' : 'Good'}
									</span>
								</div>
							</div>
							<div className="load-prog-ring" style={{ width: '160px', maxWidth: '100%', margin: '16px auto' }}>
								<CircularProgressbar
									value={parseFloat(stats.powerFactor) * 100}
									text={stats.powerFactor}
									strokeWidth={10}
									styles={{
										text: {
											fontSize: '22px',
											fontWeight: '700',
											fill: isDarkMode ? '#FF007F' : '#393185'
										},
										path: {
											stroke: isDarkMode ? '#FF007F' : '#393185',
											transition: 'stroke-dashoffset 0.8s ease 0s'
										},
										trail: {
											stroke: 'var(--gauge-bg)'
										}
									}}
								/>
							</div>
							<div className="load-line"></div>
							<div className="load-text">
								<p>Real-time efficiency monitor (kWh/kVAh)</p>
							</div>
						</div>
					</div>
					<div className="energy-budget">
						<div className="energy-util">
							<div className="energy-heading">
								<div className="energy-icon">
									<span className="material-symbols-rounded">
										finance
									</span>
									<h1 className="energy-head">Energy Budget</h1>
								</div>
								<div className="energy-status" style={{ background: parseFloat(stats.energyBudget) >= 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
									<span className="material-symbols-rounded status-icon" style={{ color: parseFloat(stats.energyBudget) >= 80 ? '#ef4444' : '#10b981' }}>
										{parseFloat(stats.energyBudget) >= 80 ? 'trending_up' : 'trending_flat'}
									</span>
									<span className="energy-status-text" style={{ color: parseFloat(stats.energyBudget) >= 80 ? '#ef4444' : '#10b981' }}>
										{parseFloat(stats.energyBudget) >= 80 ? 'High' : 'Normal'}
									</span>
								</div>
							</div>
							<div className="energy-prog-ring" style={{ width: '160px', maxWidth: '100%', margin: '16px auto' }}>
								<CircularProgressbar
									value={parseFloat(stats.energyBudget)}
									text={`${parseFloat(stats.energyBudget).toFixed(0)}%`}
									strokeWidth={10}
									styles={{
										text: {
											fontSize: '22px',
											fontWeight: '700',
											fill: 'var(--energy-budget-color)'
										},
										path: {
											stroke: 'var(--energy-budget-color)',
											transition: 'stroke-dashoffset 0.8s ease 0s'
										},
										trail: {
											stroke: 'var(--gauge-bg)'
										}
									}}
								/>
							</div>
							<div className="energy-line"></div>
							<div className="energy-text">
								<p>Energy Budget limit</p>
							</div>
						</div>
					</div>
					<div className="meter-status">
						<div className="meter-body">
							<div className="meter-heading">
								<div className="meter-head-text">
									<div className="meter-icon">
										<span className="material-symbols-rounded">
											router
										</span>
									</div> 
									<h1 className="meter-head">Devices</h1>
								</div>
								<div className="energy-status">
									<span className="material-symbols-rounded status-icon">
										electric_bolt
									</span>
									<span className="energy-status-text">
										{allMeters ? allMeters.filter(m => m.enabled).length : 0} Active Telemetry
									</span>
								</div>

							</div>
							<div className="meter-list-container" style={{ overflowY: 'auto', flex: 1 }}>
								{Object.entries(groupedMeters).map(([device, deviceMeters]) => (
									<DeviceGroup
										key={device}
										device={device}
										deviceMeters={deviceMeters}
										isExpanded={!!expandedDevices[device]}
										onToggle={toggleDevice}
									/>
								))}
								{filteredMeters.length === 0 && (
									<div className="meter-status-info">
										<div className="meter-stat">
											<p style={{ padding: '10px', color: '#6B7280' }}>No devices found.</p>
										</div>
									</div>
								)}
							</div>

						</div>
					</div>
					<div className="peak-demand total-head" style={{ gridArea: 'peak' }}>
						<div className="total-topic">
							<div className="readin-headin">
								<div className="total-head-1">
									<span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
										speed
									</span>
									<h1 style={{ fontSize: '14px', fontWeight: 500 }}>Current Demand</h1>
								</div>
								<div className="total-status">
									<div className="total-status-stat" style={{ 
										background: stats.demandTrend === 'up' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
										color: stats.demandTrend === 'up' ? '#ef4444' : '#10b981'
									}}>
										<span className="material-symbols-rounded status-icon">
											{stats.demandTrend === 'up' ? 'trending_up' : 'trending_down'}
										</span>
										<span className="status-text">{stats.demandTrend === 'up' ? 'Rising' : 'Falling'}</span>
									</div>
								</div>
							</div>
							<div className="readin-total">
								<div className="today-total">
									<p className="today-total" style={{ color: isDarkMode ? '#FF007F' : '#111111' }}>
										{stats.currentDemand} <span style={{ fontSize: '0.6em', fontWeight: 500, letterSpacing: 0, color: '#8b949e' }}>kW</span>
									</p>
								</div>
								<div className="yesterday-total">
									<p className="total-date" style={{ color: '#8b949e' }}>Most Recent Reading Interval</p>
								</div>
							</div>
						</div>
					</div>
					<div className="energy-consumption-graph">
						<div className="energy-body">
							<div className="energy-graph-heading">
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span className="material-symbols-rounded">electric_bolt</span>
							<h1 style={{ margin: 0 }}>Energy Consumption</h1>
						</div>
								{/* <div className="energy-graph-values">
									<div className="graph-v1">
										<div className="value-color-1"></div>
										<div className="value-name"><p>Absfloor2/30084_kWh1</p></div>
									</div>
									<div className="graph-v1">
										<div className="value-color-2"></div>
										<div className="value-name"><p>Absfloor2/30084_kWh1</p></div>
									</div>
								</div> */}
								<div className="energy-graph-stat">
									<div className="energy-graph-cont">
										<div className="live-icon"></div>
										<div className="live-text"><p>Live</p></div>
									</div>
								</div>
							</div>
							{/* <EnergyGraph /> */}
						</div>
						<div
							className="energy-graph-wrapper"
							style={{
								marginLeft: 0,
								position: 'relative',
								borderRadius: 40,
								zIndex: 0,
								marginTop: 0,
								overflow: 'hidden'
							}}
						>
							<SimpleLinePage />
						</div>
					</div>
				</div>
			</div>
		</main>
	);

}
