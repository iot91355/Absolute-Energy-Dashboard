/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { clearGraphHistory } from '../redux/actions/extraActions';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import {
	changeSliderRange, selectChartToRender, selectHistoryIsDirty,
	selectSelectedGroups, selectSelectedMeters,
	selectSliderRangeInterval, updateTimeIntervalAndSliderRange
} from '../redux/slices/graphSlice';
import { selectTheme } from '../redux/slices/appStateSlice';
import HistoryComponent from './HistoryComponent';
import { ChartTypes } from '../types/redux/graph';
import { readingsApi } from '../redux/api/readingsApi';

/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function PlotNavComponent() {
	return (
		<div style={{
			width: 'auto',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-start',
			pointerEvents: 'none'
		}}>
			<div style={{ pointerEvents: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
				<HistoryComponent />
				<RefreshGraphComponent />
			</div>
		</div >
	);
}
export const TrashCanHistoryComponent = () => {
	const dispatch = useAppDispatch();
	const isDirty = useAppSelector(selectHistoryIsDirty);
	return (
		<span
			className={`material-symbols-rounded control-chip ${!isDirty ? 'disabled' : ''}`}
			style={{
				fontSize: '20px',
				visibility: isDirty ? 'visible' : 'hidden',
			}}
			onClick={() => { if (isDirty) dispatch(clearGraphHistory()); }}
		>
			{isDirty ? 'delete_forever' : 'delete'}
		</span>
	);
};

export const ExpandComponent = () => {
	const dispatch = useAppDispatch();
	return (
		<span
			className="material-symbols-rounded control-chip"
			style={{
				fontSize: '24px',
			}}
			onClick={() => { dispatch(changeSliderRange(TimeInterval.unbounded())); }}
		>
			fullscreen
		</span>
	);
};

export const RefreshGraphComponent = () => {
	const [time, setTime] = React.useState(0);
	const dispatch = useAppDispatch();
	const sliderInterval = useAppSelector(selectSliderRangeInterval);
	const somethingFetching = useAppSelector(selectAnythingFetching);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const chartType = useAppSelector(selectChartToRender);
	const iconVisible = chartType !== ChartTypes.threeD
		&& chartType !== ChartTypes.map
		&& chartType !== ChartTypes.compare
		&& chartType !== ChartTypes.radar
		&& (selectedMeters.length || selectedGroups.length);

	React.useEffect(() => {
		const interval = setInterval(() => { setTime(prevTime => (prevTime + 25) % 360); }, 16);
		if (!somethingFetching) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [somethingFetching]);
	// Auto-refresh hook
	React.useEffect(() => {
		if (!iconVisible) return;

		const refreshInterval = setInterval(() => {
			if (!somethingFetching) {
				const now = moment();
				const currentEnd = sliderInterval.getEndTimestamp();

				// Only roll the window if we have a bounded interval and we are currently looking at "Recent" data (within 5 mins of now)
				// This prevents the graph from jumping if the user is looking at historical data.
				if (currentEnd && Math.abs(now.diff(currentEnd)) < 5 * 60 * 1000) {
					if (sliderInterval.getIsBounded()) {
						const start = sliderInterval.getStartTimestamp()!;
						const duration = currentEnd.diff(start);

						// Create new Rolling Window ending at "Now"
						const nextEnd = now;
						const nextStart = now.clone().subtract(duration, 'ms');

						dispatch(updateTimeIntervalAndSliderRange(new TimeInterval(nextStart, nextEnd)));
					}
				} else {
					// Fallback for when we aren't rolling (just ensuring latest data if unbounded or manually refreshed)
					dispatch(readingsApi.util.invalidateTags(['Readings']));
				}
			}
		}, 10000); // 10 seconds

		return () => clearInterval(refreshInterval);
	}, [iconVisible, somethingFetching, sliderInterval, dispatch]);

	const theme = useAppSelector(selectTheme);
	const accentColor = theme === 'dark' ? '#00f2ea' : '#5E5CE6';

	return (
		<div
			className="control-chip"
			style={{ visibility: iconVisible ? 'visible' : 'hidden', display: 'flex', gap: '8px', alignItems: 'center', width: 'auto', padding: '0 8px' }}
			onClick={() => {
				if (!somethingFetching) {
					dispatch(readingsApi.util.invalidateTags(['Readings']));
				}
			}}
		>
			<span style={{ fontSize: '11px', fontWeight: 600, color: somethingFetching ? accentColor : 'inherit' }}>
				{somethingFetching ? 'REFRESHING...' : 'LIVE'}
			</span>
			<span
				className="material-symbols-rounded"
				style={{
					color: somethingFetching ? accentColor : 'inherit',
					transform: `rotate(${time}deg)`,
					transition: 'transform 0.1s linear'
				}}
			>
				refresh
			</span>
		</div>
	);
};
