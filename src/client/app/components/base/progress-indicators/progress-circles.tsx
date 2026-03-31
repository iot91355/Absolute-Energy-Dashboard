

/* eslint-disable jsdoc/require-param-description */
type Size = 'xxs' | 'xs' | 'sm' | 'md' | 'lg'

// eslint-disable-next-line jsdoc/require-returns
/**
 *
 * @param root0
 * @param root0.size
 * @param root0.min
 * @param root0.max
 * @param root0.value
 */
export function ProgressBarCircle({
	size = 'sm',
	min = 0,
	max = 100,
	value = 0
}: {
	size?: Size
	min?: number
	max?: number
	value?: number
}) {
	const pct = Math.max(0, Math.min(1, (value - (min ?? 0)) / ((max ?? 100) - (min ?? 0))));
	const diameter = size === 'xxs' ? 28 : size === 'xs' ? 36 : size === 'sm' ? 48 : size === 'md' ? 64 : 120;
	const stroke = 14;
	const radius = (diameter - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const dash = circumference * pct;

	return (
		<svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} aria-hidden>
			<circle
				cx={diameter / 2}
				cy={diameter / 2}
				r={radius}
				stroke="#e6e6e6"
				strokeWidth={stroke}
				fill="transparent"
			/>
			<circle
				cx={diameter / 2}
				cy={diameter / 2}
				r={radius}
				stroke="#393185"
				strokeWidth={stroke}
				strokeLinecap="round"
				fill="transparent"
				strokeDasharray={`${dash} ${circumference - dash}`}
				transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
			/>
		</svg>
	);
}

export default ProgressBarCircle;
