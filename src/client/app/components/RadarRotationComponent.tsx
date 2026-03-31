/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, Popover, PopoverBody } from 'reactstrap';
import { useTranslate } from '../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartRotation, setChartRotation } from '../redux/slices/graphSlice';

/**
 * Component to control the Radar Chart Rotation (Angular Origin)
 */
export default function RadarRotationComponent() {
    const translate = useTranslate();
    const dispatch = useAppDispatch();
    const chartRotation = useAppSelector(selectChartRotation) ?? 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        dispatch(setChartRotation(val));
    };

    // State to toggle popover
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const toggle = () => setPopoverOpen(!popoverOpen);

    return (
        <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
            <div
                id="radarRotationPopover"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280', padding: '4px', borderRadius: '4px' }}
                title={translate('radar.rotation') || 'Rotation'}
                onClick={toggle}
            >
                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>rotate_right</span>
            </div>

            <Popover placement="bottom" isOpen={popoverOpen} target="radarRotationPopover" toggle={toggle} trigger="legacy">
                <PopoverBody style={{ padding: '10px', minWidth: '200px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                        {translate('radar.rotation') || 'Rotation'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Input
                                type="range"
                                min="0"
                                max="360"
                                value={chartRotation}
                                onChange={handleChange}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
                            <span>0°</span>
                            <span style={{ fontWeight: 600 }}>{chartRotation}°</span>
                            <span>360°</span>
                        </div>
                        {chartRotation !== 0 && (
                            <div
                                style={{ fontSize: '11px', color: '#3B82F6', cursor: 'pointer', textAlign: 'right', marginTop: '4px' }}
                                onClick={() => dispatch(setChartRotation(0))}
                            >
                                {translate('reset') || 'Reset'}
                            </div>
                        )}
                    </div>
                </PopoverBody>
            </Popover>
        </div>
    );
}
