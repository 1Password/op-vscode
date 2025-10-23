import { SECRET_KEY_HINT } from "./suggestion";

describe("SECRET_KEY_HINT", () => {
	it.each([
		["private-key", "gcp-private-key"],
		["ACCESS_KEY", "AWS_ACCESS_KEY_ID"],
		["auth token", "twilio auth token"],
		["PRIVATE_KEY", "RSA_PRIVATE_KEY"],
		["PASSWORD", "B5_PASSWORD"],
		["api_token", "events_api_token"],
		["API TOKEN", "API TOKEN"],
	])("matches the hint %s within %s", (match, key) =>
		expect(key).toMatchRegExp(SECRET_KEY_HINT, match),
	);
});
