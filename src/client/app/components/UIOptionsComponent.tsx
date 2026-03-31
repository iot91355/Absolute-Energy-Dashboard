/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ReactTooltip from 'react-tooltip';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import BarControlsComponent from './BarControlsComponent';
import ChartDataSelectComponent from './ChartDataSelectComponent';
import ChartSelectComponent from './ChartSelectComponent';
import CompareControlsComponent from './CompareControlsComponent';
import DateRangeComponent from './DateRangeComponent';
import MapControlsComponent from './MapControlsComponent';
// ReadingsPerDaySelectComponent removed — 3D option disabled
import MoreOptionsComponent from './MoreOptionsComponent';
import CompareLineControlsComponent from './CompareLineControlsComponent';
import YAxisRangeComponent from './YAxisRangeComponent';
import RadarRotationComponent from './RadarRotationComponent';
import './uiControls.css';

/**
 * @returns the UI Control panel
 */
export default function UIOptionsComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	// const selectedMeters = useAppSelector(selectSelectedMeters);
	// const selectedGroups = useAppSelector(selectSelectedGroups);
	// const optionsRef = React.useRef<HTMLDivElement>(null);

	ReactTooltip.rebuild();
	return (
		<div className='ui-options-bar'>
			<ReactTooltip event='custom-event' className='tip' id='select-tooltips' />
			<div className='control-group'><ChartSelectComponent /></div>
			<div className='control-group' style={{ flexGrow: 0.5 }}><ChartDataSelectComponent /></div>

			{/* UI options for line graphic */}
			{chartToRender == ChartTypes.line && <div style={{ flex: '0 0 auto' }}><YAxisRangeComponent /></div>}

			{/* UI options for bar graphic */}
			{chartToRender == ChartTypes.bar && <div style={{ flex: '0 0 auto' }}><BarControlsComponent /></div>}

			{/* UI options for compare graphic */}
			{chartToRender == ChartTypes.compare && <div style={{ flex: '0 0 auto' }}><CompareControlsComponent /></div>}

			{/* UI options for map graphic */}
			{chartToRender == ChartTypes.map && <div style={{ flex: '0 0 auto' }}><MapControlsComponent /></div>}

			{/* 3D graphic option removed */}

			{/* UI options for radar graphic */}
			{/* UI options for radar graphic */}
			{chartToRender == ChartTypes.radar && (
				<div style={{ flex: '0 0 auto', display: 'flex' }}>
					<YAxisRangeComponent />
					<RadarRotationComponent />
				</div>
			)}

			{	/* Controls specific to the compare line chart */}
			{chartToRender === ChartTypes.compareLine && <div style={{ flex: '0 0 auto' }}><DateRangeComponent /></div>}
			{chartToRender === ChartTypes.compareLine && <div style={{ flex: '0 0 auto' }}><CompareLineControlsComponent /></div>}

			<div style={{ flex: '0 0 auto', marginLeft: 'auto' }}><MoreOptionsComponent /></div>

		</div>
	);
}
