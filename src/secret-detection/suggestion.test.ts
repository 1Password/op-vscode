import { SECRET_KEY_HINT } from "./suggestion";

describe("SECRET_KEY_HINT", () => {
	it.each([
		["PRIVATE_KEY", "GCP_PRIVATE_KEY_ID"],
		["ACCESS_KEY", "AWS_ACCESS_KEY_ID"],
		["AUTH_TOKEN", "TWILIO_AUTH_TOKEN"],
		["PRIVATE_KEY", "RSA_PRIVATE_KEY"],
		["PASSWORD", "B5_PASSWORD"],
		["API_TOKEN", "EVENTS_API_TOKEN"],
	])("matches the hint %s within %s", (match, key) =>
		expect(key).toMatchRegExp(SECRET_KEY_HINT, match),
	);
});
