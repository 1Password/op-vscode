export const titleCase = (value: string): string =>
	value.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
	);

export const combineRegexp = (...values: RegExp[]) => {
	// De-dupe flags
	let flags = values.map((regexp) => regexp.flags).join("");
	flags = [...new Set(flags)].join("");
	return new RegExp(values.map((regexp) => regexp.source).join("|"), flags);
};
