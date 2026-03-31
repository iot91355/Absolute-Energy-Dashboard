/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ChartTypes } from '../types/redux/graph';
import MeterAndGroupSelectComponent from './MeterAndGroupSelectComponent';
import UnitSelectComponent from './UnitSelectComponent';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender, selectQueryTimeInterval } from '../redux/slices/graphSlice';
import DateRangeComponent from './DateRangeComponent';

/**
 * A component which allows the user to select which data should be displayed on the chart.
 * @returns Chart data select element
 */
export default function ChartDataSelectComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const queryTimeInterval = useAppSelector(selectQueryTimeInterval);
	const isHalfBounded = queryTimeInterval.getIsHalfBounded();
	const isBounded = queryTimeInterval.getIsBounded();
	const visibleDateRange = isHalfBounded || isBounded;

	return (
		<div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
			<div className='control-group' style={{ flex: '1 1 auto', minWidth: '150px', maxWidth: '400px' }}>
				<MeterAndGroupSelectComponent />
			</div>
			<div className='control-group' style={{ flexShrink: 0 }}>
				<UnitSelectComponent />
			</div>
			{(visibleDateRange && chartToRender !== ChartTypes.threeD && chartToRender !== ChartTypes.compareLine) && (
				<div className='control-group' style={{ flexShrink: 0 }}>
					<DateRangeComponent />
				</div>
			)}
		</div>
	);
}