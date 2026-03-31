/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectBarStacking } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import IntervalControlsComponent from './IntervalControlsComponent';
/**
 * @returns controls for bar page.
 */
export default function BarControlsComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();

	const barStacking = useAppSelector(selectBarStacking);

	const handleChangeBarStacking = () => {
		dispatch(graphSlice.actions.changeBarStacking());
	};

	return (
		<div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
			<div className='control-group'>
				<div className='checkbox' style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
					<label htmlFor='barStacking' className='control-label' style={{ margin: 0, cursor: 'pointer' }}>{translate('bar.stacking')}</label>
					<input type='checkbox' className="custom-checkbox" onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
					<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
				</div>
			</div>
			{<IntervalControlsComponent key='interval' />}
		</div >
	);
}