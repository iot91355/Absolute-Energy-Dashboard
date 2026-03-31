/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, Popover, PopoverBody } from 'reactstrap';
import { useTranslate } from '../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectYMax, selectYMin, setYMax, setYMin } from '../redux/slices/graphSlice';

/**
 * Component to control the Y-Axis RangeMin/Max
 */
export default function YAxisRangeComponent() {
    const translate = useTranslate();
    const dispatch = useAppDispatch();
    const yMin = useAppSelector(selectYMin);
    const yMax = useAppSelector(selectYMax);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
        dispatch(setYMin(val));
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
        dispatch(setYMax(val));
    };

    // State to toggle popover
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const toggle = () => setPopoverOpen(!popoverOpen);

    return (
        <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
            <div
                id="yAxisPopover"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280', padding: '4px', borderRadius: '4px' }}
                title={translate('yaxis.range') || 'Y-Axis Range'}
                onClick={toggle}
            >
                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>unfold_more</span>
            </div>

            <Popover placement="bottom" isOpen={popoverOpen} target="yAxisPopover" toggle={toggle} trigger="legacy">
                <PopoverBody style={{ padding: '10px', minWidth: '150px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                        {translate('yaxis.range') || 'Y-Axis Range'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>{translate('min') || 'Min'}</span>
                            <Input
                                type="number"
                                bsSize="sm"
                                value={yMin ?? ''}
                                onChange={handleMinChange}
                                placeholder="Auto"
                                style={{ width: '80px', height: '28px', fontSize: '12px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>{translate('max') || 'Max'}</span>
                            <Input
                                type="number"
                                bsSize="sm"
                                value={yMax ?? ''}
                                onChange={handleMaxChange}
                                placeholder="Auto"
                                style={{ width: '80px', height: '28px', fontSize: '12px' }}
                            />
                        </div>
                        {(yMin !== undefined || yMax !== undefined) && (
                            <div
                                style={{ fontSize: '11px', color: '#3B82F6', cursor: 'pointer', textAlign: 'right', marginTop: '4px' }}
                                onClick={() => {
                                    dispatch(setYMin(undefined));
                                    dispatch(setYMax(undefined));
                                }}
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
