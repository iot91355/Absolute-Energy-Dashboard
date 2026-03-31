/* eslint-disable jsdoc/require-returns */
import * as React from 'react';
import Plot from 'react-plotly.js';
import 'plotly.js-dist-min';
import { getDashboardSettings } from '../hooks/useDashboardSettings';
import { useAppSelector } from '../redux/reduxHooks';
import { selectAllMeters } from '../redux/api/metersApi';
import { selectTheme } from '../redux/slices/appStateSlice';
import { useDashboardSettings } from '../hooks/useDashboardSettings';

// Fallback meters if no dashboard settings are configured
const FALLBACK_METERS = [
	{ id: 126, name: 'Absfloor2/30084_kWh1_(Imp)' },
	{ id: 132, name: 'Absfloor2/30086_kWh2_(Imp)' }
];

const COLORS = ['#5E5CE6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

/**
 *
 */
export default function SimpleLinePage() {
	const [data, setData] = React.useState<Partial<Plotly.PlotData>[]>([]);
	const [error, setError] = React.useState<string | null>(null);
	const [loaded, setLoaded] = React.useState(false);
	const allMeters = useAppSelector(selectAllMeters);
	const theme = useAppSelector(selectTheme);
	const isDarkMode = theme === 'dark';
	const { settings } = useDashboardSettings();

	const chartColors = React.useMemo(() => isDarkMode
		? ['#00f2ea', '#FF007F', '#FFCC00', '#5E5CE6', '#10B981']
		: COLORS, [isDarkMode]);
	const [rawData, setRawData] = React.useState<{ meter: any, readings: any[] }[]>([]);

	// Initial data load effect
	React.useEffect(() => {
		let meters: { id: number; name: string }[];

		if (settings.dashboardMeterIds.length > 0 && allMeters.length > 0) {
			const idSet = new Set(settings.dashboardMeterIds);
			meters = allMeters
				.filter(m => idSet.has(m.id))
				.map(m => ({
					id: m.id,
					name: m.identifier || m.name || `Meter #${m.id}`
				}));
		} else {
			meters = FALLBACK_METERS;
		}

		if (meters.length === 0) meters = FALLBACK_METERS;

		async function load() {
			try {
				const results = await Promise.allSettled(
					meters.map(m =>
						fetch(`/api/readings/line/raw/meter/${m.id}?timeInterval=all`).then(r => r.ok ? r.json() : null)
					)
				);

				const processedResults = meters.map((m, i) => {
					const result = results[i];
					return {
						meter: m,
						readings: (result.status === 'fulfilled' && Array.isArray(result.value)) ? result.value : []
					};
				});

				setRawData(processedResults);
				setLoaded(true);
			} catch (e: any) {
				setError(e.message ?? String(e));
				setLoaded(true);
			}
		}

		load();
	}, [allMeters, settings.dashboardMeterIds]);

	// Trace generation effect - responds immediately to theme changes
	React.useEffect(() => {
		if (rawData.length === 0) return;

		const traces: Partial<Plotly.PlotData>[] = rawData.map(({ meter, readings }, i) => {
			const x: string[] = [];
			const y: number[] = [];
			const days = settings.dashboardGraphDays || 1;
			const threshold = new Date();
			threshold.setUTCHours(0, 0, 0, 0);
			threshold.setUTCDate(threshold.getUTCDate() - days + 1);

			readings.forEach((r: any) => {
				const timestamp = r.e ?? r.end_timestamp ?? r.endTimestamp;
				const reading = r.r ?? r.reading;
				if (timestamp != null && reading != null) {
					const date = new Date(timestamp);
					if (date >= threshold) {
						x.push(date.toISOString());
						y.push(Number(reading));
					}
				}
			});

			return {
				x,
				y,
				type: 'scatter',
				mode: 'lines',
				line: {
					shape: 'linear',
					width: 2,
					color: chartColors[i % chartColors.length],
					dash: 'solid'
				},
				fill: 'tozeroy',
				fillcolor: chartColors[i % chartColors.length] + '1A',
				name: meter.name
			} as any;
		}).filter(t => (t.x as any[]).length > 0);

		setData(traces as Partial<Plotly.PlotData>[]);
	}, [rawData, chartColors, settings.dashboardGraphDays]);

	if (error) return <div>Error: {error}</div>;
	if (!loaded) return <div>Loading…</div>;
	if (data.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>No data available for the selected meters. Try selecting different meters in Settings.</div>;

	return (
		<Plot
			divId="dashboard-current-day-graph"
			data={data}
			layout={{
				font: { family: 'Inter, sans-serif', color: isDarkMode ? '#8b949e' : '#6B7280' },
				autosize: true,
				paper_bgcolor: 'transparent',
				plot_bgcolor: 'transparent',
				margin: { l: 40, r: 20, t: 20, b: 40 },
				xaxis: {
					type: 'date',
					automargin: true,
					showgrid: false,
					showline: false,
					tickfont: { color: isDarkMode ? '#8b949e' : '#9CA3AF', size: 12 }
				},
				yaxis: {
					automargin: true,
					gridcolor: isDarkMode ? '#21262d' : '#F3F4F6',
					zeroline: false,
					tickfont: { color: isDarkMode ? '#8b949e' : '#9CA3AF', size: 12 }
				},
				hovermode: 'x unified',
				hoverlabel: {
					bgcolor: isDarkMode ? '#161b22' : '#FFFFFF',
					bordercolor: isDarkMode ? '#30363d' : 'transparent',
					font: { family: 'Inter', size: 13, color: isDarkMode ? '#e6edf3' : '#111111' }
				},
				legend: {
					orientation: 'h',
					x: 0,
					y: 1.1,
					font: { color: isDarkMode ? '#e6edf3' : '#6B7280' }
				}
			}}
			useResizeHandler
			style={{ width: '100%', height: '350px' }}
			config={{ responsive: true, displayModeBar: 'hover', scrollZoom: true }}
		/>
	);
}
