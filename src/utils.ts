export function parseDuration(duration: string): number {
	if (!duration) {
		return 0;
	}

	let time = 0;
	const multipliers = [1, 60, 3600];
	const split = duration.split(":").reverse();
	for (let i = 0; i < split.length; i++) {
		time += parseInt(split[i]) * multipliers[i];
	}

	return time;
}

/**
 * Gets value via a path in an object.
 *
 * @param obj Object to find path
 * @param str Path, something of the form "x.y.0.z";
 * @param dflt Value to return if path does not exist in object
 * @return The value in the object
 */
export function nav(obj: any, str: string, dflt: any = false): any {
	const split = str.split(".");
	for (let i = 0; i < split.length; i++) {
		const property = split[i].trim();
		if (obj.hasOwnProperty(property)) {
			obj = obj[property];
		} else {
			return dflt;
		}
	}
	return obj;
}

/**
 * Delay for whatever reason
 *
 * @param amount Number of milliseconds to wait
 */
export const wait = async (amount: number): Promise<any> => new Promise(res => setTimeout(res, amount ?? 500));