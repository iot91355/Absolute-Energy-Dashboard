CREATE OR REPLACE FUNCTION meter_bar_readings_unit (
	meter_ids INTEGER[],
	graphic_unit_id INTEGER,
	bar_width_minutes INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP
)
RETURNS TABLE(
	meter_id INTEGER,
	reading FLOAT,
	start_timestamp TIMESTAMP,
	end_timestamp TIMESTAMP
)
AS $$
DECLARE
	bar_width INTERVAL;
	real_tsrange TSRANGE;
	real_start_stamp TIMESTAMP;
	real_end_stamp TIMESTAMP;
	num_bars INTEGER;
BEGIN
	-- Bar width based on MINUTES
	bar_width := bar_width_minutes * INTERVAL '1 minute';

	-- Clamp requested range to real reading bounds
	real_tsrange := shrink_tsrange_to_real_readings(
		tsrange(start_stamp, end_stamp, '[]'),
		meter_ids
	);

	-- Prevent empty query
	IF isempty(real_tsrange) THEN
		RETURN;
	END IF;

	-- Align to start minute boundaries
	real_start_stamp := date_trunc('hour', lower(real_tsrange)) + 
		floor((extract(minute from lower(real_tsrange)) / bar_width_minutes)) * bar_width_minutes * INTERVAL '1 minute';

	-- Allow current bucket (but not future)
	real_end_stamp := date_trunc('hour', LEAST(upper(real_tsrange), NOW())) + 
		ceil((extract(minute from LEAST(upper(real_tsrange), NOW())) / bar_width_minutes)) * bar_width_minutes * INTERVAL '1 minute';

	-- Number of full bars
	num_bars := floor(
		extract(EPOCH FROM (real_end_stamp - real_start_stamp))
		/ extract(EPOCH FROM bar_width)
	);

	-- Align bars to the end (keep most recent data)
	real_start_stamp := real_end_stamp - (num_bars * bar_width);

	RETURN QUERY
	SELECT
		r.meter_id,
		AVG(r.reading) * c.slope + c.intercept AS reading,
		bars.interval_start AS start_timestamp,
		bars.interval_start + bar_width AS end_timestamp
	FROM readings r
	INNER JOIN generate_series(
		real_start_stamp,
		real_end_stamp - bar_width,
		bar_width
	) bars(interval_start)
		-- Must happen exactly within the interval window
		ON r.start_timestamp >= bars.interval_start AND r.start_timestamp < bars.interval_start + bar_width
	INNER JOIN unnest(meter_ids) mids(id)
		ON r.meter_id = mids.id
	INNER JOIN meters m
		ON m.id = r.meter_id
	INNER JOIN cik c
		ON c.source_id = m.unit_id
	   AND c.destination_id = graphic_unit_id
	GROUP BY
		r.meter_id,
		bars.interval_start,
		c.slope,
		c.intercept
	ORDER BY
		bars.interval_start;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION group_bar_readings_unit (
	group_ids INTEGER[],
	graphic_unit_id INTEGER,
	bar_width_minutes INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP
)
	RETURNS TABLE(group_id INTEGER, reading FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	bar_width INTERVAL;
	real_tsrange TSRANGE;
	real_start_stamp TIMESTAMP;
	real_end_stamp TIMESTAMP;
	meter_ids INTEGER[];
BEGIN
	-- First get all the meter ids that will be included in one or more groups being queried.
	SELECT array_agg(DISTINCT gdm.meter_id) INTO meter_ids
	FROM groups_deep_meters gdm
	INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

	RETURN QUERY
		SELECT
			gdm.group_id AS group_id,
			SUM(readings.reading) AS reading,
			readings.start_timestamp,
			readings.end_timestamp
		FROM meter_bar_readings_unit(meter_ids, graphic_unit_id, bar_width_minutes, start_stamp, end_stamp) readings
		INNER JOIN groups_deep_meters gdm ON readings.meter_id = gdm.meter_id
		INNER JOIN unnest(group_ids) gids(id) on gdm.group_id = gids.id
		GROUP BY gdm.group_id, readings.start_timestamp, readings.end_timestamp;
END;
$$ LANGUAGE 'plpgsql';
