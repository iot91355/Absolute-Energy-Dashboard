/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectUnitSelectData } from '../redux/selectors/uiSelectors';
import { GroupedOption, SelectOption } from '../types/items';
// import TooltipMarkerComponent from './TooltipMarkerComponent';
// import { FormattedMessage } from 'react-intl';
import { Badge } from 'reactstrap';
import { graphSlice, selectSelectedUnit } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { selectUnitDataById, unitsApi } from '../redux/api/unitsApi';

/**
 * @returns A React-Select component for UI Options Panel
 */
export default function UnitSelectComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const unitSelectOptions = useAppSelector(selectUnitSelectData);
	const selectedUnitID = useAppSelector(selectSelectedUnit);
	const unitsByID = useAppSelector(selectUnitDataById);

	const { isFetching: unitsIsFetching } = unitsApi.endpoints.getUnitsDetails.useQueryState();

	// Build the selected option based on current Redux state
	const selectedUnitOption: SelectOption | null = (selectedUnitID !== -99 && unitsByID[selectedUnitID])
		? {
			label: unitsByID[selectedUnitID].identifier,
			value: selectedUnitID,
			isDisabled: false
		}
		: null;

	const onChange = (newValue: SelectOption | null) => {
		if (newValue && newValue.value !== undefined) {
			console.log('Unit onChange fired - new value:', newValue.value);
			dispatch(graphSlice.actions.updateSelectedUnit(newValue.value as number));
		} else {
			console.log('Unit cleared');
			dispatch(graphSlice.actions.updateSelectedUnit(undefined as any));
		}
	};

	// eslint-disable-next-line max-len
	return (
		<div className="control-group">
			<div className="control-label">
				{translate('units')}
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.units' />
			</div>
			<div style={{ width: '150px' }}>
				<Select<SelectOption, false, GroupedOption>
					inputId="unit-select"
					value={selectedUnitOption}
					options={unitSelectOptions}
					placeholder={translate('select.unit')}
					onChange={onChange}
					formatGroupLabel={formatGroupLabel}
					isClearable
					isLoading={unitsIsFetching}
					menuPlacement="auto"
					classNamePrefix="react-select"
					menuPortalTarget={document.body}
					menuPosition="fixed"
					styles={{
						menuPortal: (base) => ({ ...base, zIndex: 9999 })
					}}
				/>
			</div>
		</div>
	);
}

const formatGroupLabel = (data: GroupedOption) => {
	return (
		< div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
			<span>{data.label}</span>
			<Badge pill color="primary">{data.options.length}</Badge>
		</div >

	);
};


