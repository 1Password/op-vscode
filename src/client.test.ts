import { window } from "../test/vscode-mock";
import { OnePassword } from "./client";

const createClientMock = jest.fn<Promise<unknown>, [unknown]>();
jest.mock("@1password/sdk", () => ({
	createClient: async (config: unknown) => await createClientMock(config),
	DesktopAuth: class DesktopAuth {
		public constructor(public accountName: string) {}
	},
}));

const openMock = jest.fn<unknown, unknown[]>();
jest.mock("open", () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention
	__esModule: true,
	default: (...args: unknown[]) => openMock(...args),
}));

const account = "my.1password.com";
const nativeLibError = new Error("Native library is not available.");

describe("OnePassword", () => {
	let op: OnePassword;

	beforeEach(() => {
		jest.clearAllMocks();
		op = new OnePassword();
	});

	describe("getClient", () => {
		it("returns undefined and does not authenticate when no account is set", async () => {
			expect(await op.getClient()).toBeUndefined();
			expect(createClientMock).not.toHaveBeenCalled();
		});

		it("returns the created client", async () => {
			const client = { secrets: {} };
			createClientMock.mockResolvedValue(client);
			op.setAccount(account);
			expect(await op.getClient()).toBe(client);
		});

		it("caches the client across calls", async () => {
			createClientMock.mockResolvedValue({ secrets: {} });
			op.setAccount(account);
			await op.getClient();
			await op.getClient();
			expect(createClientMock).toHaveBeenCalledTimes(1);
		});

		it("shows an actionable notification when the desktop app integration is unavailable", async () => {
			createClientMock.mockRejectedValue(nativeLibError);
			op.setAccount(account);
			const result = await op.getClient();
			expect(result).toBeUndefined();
			expect(window.showErrorMessage).toHaveBeenCalledWith(
				expect.stringContaining(
					"Couldn't connect to the 1Password desktop app",
				),
				"Learn more",
			);
		});

		it("opens the docs when the user chooses Learn more", async () => {
			createClientMock.mockRejectedValue(nativeLibError);
			window.showErrorMessage.mockResolvedValueOnce("Learn more");
			op.setAccount(account);
			await op.getClient();
			expect(openMock).toHaveBeenCalled();
		});

		it("only notifies once on quiet paths until the account changes", async () => {
			createClientMock.mockRejectedValue(nativeLibError);
			op.setAccount(account);
			await op.getClient(false);
			await op.getClient(false);
			expect(window.showErrorMessage).toHaveBeenCalledTimes(1);
		});
	});

	describe("execute", () => {
		it("returns undefined and does not run the command without a client", async () => {
			const command = jest.fn(async () => {
				await Promise.resolve();
			});
			expect(await op.execute(command)).toBeUndefined();
			expect(command).not.toHaveBeenCalled();
		});

		it("runs the command with the client and returns its result", async () => {
			createClientMock.mockResolvedValue({ secrets: {} });
			op.setAccount(account);
			const result = await op.execute(async () => {
				await Promise.resolve();
				return "value";
			});
			expect(result).toBe("value");
		});

		it("handles errors thrown by the command", async () => {
			createClientMock.mockResolvedValue({ secrets: {} });
			op.setAccount(account);
			const result = await op.execute(async () => {
				await Promise.resolve();
				throw new Error("boom");
			});
			expect(result).toBeUndefined();
			expect(window.showErrorMessage).toHaveBeenCalled();
		});
	});
});
