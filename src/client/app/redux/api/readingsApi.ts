/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Removed internal caching dependencies (omit, difference)
import {
	BarReadingApiArgs,
	CompareReadingApiArgs,
	LineReadingApiArgs,
	RadarReadingApiArgs,
	ThreeDReadingApiArgs
} from '../selectors/chartQuerySelectors';
import { RootState } from '../../store';
import { BarReadings, CompareReadings, LineReadings, ThreeDReading } from '../../types/readings';
import { baseApi } from './baseApi';

export const readingsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		threeD: builder.query<ThreeDReading, ThreeDReadingApiArgs>({
			// ThreeD requests only single meters at a time which plays well with default cache behavior
			// No other properties are necessary for this endpoint
			// Refer to the line endpoint for an example of an endpoint with custom cache behavior
			query: ({ id, timeInterval, graphicUnitId, readingInterval, meterOrGroup }) => ({
				// destructure args that are passed into the callback, and generate/ implicitly return the API url for the request.
				url: `api/unitReadings/threeD/${meterOrGroup}/${id}`,
				params: { timeInterval, graphicUnitId, readingInterval }
			}),
			providesTags: ['Readings']
		}),
		line: builder.query<LineReadings, LineReadingApiArgs>({
			queryFn: async (args, _queryApi, _extra, baseQuery) => {
				const { ids, timeInterval, graphicUnitId, meterOrGroup } = args;
				const idsToFetch = ids.join(',');

				if (!idsToFetch) {
					return { data: {} as LineReadings };
				}

				const { data, error } = await baseQuery({
					url: `api/unitReadings/line/${meterOrGroup}/${idsToFetch}`,
					params: { timeInterval, graphicUnitId }
				});

				return error ? { error } : { data: data as LineReadings };
			},
			providesTags: ['Readings']
		}),
		bar: builder.query<BarReadings, BarReadingApiArgs>({
			keepUnusedDataFor: 30,
			queryFn: async (args, _queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const idsToFetch = ids.join(',');
				if (!idsToFetch) {
					return { data: {} as BarReadings };
				}
				const { data, error } = await baseQuery({ url: `api/unitReadings/bar/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as BarReadings };
			},
			providesTags: ['Readings']
		}),
		compare: builder.query<CompareReadings, CompareReadingApiArgs>({
			queryFn: async (args, _queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const idsToFetch = ids.join(',');
				if (!idsToFetch) {
					return { data: {} as CompareReadings };
				}
				const { data, error } = await baseQuery({ url: `/api/compareReadings/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as CompareReadings };
			},
			providesTags: ['Readings']
		}),
		radar: builder.query<LineReadings, RadarReadingApiArgs>({
			queryFn: async (args, _queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const idsToFetch = ids.join(',');
				if (!idsToFetch) {
					return { data: {} as LineReadings };
				}
				const { data, error } = await baseQuery({ url: `api/unitReadings/radar/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as LineReadings };
			},
			providesTags: ['Readings']
		})

	})
});

// Stable reference for when there is not data. Avoids rerenders.
export const stableEmptyLineReadings: LineReadings = {};
export const stableEmptyBarReadings: BarReadings = {};
export const stableEmptyThreeDReadings: ThreeDReading = {
	xData: [],
	yData: [],
	zData: []
};
