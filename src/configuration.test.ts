import pckg from "../package.json";
import { configGet, configUpdate, workspace } from "../test/vscode-mock";
import { config, ConfigKey } from "./configuration";
import { CONFIG_NAMESPACE } from "./constants";

test("exports all the config keys defined by the extension", () => {
	expect(
		Object.keys(pckg.contributes.configuration[0].properties).sort(),
	).toStrictEqual(
		Object.values(ConfigKey)
			.map((k) => `${CONFIG_NAMESPACE}.${k}`)
			.sort(),
	);
});

describe("Config", () => {
	describe("configure", () => {
		it("subscribes to workspace.onDidChangeConfiguration", () => {
			const subscription = "foo";
			const spy = jest
				.spyOn(workspace, "onDidChangeConfiguration")
				.mockReturnValue(subscription);
			const context = {
				subscriptions: [],
			};
			config.configure(context as any);
			expect(spy).toHaveBeenCalled();
			expect(context.subscriptions).toEqual([subscription]);
		});
	});

	describe("get", () => {
		it("returns the value of the given key", () => {
			const spy = jest.spyOn(workspace, "getConfiguration");
			const value = true;
			configGet.mockReturnValueOnce(value);
			const result = config.get(ConfigKey.DebugEnabled);
			expect(spy).toHaveBeenCalledWith(CONFIG_NAMESPACE);
			expect(configGet).toHaveBeenCalledWith(ConfigKey.DebugEnabled);
			expect(result).toEqual(value);
		});
	});

	describe("set", () => {
		it("sets the value of the given key", async () => {
			const spy = jest.spyOn(workspace, "getConfiguration");
			await config.set(ConfigKey.DebugEnabled, true);
			expect(spy).toHaveBeenCalledWith(CONFIG_NAMESPACE);
			expect(configUpdate).toHaveBeenCalledWith(ConfigKey.DebugEnabled, true);
		});
	});
});
