/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectForwardHistory, selectPrevHistory } from '../redux/slices/graphSlice';
import { historyStepBack, historyStepForward } from '../redux/actions/extraActions';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import '../components/dashboard.css';

/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function HistoryComponent() {
	const dispatch = useAppDispatch();
	const backStack = useAppSelector(selectPrevHistory);
	const forwardStack = useAppSelector(selectForwardHistory);

	return (
		<div style={{ display: 'flex', gap: '4px', alignItems: 'center', pointerEvents: 'auto' }}>
			{/* Back Button */}
			<div
				className={`control-chip ${!backStack.length ? 'disabled' : ''}`}
				onClick={() => { if (backStack.length) dispatch(historyStepBack()); }}
			>
				<span className="material-symbols-rounded">chevron_left</span>
			</div>
			{/* Forward Button */}
			<div
				className={`control-chip ${!forwardStack.length ? 'disabled' : ''}`}
				onClick={() => { if (forwardStack.length) dispatch(historyStepForward()); }}
			>
				<span className="material-symbols-rounded">chevron_right</span>
			</div>
			{/* Help */}
			{(backStack.length > 0 || forwardStack.length > 0) && (
				<div className="control-chip" style={{ marginLeft: '4px' }}>
					<TooltipMarkerComponent page='home' helpTextId={'help.home.history'} />
				</div>
			)}
		</div>
	);
}